/**
 * Verified host integrations for Experience OS.
 *
 * A host is never called "compatible" merely because an application or an
 * EOS-internal component exists. Evidence advances in this order:
 *
 *   detected -> configured -> callable -> observing
 *
 * - detected: the real AI host is installed.
 * - configured: that host has an EOS MCP registration for the current Vault.
 * - callable: the host confirms registration and the EOS relay passes a real
 *   MCP initialize + tools/list handshake.
 * - observing: EOS has received a consented event attributed to that host.
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveWorkspaceWorkbench } from "./eosWorkbench.js";
import { EOS_RELAY_PATH, probeEosMcpRelay } from "./eosMcpProbe.js";
import { resolveVaultDir } from "./vaultPath.js";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const home = os.homedir();

const APP_PATHS = Object.freeze({
  codex: [
    "/Applications/Codex.app",
    path.join(home, "Applications", "Codex.app")
  ],
  claude: [
    "/Applications/Claude.app"
  ],
  cursor: [
    "/Applications/Cursor.app"
  ],
  trae: [
    "/Applications/Trae.app",
    "/Applications/Trae CN.app",
    "/Applications/TRAE SOLO.app",
    "/Applications/TRAE SOLO CN.app"
  ],
  vscode: [
    "/Applications/Visual Studio Code.app",
    "/Applications/Visual Studio Code - Insiders.app"
  ]
});

const COMMANDS = Object.freeze({
  codex: [
    "codex",
    path.join(home, ".local", "bin", "codex")
  ],
  claude: ["claude"],
  cursor: [
    "cursor-agent",
    "cursor",
    "/Applications/Cursor.app/Contents/Resources/app/bin/cursor"
  ],
  trae: [
    "trae",
    "trae-cn",
    "/Applications/Trae CN.app/Contents/Resources/app/bin/trae-cn",
    "/Applications/TRAE SOLO CN.app/Contents/Resources/app/bin/trae-solo-cn"
  ],
  vscode: [
    "code",
    "code-insiders",
    "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
  ]
});

const HOST_DEFINITIONS = Object.freeze([
  {
    name: "codex",
    label: "Codex",
    description: "OpenAI Codex desktop、CLI 与 IDE 扩展共享 MCP 配置；支持经许可的运行状态 Hooks。",
    hooks: "supported",
    observedAliases: ["codex"]
  },
  {
    name: "claude",
    label: "Claude Code",
    description: "Claude Code 支持本地 MCP，并提供会话、提示、工具调用和结束事件 Hooks。",
    hooks: "supported",
    observedAliases: ["claude", "claude-code"]
  },
  {
    name: "cursor",
    label: "Cursor",
    description: "Cursor IDE 与 CLI 支持 MCP 与项目级 .cursor/hooks.json 运行状态 Hooks（会话、提示、工具前后与结束事件）。",
    hooks: "supported",
    observedAliases: ["cursor", "cursor-agent"]
  },
  {
    name: "trae",
    label: "TRAE",
    description: "TRAE IDE / TRAE Work 官方确认支持 MCP；配置入口与运行状态 Hook 仍需逐版本验收。",
    hooks: "mcp_only",
    observedAliases: ["trae", "trae-work", "trae-ide"]
  },
  {
    name: "vscode",
    label: "VS Code",
    description: "VS Code Agent 完整支持 MCP，并允许扩展程序注册 MCP Server Definition Provider。",
    hooks: "extension",
    observedAliases: ["vscode", "github-copilot"]
  }
]);

function run(command, args, timeoutMs = 8_000) {
  return new Promise((resolve) => {
    execFile(command, args, { encoding: "utf8", timeout: timeoutMs }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        stdout: String(stdout || ""),
        stderr: String(stderr || ""),
        error: error?.message || null
      });
    });
  });
}

async function detectHost(name) {
  for (const command of COMMANDS[name] || []) {
    const result = await run(command, ["--version"], 4_000);
    if (result.ok) {
      return {
        installed: true,
        command,
        version: result.stdout.trim().split("\n")[0] || null,
        appPath: (APP_PATHS[name] || []).find(existsSync) || null
      };
    }
  }
  const appPath = (APP_PATHS[name] || []).find(existsSync) || null;
  return {
    installed: Boolean(appPath),
    command: null,
    version: null,
    appPath
  };
}

async function resolveWorkspace(options = {}) {
  if (options.workspaceDir) {
    const explicitWorkspace = path.resolve(options.workspaceDir);
    try {
      return await resolveWorkspaceWorkbench({ workspaceDir: explicitWorkspace });
    } catch {
      // An explicit caller boundary must never silently fall through to cwd.
      return {
        workspace: explicitWorkspace,
        vaultDir: options.vaultDir ? path.resolve(options.vaultDir) : null
      };
    }
  }

  const candidates = [
    process.env.EOS_WORKSPACE_DIR,
    process.cwd(),
    sourceRoot
  ].filter(Boolean);

  for (const candidate of [...new Set(candidates.map((item) => path.resolve(item)))]) {
    try {
      return await resolveWorkspaceWorkbench({ workspaceDir: candidate });
    } catch {
      // Keep looking for a real EOS workspace.
    }
  }
  return null;
}

async function readJson(file) {
  try {
    return { file, value: JSON.parse(await readFile(file, "utf8")), error: null };
  } catch (error) {
    return {
      file,
      value: null,
      error: error.code === "ENOENT" ? null : error.message
    };
  }
}

function relayEntryFromConfig(config, container) {
  const entries = config?.[container];
  if (!entries || typeof entries !== "object") return null;
  return entries["experience-os"] ?? entries.experience_os ?? null;
}

function entryPointsToEosRelay(entry) {
  if (!entry || typeof entry !== "object") return false;
  const args = Array.isArray(entry.args) ? entry.args.map(String) : [];
  return args.some((arg) => path.basename(arg) === "eosRelayMcp.js");
}

function configuredVault(entry) {
  const value = entry?.env?.EOS_VAULT_DIR;
  return typeof value === "string" && value.trim() ? path.resolve(value) : null;
}

async function findFileRegistration(candidates, container) {
  for (const candidate of candidates.filter(Boolean)) {
    const parsed = await readJson(candidate);
    if (parsed.error) {
      return {
        registered: false,
        configPath: candidate,
        entry: null,
        error: parsed.error
      };
    }
    const entry = relayEntryFromConfig(parsed.value, container);
    if (entry) {
      return {
        registered: entryPointsToEosRelay(entry),
        configPath: candidate,
        entry,
        error: null
      };
    }
  }
  return { registered: false, configPath: null, entry: null, error: null };
}

function samePath(left, right) {
  if (!left || !right) return null;
  return path.resolve(left) === path.resolve(right);
}

function observedFor(definition, options) {
  const observed = new Set((options.observedHosts || []).map((item) => String(item).toLowerCase()));
  return definition.observedAliases.some((alias) => observed.has(alias));
}

function statusForProof(proof) {
  if (!proof.hostInstalled) return "not_installed";
  const callable = proof.mcpRegistered
    && proof.vaultBound === true
    && proof.hostConfirmed
    && proof.relayConformant;
  if (callable && proof.eventObserved) return "observing";
  if (callable) return "callable";
  if (proof.mcpRegistered) return "configured";
  return "available";
}

const MCP_RELAY_OBSERVED_HOSTS = new Set(["trae", "cursor", "vscode"]);

function relayConfig(vaultDir, host = null) {
  const relayHost = String(host || "").trim().toLowerCase();
  return {
    command: process.execPath,
    args: [EOS_RELAY_PATH],
    env: {
      EOS_VAULT_DIR: vaultDir,
      EOS_CAPTURE_POLICY: "strict_permit",
      // Hook-less hosts get relay self-observation instead of hooks.
      ...(MCP_RELAY_OBSERVED_HOSTS.has(relayHost) ? { EOS_RELAY_HOST: relayHost } : {})
    }
  };
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function codexCommand(vaultDir) {
  return [
    "codex mcp add experience-os",
    `--env EOS_VAULT_DIR=${shellQuote(vaultDir)}`,
    "--env EOS_CAPTURE_POLICY=strict_permit",
    "--",
    shellQuote(process.execPath),
    shellQuote(EOS_RELAY_PATH)
  ].join(" ");
}

function claudeCommand(vaultDir) {
  return [
    "claude mcp add --scope project experience-os",
    `--env EOS_VAULT_DIR=${shellQuote(vaultDir)}`,
    "--env EOS_CAPTURE_POLICY=strict_permit",
    "--",
    shellQuote(process.execPath),
    shellQuote(EOS_RELAY_PATH)
  ].join(" ");
}

export function buildPlatformConnectionPlan(name, workspace, vaultDir) {
  const config = relayConfig(vaultDir, name);
  if (name === "codex") {
    return {
      mode: "command",
      command: codexCommand(vaultDir),
      configPath: path.join(home, ".codex", "config.toml")
    };
  }
  if (name === "claude") {
    return {
      mode: "command",
      command: claudeCommand(vaultDir),
      configPath: path.join(workspace, ".mcp.json")
    };
  }
  if (name === "cursor") {
    return {
      mode: "json",
      configPath: path.join(workspace, ".cursor", "mcp.json"),
      config: { mcpServers: { "experience-os": config } }
    };
  }
  if (name === "trae") {
    return {
      mode: "manual",
      configPath: "TRAE 设置中的 MCP 管理界面（公开稳定文件路径待验证）",
      config: { mcpServers: { "experience-os": config } },
      manualSteps: [
        "打开 TRAE 的 MCP 管理界面。",
        "新增 stdio MCP Server，并填入下方配置。",
        "在 TRAE 内确认 experience-os 工具可见，再回到 EOS 验收。"
      ]
    };
  }
  return {
    mode: "json",
    configPath: path.join(workspace, ".vscode", "mcp.json"),
    config: {
      servers: {
        "experience-os": {
          type: "stdio",
          ...config
        }
      }
    }
  };
}

async function detectCodexRegistration(currentVault, command = "codex") {
  const result = await run(command, ["mcp", "get", "experience-os", "--json"]);
  if (!result.ok) {
    return {
      registered: false,
      hostConfirmed: false,
      boundVaultDir: null,
      vaultBound: null,
      configPath: path.join(home, ".codex", "config.toml"),
      error: null
    };
  }
  try {
    const parsed = JSON.parse(result.stdout);
    const boundVaultDir = configuredVault(parsed.transport);
    return {
      registered: entryPointsToEosRelay(parsed.transport),
      hostConfirmed: true,
      boundVaultDir,
      vaultBound: boundVaultDir && currentVault ? samePath(boundVaultDir, currentVault) : null,
      configPath: path.join(home, ".codex", "config.toml"),
      error: null
    };
  } catch (error) {
    return {
      registered: false,
      hostConfirmed: false,
      boundVaultDir: null,
      vaultBound: null,
      configPath: path.join(home, ".codex", "config.toml"),
      error: `Codex returned invalid MCP configuration: ${error.message}`
    };
  }
}

async function detectClaudeRegistration(workspace, currentVault) {
  const result = await run("claude", ["mcp", "get", "experience-os"]);
  const file = await findFileRegistration([
    path.join(workspace, ".mcp.json"),
    path.join(home, ".claude", "mcp.json")
  ], "mcpServers");
  const boundVaultDir = configuredVault(file.entry);
  return {
    registered: result.ok || file.registered,
    hostConfirmed: result.ok,
    boundVaultDir,
    vaultBound: boundVaultDir && currentVault ? samePath(boundVaultDir, currentVault) : null,
    configPath: file.configPath || path.join(workspace, ".mcp.json"),
    error: file.error
  };
}

async function detectFileRegistration(name, workspace, currentVault) {
  const definitions = {
    cursor: {
      container: "mcpServers",
      candidates: [
        path.join(workspace, ".cursor", "mcp.json"),
        path.join(home, ".cursor", "mcp.json")
      ]
    },
    trae: {
      container: "mcpServers",
      candidates: [
        path.join(workspace, ".trae", "mcp.json"),
        path.join(home, ".trae", "mcp.json"),
        path.join(home, "Library", "Application Support", "Trae", "User", "settings", "mcp.json")
      ]
    },
    vscode: {
      container: "servers",
      candidates: [
        path.join(workspace, ".vscode", "mcp.json"),
        path.join(home, "Library", "Application Support", "Code", "User", "mcp.json")
      ]
    }
  };
  const definition = definitions[name];
  const file = await findFileRegistration(definition.candidates, definition.container);
  const boundVaultDir = configuredVault(file.entry);
  return {
    registered: file.registered,
    hostConfirmed: false,
    boundVaultDir,
    vaultBound: boundVaultDir && currentVault ? samePath(boundVaultDir, currentVault) : null,
    configPath: file.configPath || definition.candidates[0],
    error: file.error
  };
}

function instructionsFor(name) {
  const common = [
    "连接后请在宿主中确认 experience-os 工具可见。",
    "调用 eos_project_readiness 做只读验收。",
    "严格许可默认开启；没有人类许可时，EOS 不保存协作正文。"
  ];
  const first = {
    codex: "使用 Codex MCP 配置注册 EOS；桌面、CLI 与 IDE 扩展共享该配置。",
    claude: "使用 claude mcp add 注册 EOS；需要自动事件时，再安装项目级 Claude Hooks。",
    cursor: "将 EOS stdio server 合并进 .cursor/mcp.json；需要自动事件时，再安装项目级 .cursor/hooks.json Hooks（不要覆盖已有条目）。",
    trae: "在 TRAE 的 MCP 管理界面注册 EOS stdio server（env 含 EOS_RELAY_HOST=trae）；注册后 EOS 中继将以仅元数据事件回报会话与工具活动，无需 Hook。",
    vscode: "将 EOS server 合并进 .vscode/mcp.json，或由后续 EOS VS Code 扩展注册。"
  }[name];
  return [first, ...common].join("\n");
}

function makeAdapter(definition) {
  return {
    ...definition,
    async detect(options = {}) {
      const host = await detectHost(definition.name);
      const workspaceConfig = await resolveWorkspace(options);
      const workspace = workspaceConfig?.workspace || options.workspaceDir || process.cwd();
      const currentVault = options.vaultDir || workspaceConfig?.vaultDir || resolveVaultDir("real");
      const relay = options.relayProbe || await probeEosMcpRelay({ vaultDir: currentVault });

      let registration;
      if (definition.name === "codex") {
        registration = host.installed
          ? await detectCodexRegistration(currentVault, host.command)
          : { registered: false, hostConfirmed: false, boundVaultDir: null, vaultBound: null, configPath: null, error: null };
      } else if (definition.name === "claude") {
        registration = host.installed
          ? await detectClaudeRegistration(workspace, currentVault)
          : { registered: false, hostConfirmed: false, boundVaultDir: null, vaultBound: null, configPath: null, error: null };
      } else {
        registration = await detectFileRegistration(definition.name, workspace, currentVault);
      }

      const proof = {
        hostInstalled: host.installed,
        mcpRegistered: registration.registered,
        relayConformant: relay.ok,
        hostConfirmed: registration.hostConfirmed,
        vaultBound: registration.vaultBound,
        eventObserved: observedFor(definition, options)
      };
      const status = registration.error ? "error" : statusForProof(proof);

      return {
        detected: host.installed,
        status,
        compatibilityLevel: {
          not_installed: 0,
          available: 1,
          configured: 2,
          callable: 3,
          observing: 4,
          error: 0
        }[status],
        proof,
        details: {
          label: definition.label,
          version: host.version,
          command: host.command,
          appPath: host.appPath,
          workspace,
          currentVault,
          configuredVault: registration.boundVaultDir,
          configPath: registration.configPath,
          hooks: definition.hooks,
          relay: {
            ok: relay.ok,
            serverInfo: relay.serverInfo,
            protocolVersion: relay.protocolVersion,
            toolCount: relay.toolCount,
            error: relay.error
          },
          error: registration.error
        },
        connection: buildPlatformConnectionPlan(definition.name, workspace, currentVault)
      };
    },
    async start(options = {}) {
      const workspaceConfig = await resolveWorkspace(options);
      const workspace = workspaceConfig?.workspace || options.workspaceDir || process.cwd();
      const vaultDir = options.vaultDir || workspaceConfig?.vaultDir || resolveVaultDir("real");
      const plan = buildPlatformConnectionPlan(definition.name, workspace, vaultDir);
      return {
        started: false,
        action: "human_configuration_required",
        message: "EOS 不会静默修改其他 AI 工具的配置。请审查并应用下面的连接方案，然后返回本页验收。",
        ...plan
      };
    },
    instructions() {
      return instructionsFor(definition.name);
    }
  };
}

const REGISTRY = new Map(HOST_DEFINITIONS.map((definition) => [
  definition.name,
  makeAdapter(definition)
]));

export const PLATFORMS = Object.freeze(HOST_DEFINITIONS.map((definition) => Object.freeze({
  name: definition.name,
  label: definition.label,
  description: definition.description,
  hooks: definition.hooks
})));

export async function detectPlatform(name, options = {}) {
  try {
    return await getPlatformAdapter(name).detect(options);
  } catch (error) {
    return {
      detected: false,
      status: "error",
      compatibilityLevel: 0,
      proof: {
        hostInstalled: false,
        mcpRegistered: false,
        relayConformant: false,
        hostConfirmed: false,
        vaultBound: null,
        eventObserved: false
      },
      details: { error: error.message }
    };
  }
}

export async function checkPlatformHealth(options = {}) {
  const relayProbe = await probeEosMcpRelay({ vaultDir: options.vaultDir });
  const platforms = {};
  for (const { name } of PLATFORMS) {
    platforms[name] = await detectPlatform(name, { ...options, relayProbe });
  }
  const results = Object.values(platforms);
  return {
    platforms,
    relay: relayProbe,
    summary: {
      total: results.length,
      installed: results.filter((result) => result.proof?.hostInstalled).length,
      configured: results.filter((result) => result.proof?.mcpRegistered).length,
      callable: results.filter((result) => result.compatibilityLevel >= 3).length,
      observing: results.filter((result) => result.compatibilityLevel >= 4).length,
      errors: results.filter((result) => result.status === "error").length
    }
  };
}

export function getPlatformAdapter(name) {
  const adapter = REGISTRY.get(name);
  if (!adapter) {
    throw new Error(`Unknown EOS integration host: ${name}. Known hosts: ${[...REGISTRY.keys()].join(", ")}`);
  }
  return adapter;
}

export async function tryStartPlatform(name, options = {}) {
  try {
    return await getPlatformAdapter(name).start(options);
  } catch (error) {
    return { started: false, message: error.message };
  }
}

export function getInstallInstructions(name) {
  return getPlatformAdapter(name).instructions();
}

export async function diagnosePlatform(name, options = {}) {
  const result = await detectPlatform(name, options);
  const advice = [];

  if (result.status === "not_installed") {
    advice.push(`先安装 ${PLATFORMS.find((host) => host.name === name)?.label || name}。`);
  } else if (result.status === "available") {
    advice.push("宿主已安装，但 EOS MCP 尚未注册。");
  } else if (result.status === "configured") {
    if (result.proof?.vaultBound === false) {
      advice.push("EOS MCP 已注册，但绑定的是另一个 Vault。");
    }
    if (!result.proof?.hostConfirmed) {
      advice.push("检测到配置文件，但宿主尚未提供已加载该配置的证据。");
    }
    if (!result.proof?.relayConformant) {
      advice.push("EOS Relay 未通过 MCP 握手，不能标记为可调用。");
    }
  } else if (result.status === "callable") {
    advice.push("MCP 已可调用；只有收到真实、经许可的宿主事件后才会升级为“已观测”。");
  } else if (result.status === "error") {
    advice.push(result.details?.error || "连接检测发生错误。");
  }

  return {
    status: result.status,
    healthy: result.compatibilityLevel >= 3,
    advice,
    result
  };
}
