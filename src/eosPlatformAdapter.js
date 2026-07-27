/**
 * Unified platform adapter for Experience OS.
 *
 * Detects, reports and (where possible) starts the five integration
 * surfaces EOS relies on:
 *
 *   tray  — macOS menu-bar app (EOS.app) + launchd core agent
 *   work  — a local EOS workspace (.eos/project.json) bound to one Vault
 *   vault — the Git-backed Vault (GitVault) that stores every record
 *   codex — the Codex CLI + opt-in EOS capture relay MCP server
 *   cloud — cloud deployment via Docker (Dockerfile) and Render (render.yaml)
 *
 * The adapter is deliberately read-only and defensive: a detection never
 * throws — it reports `status: "error"` with details instead — so callers
 * can render a single health dashboard without try/catch around every
 * platform. Starting a platform (tryStartPlatform) is best-effort and also
 * never throws; it returns `{ started, message }`.
 *
 * Existing systems are reused rather than reimplemented:
 *   - work  reuses eosWorkbench.resolveWorkspaceWorkbench
 *   - codex reuses eosCodexPreflight.checkCodexIntegration
 *   - vault reuses vaultPath.resolveVaultDir + GitVault's on-disk layout
 */

import { existsSync } from "node:fs";
import { access } from "node:fs/promises";
import { spawn, spawnSync, execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveWorkspaceWorkbench } from "./eosWorkbench.js";
import { resolveVaultDir } from "./vaultPath.js";
import { checkCodexIntegration } from "./eosCodexPreflight.js";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EOS_APP_PATH = path.join(sourceRoot, "dist", "EOS.app");
const LAUNCHD_LABEL = "local.experienceos.core";
const DOCKERFILE_PATH = path.join(sourceRoot, "Dockerfile");
const RENDER_YAML_PATH = path.join(sourceRoot, "render.yaml");
const WEB_SERVER_SCRIPT = path.join(sourceRoot, "src", "webServer.js");
const VAULT_COLLECTION_DIRS = ["projects", "artifacts", "events", "skills", "work-checkpoints"];

function isMacOS() {
  return process.platform === "darwin";
}

function isWindows() {
  return process.platform === "win32";
}

function codexBinary() {
  return isWindows() ? "codex.cmd" : "codex";
}

function safeGetuid() {
  return typeof process.getuid === "function" ? String(process.getuid()) : null;
}

/**
 * Run a command asynchronously, never throwing. Returns a result envelope
 * so detection logic stays defensive. Mirrors the helper in
 * eosCodexPreflight.js but is kept local to avoid coupling.
 */
function run(command, args, timeoutMs = 10_000) {
  return new Promise((resolve) => {
    const opts = { encoding: "utf8", timeout: timeoutMs };
    const handle = (error, stdout, stderr) =>
      resolve({ ok: !error, stdout: String(stdout || ""), stderr: String(stderr || ""), error: error?.message || null });
    if (isWindows() && command.endsWith(".cmd")) {
      execFile(command, args, { ...opts, shell: true }, handle);
    } else {
      execFile(command, args, opts, handle);
    }
  });
}

/** Synchronous command runner for quick filesystem/launchctl probes. */
function runSync(command, args, timeoutMs = 5_000) {
  try {
    const result = spawnSync(command, args, { encoding: "utf8", timeout: timeoutMs, stdio: ["pipe", "pipe", "pipe"] });
    return { ok: result.status === 0, stdout: String(result.stdout || ""), stderr: String(result.stderr || ""), status: result.status };
  } catch (error) {
    return { ok: false, stdout: "", stderr: String(error.message), status: null };
  }
}

async function pathExists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

/**
 * Candidate workspace directories to probe, in priority order. Explicit
 * arguments and env always win; cwd and the EOS source root are sensible
 * fallbacks for developer machines.
 */
function resolveWorkspaceCandidates(workspaceDir) {
  const candidates = [];
  if (workspaceDir) candidates.push(path.resolve(workspaceDir));
  if (process.env.EOS_WORKSPACE_DIR) candidates.push(path.resolve(process.env.EOS_WORKSPACE_DIR));
  candidates.push(process.cwd());
  candidates.push(sourceRoot);
  return [...new Set(candidates)];
}

/** First candidate whose .eos/project.json exists (synchronous probe). */
function firstResolvableWorkspace() {
  for (const candidate of resolveWorkspaceCandidates()) {
    if (existsSync(path.join(candidate, ".eos", "project.json"))) return candidate;
  }
  return null;
}

/** Read the EOS_VAULT_DIR bound to a registered relay config (mirrors eosCodexPreflight). */
function readRegisteredVault(server) {
  const value = server?.transport?.env?.EOS_VAULT_DIR;
  return typeof value === "string" && value.trim() ? path.resolve(value) : null;
}

/**
 * Determine whether a directory looks like an initialized GitVault. A vault
 * is considered initialized if it has a `.git` directory (GitVault ran) or
 * at least one known collection subdirectory.
 */
async function probeVaultInit(dir) {
  const gitInitialized = await pathExists(path.join(dir, ".git"));
  if (gitInitialized) return { initialized: true, gitInitialized: true, evidence: ".git" };
  for (const sub of VAULT_COLLECTION_DIRS) {
    if (await pathExists(path.join(dir, sub))) {
      return { initialized: true, gitInitialized: false, evidence: sub };
    }
  }
  return { initialized: false, gitInitialized: false, evidence: null };
}

/* ------------------------------------------------------------------ *
 * Platform adapters
 * ------------------------------------------------------------------ */

const trayAdapter = {
  name: "tray",
  description: "macOS menu-bar tray app (EOS.app) and its launchd core agent",
  async detect() {
    if (!isMacOS()) {
      return { detected: false, status: "not_configured", details: { reason: "macOS only", platform: process.platform } };
    }
    const appExists = existsSync(EOS_APP_PATH);
    const plistPath = path.join(os.homedir(), "Library", "LaunchAgents", `${LAUNCHD_LABEL}.plist`);
    const plistInstalled = existsSync(plistPath);
    let launchdLoaded = false;
    const uid = safeGetuid();
    if (uid !== null) {
      launchdLoaded = runSync("launchctl", ["print", `gui/${uid}/${LAUNCHD_LABEL}`]).ok;
    }
    const detected = appExists || launchdLoaded;
    const status = launchdLoaded ? "active" : appExists ? "ready" : "not_configured";
    return {
      detected,
      status,
      details: {
        appPath: EOS_APP_PATH,
        appExists,
        launchdLabel: LAUNCHD_LABEL,
        plistPath,
        plistInstalled,
        launchdLoaded
      }
    };
  },
  async start() {
    if (!isMacOS()) return { started: false, message: "Tray app is macOS only." };
    if (!existsSync(EOS_APP_PATH)) {
      return { started: false, message: `EOS.app not found at ${EOS_APP_PATH}. Build it first: npm run macos:bundle` };
    }
    const result = runSync("open", [EOS_APP_PATH]);
    return { started: result.ok, message: result.ok ? "EOS.app launched." : `Failed to open EOS.app: ${result.stderr}` };
  },
  instructions() {
    return [
      "macOS tray app (EOS.app):",
      "  1. Install Swift / Xcode command-line tools.",
      "  2. Build the bundle:  npm run macos:bundle",
      "  3. Open it once:      open dist/EOS.app",
      "  4. (Optional) install the launchd core agent so the server runs at login:",
      "     npm run macos:install-core",
      "  5. Verify with:       npm run macos:core-status"
    ].join("\n");
  }
};

const workAdapter = {
  name: "work",
  description: "Local EOS workspace (.eos/project.json) bound to one isolated Vault",
  async detect(options = {}) {
    const candidates = resolveWorkspaceCandidates(options.workspaceDir);
    for (const candidate of candidates) {
      try {
        const config = await resolveWorkspaceWorkbench({ workspaceDir: candidate });
        return {
          detected: true,
          status: "active",
          details: {
            workspace: config.workspace,
            projectId: config.projectId,
            vaultDir: config.vaultDir,
            port: config.port
          }
        };
      } catch {
        // not a valid workspace — try the next candidate
      }
    }
    return { detected: false, status: "not_configured", details: { searched: candidates } };
  },
  async start(options = {}) {
    const dir = options.workspaceDir || process.env.EOS_WORKSPACE_DIR;
    if (!dir) {
      return { started: false, message: "No workspace specified. Pass workspaceDir or set EOS_WORKSPACE_DIR." };
    }
    try {
      const config = await resolveWorkspaceWorkbench({ workspaceDir: dir, port: options.port });
      const child = spawn(process.execPath, [WEB_SERVER_SCRIPT], {
        cwd: sourceRoot,
        env: { ...process.env, EOS_VAULT_DIR: config.vaultDir, PORT: String(config.port) },
        stdio: "ignore",
        detached: true
      });
      child.unref();
      return { started: true, pid: child.pid, message: `Workbench starting at http://localhost:${config.port}` };
    } catch (error) {
      return { started: false, message: error.message };
    }
  },
  instructions() {
    return [
      "Local workspace (workbench):",
      "  1. Pick a project directory to bind EOS to.",
      "  2. Bootstrap it:  npm run bootstrap -- /path/to/project \"Project Name\"",
      "  3. Start the workbench UI bound to that workspace:",
      "     npm run workbench -- /path/to/project 4180",
      "  4. Open http://localhost:4180 in your browser.",
      "EOS adds a visible .eos/ directory; your project files are never moved or scanned."
    ].join("\n");
  }
};

const vaultAdapter = {
  name: "vault",
  description: "Git-backed Vault (GitVault) storing all EOS records with version control",
  async detect(options = {}) {
    // A workspace-bound vault is the most relevant; fall back to the real vault.
    const dir = options.vaultDir
      || (options.workspaceDir ? path.join(options.workspaceDir, ".eos", "vault") : null)
      || resolveVaultDir("real");
    const exists = await pathExists(dir);
    if (!exists) {
      return { detected: false, status: "not_configured", details: { vaultDir: dir, reason: "vault directory does not exist" } };
    }
    const probe = await probeVaultInit(dir);
    const detected = probe.initialized;
    const status = detected ? "active" : "ready";
    return {
      detected,
      status,
      details: {
        vaultDir: dir,
        gitInitialized: probe.gitInitialized,
        evidence: probe.evidence,
        archiveDir: path.join(sourceRoot, "work", "vault-archive")
      }
    };
  },
  async start() {
    return { started: false, message: "The Vault is initialized on demand by GitVault; there is no separate process to start." };
  },
  instructions() {
    return [
      "Git-backed Vault (GitVault):",
      "  The Vault is created automatically when you bootstrap a workspace or",
      "  start the web server. To use a custom location, set EOS_VAULT_DIR.",
      "  Default real vault:  work/vaults",
      "  Default demo vault:  work/fixtures",
      "  Git is required for version control; without it EOS runs in no-VC mode."
    ].join("\n");
  }
};

const codexAdapter = {
  name: "codex",
  description: "Codex CLI + EOS capture relay MCP server (opt-in, workspace-scoped)",
  async detect(options = {}) {
    const codex = codexBinary();
    const version = await run(codex, ["--version"]);
    if (!version.ok) {
      return { detected: false, status: "not_configured", details: { reason: "codex CLI not found", error: version.error } };
    }
    // Codex is installed — inspect the opt-in relay registration.
    const registered = await run(codex, ["mcp", "get", "experience-os", "--json"]);
    let registeredConfig = null;
    if (registered.ok) {
      try { registeredConfig = JSON.parse(registered.stdout); } catch { registeredConfig = null; }
    }
    const boundVaultDir = readRegisteredVault(registeredConfig);
    const isRegistered = Boolean(registeredConfig);

    // Reuse the full preflight when a workspace is resolvable, so the
    // active-for-workspace flag is accurate.
    let activeForWorkspace = null;
    let workspaceInfo = null;
    const wsDir = options.workspaceDir || process.env.EOS_WORKSPACE_DIR || firstResolvableWorkspace();
    if (wsDir) {
      try {
        const full = await checkCodexIntegration({ workspaceDir: wsDir });
        activeForWorkspace = full.codex.activeForWorkspace;
        workspaceInfo = { workspace: full.workspace, projectId: full.projectId, vaultDir: full.vaultDir };
      } catch {
        // workspace not resolvable — report a lightweight status only
      }
    }
    const status = isRegistered && activeForWorkspace === true ? "active" : "ready";
    return {
      detected: true,
      status,
      details: {
        version: version.stdout.trim(),
        eosRelayRegistered: isRegistered,
        boundVaultDir,
        activeForWorkspace,
        workspace: workspaceInfo
      }
    };
  },
  async start(options = {}) {
    const wsDir = options.workspaceDir || process.env.EOS_WORKSPACE_DIR || firstResolvableWorkspace();
    if (!wsDir) {
      return { started: false, message: "No workspace to bind the relay to. Bootstrap one first: npm run bootstrap -- <dir>" };
    }
    try {
      const full = await checkCodexIntegration({ workspaceDir: wsDir });
      return { started: false, message: "Codex MCP relay is opt-in. Run this command to register it:", command: full.installCommand };
    } catch (error) {
      return { started: false, message: error.message };
    }
  },
  instructions() {
    return [
      "Codex CLI + EOS MCP relay:",
      "  1. Install the Codex CLI and ensure `codex` is on your PATH.",
      "  2. Bootstrap a workspace:  npm run bootstrap -- /path/to/project",
      "  3. Register the relay (opt-in, workspace-scoped):",
      "     npm run codex:preflight -- /path/to/project   # prints the exact command",
      "  The relay never creates approvals or promotes assets; it only captures",
      "  explicitly consented fragments and reads verified experience."
    ].join("\n");
  }
};

const cloudAdapter = {
  name: "cloud",
  description: "Cloud deployment via Docker (Dockerfile) and Render (render.yaml)",
  async detect() {
    const dockerfileExists = existsSync(DOCKERFILE_PATH);
    const renderYamlExists = existsSync(RENDER_YAML_PATH);
    const dockerVersion = await run("docker", ["--version"]);
    const dockerDaemon = dockerVersion.ok ? await run("docker", ["info"], 8_000) : null;
    const renderVersion = await run("render", ["--version"], 6_000);
    const detected = dockerfileExists || renderYamlExists || dockerVersion.ok || renderVersion.ok;
    let status = "not_configured";
    if (dockerDaemon?.ok) status = "active";
    else if (dockerfileExists || renderYamlExists) status = "ready";
    return {
      detected,
      status,
      details: {
        dockerfile: { path: DOCKERFILE_PATH, exists: dockerfileExists },
        renderYaml: { path: RENDER_YAML_PATH, exists: renderYamlExists },
        docker: {
          installed: dockerVersion.ok,
          version: dockerVersion.ok ? dockerVersion.stdout.trim() : null,
          daemonRunning: dockerDaemon?.ok ?? false
        },
        render: {
          installed: renderVersion.ok,
          version: renderVersion.ok ? renderVersion.stdout.trim() : null
        }
      }
    };
  },
  async start() {
    return {
      started: false,
      message: "Cloud deployment is managed via Docker / Render. Use: docker build -t experience-os .  or  render deploy"
    };
  },
  instructions() {
    return [
      "Cloud deployment (Docker / Render):",
      "  Docker:",
      "    1. Install Docker.",
      "    2. Build the image:  docker build -t experience-os .",
      "    3. Run it:           docker run -p 8080:8080 -v eos-data:/var/data experience-os",
      "  Render:",
      "    1. Install the Render CLI.",
      "    2. Deploy using render.yaml:  render deploy",
      "  The Dockerfile builds the React workbench then ships the Node runtime;",
      "  render.yaml wires the private-beta environment variables and a 1GB disk."
    ].join("\n");
  }
};

/* ------------------------------------------------------------------ *
 * Registry + public API
 * ------------------------------------------------------------------ */

const REGISTRY = new Map([
  ["tray", trayAdapter],
  ["work", workAdapter],
  ["vault", vaultAdapter],
  ["codex", codexAdapter],
  ["cloud", cloudAdapter]
]);

/**
 * Platform definitions (metadata only). Adapters are obtained via
 * getPlatformAdapter(name).
 */
export const PLATFORMS = Object.freeze(
  [...REGISTRY.values()].map((adapter) =>
    Object.freeze({ name: adapter.name, description: adapter.description })
  )
);

/**
 * Detect a single platform. Never throws — detection errors are reported as
 * `status: "error"`.
 *
 * @param {string} name platform name (tray | work | vault | codex | cloud)
 * @param {object} [options] platform-specific hints (workspaceDir, vaultDir, port)
 * @returns {Promise<{detected: boolean, status: string, details: object}>}
 */
export async function detectPlatform(name, options = {}) {
  const adapter = getPlatformAdapter(name);
  try {
    return await adapter.detect(options);
  } catch (error) {
    return { detected: false, status: "error", details: { error: error.message } };
  }
}

/**
 * Overall health of every platform, plus a roll-up summary.
 *
 * @param {object} [options] passed through to each platform's detect()
 * @returns {Promise<{platforms: object, summary: object}>}
 */
export async function checkPlatformHealth(options = {}) {
  const platforms = {};
  for (const { name } of PLATFORMS) {
    platforms[name] = await detectPlatform(name, options);
  }
  const statuses = Object.values(platforms);
  const summary = {
    total: PLATFORMS.length,
    detected: statuses.filter((r) => r.detected).length,
    active: statuses.filter((r) => r.status === "active").length,
    ready: statuses.filter((r) => r.status === "ready").length,
    notConfigured: statuses.filter((r) => r.status === "not_configured").length,
    errors: statuses.filter((r) => r.status === "error").length
  };
  return { platforms, summary };
}

/**
 * Return the adapter object for a platform.
 *
 * @param {string} name platform name
 * @returns {{name, description, detect, start, instructions}}
 * @throws {Error} if the platform name is unknown
 */
export function getPlatformAdapter(name) {
  const adapter = REGISTRY.get(name);
  if (!adapter) {
    throw new Error(`Unknown EOS platform: ${name}. Known platforms: ${[...REGISTRY.keys()].join(", ")}`);
  }
  return adapter;
}

/**
 * Best-effort attempt to start / connect to a platform (e.g. open the tray
 * app, launch the workbench). Never throws.
 *
 * @param {string} name platform name
 * @param {object} [options] platform-specific hints
 * @returns {Promise<{started: boolean, message: string, [pid]: number, [command]: string}>}
 */
export async function tryStartPlatform(name, options = {}) {
  const adapter = getPlatformAdapter(name);
  try {
    return await adapter.start(options);
  } catch (error) {
    return { started: false, message: error.message };
  }
}

/**
 * Human-readable setup instructions for a platform that is not yet
 * configured.
 *
 * @param {string} name platform name
 * @returns {string} non-empty setup instructions
 * @throws {Error} if the platform name is unknown
 */
export function getInstallInstructions(name) {
  return getPlatformAdapter(name).instructions();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkPlatformHealth()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => { console.error(`EOS platform adapter failed: ${error.message}`); process.exitCode = 1; });
}
