/**
 * Builds human-reviewable host hook fragments without touching host config.
 * Only operational metadata events are enabled; content fields are discarded.
 */

import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { assertLoopbackEndpoint } from "./eosHookBridge.js";

const bridgePath = fileURLToPath(new URL("./eosHookBridge.js", import.meta.url));
const VERIFIED_HOSTS = new Set(["codex", "claude", "cursor"]);
export const MCP_RELAY_HOSTS = new Set(["trae", "cursor", "vscode"]);
export const HOST_OBSERVATION_CONFIRMATION_SCOPE = "metadata_only_operational_status";
export const STATUS_EVENTS = Object.freeze([
  "SessionStart",
  "UserPromptSubmit",
  "PreToolUse",
  "PermissionRequest",
  "PostToolUse",
  "SubagentStart",
  "SubagentStop",
  "Stop",
  "SessionEnd"
]);

// Cursor native hooks (.cursor/hooks.json) use flat command entries and camelCase
// event names. PermissionRequest has no Cursor equivalent; PreToolUse is the closest
// pre-action signal. Cursor watches hooks.json and reloads it automatically.
export const CURSOR_HOOK_EVENT_MAP = Object.freeze({
  SessionStart: "sessionStart",
  UserPromptSubmit: "beforeSubmitPrompt",
  PreToolUse: "preToolUse",
  PostToolUse: "postToolUse",
  SubagentStart: "subagentStart",
  SubagentStop: "subagentStop",
  Stop: "stop",
  SessionEnd: "sessionEnd"
});
export const CURSOR_STATUS_EVENTS = Object.freeze(STATUS_EVENTS.filter((name) => name in CURSOR_HOOK_EVENT_MAP));

export function hookEventsForHost(host) {
  return host === "cursor" ? CURSOR_STATUS_EVENTS : STATUS_EVENTS;
}

export function buildHostHookPlan({
  host,
  workspaceDir,
  consentId,
  endpoint = "http://127.0.0.1:4173",
  nodePath = process.execPath,
  secretRoot = path.join(os.homedir(), ".experience-os", "secrets")
}) {
  requireString(host, "host");
  requireString(workspaceDir, "workspaceDir");

  if (!VERIFIED_HOSTS.has(host)) {
    return {
      host,
      status: "blocked_unverified_contract",
      canApply: false,
      writesConfig: false,
      reason: `${host} Hook 的官方输入与配置契约尚未完成验收，EOS 拒绝生成猜测配置`
    };
  }

  requireString(consentId, "consentId");
  requireString(nodePath, "nodePath");
  const safeEndpoint = assertLoopbackEndpoint(endpoint);
  const targetPath = hostHookConfigPath(host, workspaceDir);
  const consentFilePath = hostObservationTokenPath(host, workspaceDir, secretRoot);
  const args = [bridgePath, "--host", host, "--consent-file", consentFilePath, "--endpoint", safeEndpoint];
  const planEvents = [...hookEventsForHost(host)];
  let handler;
  let configFragment;

  if (host === "cursor") {
    handler = null;
    configFragment = {
      version: 1,
      hooks: Object.fromEntries(planEvents.map((eventName) => [
        CURSOR_HOOK_EVENT_MAP[eventName],
        [{ command: [nodePath, ...args, "--event", eventName].map(shellQuote).join(" "), timeout: 2 }]
      ]))
    };
  } else {
    handler = host === "claude"
      ? { type: "command", command: nodePath, args, timeout: 2, async: true }
      : { type: "command", command: [nodePath, ...args].map(shellQuote).join(" "), timeout: 2, async: true };
    configFragment = {
      ...(host === "codex" ? { description: "EOS metadata-only operational status observation" } : {}),
      hooks: Object.fromEntries(planEvents.map((eventName) => [eventName, [{ hooks: [{ ...handler }] }]]))
    };
  }

  return {
    host,
    status: "review_required",
    message: "观察许可已建立；请审查以下项目级 Hook 合并片段",
    canApply: false,
    writesConfig: false,
    targetPath,
    consentFilePath,
    secretRoot: path.resolve(secretRoot),
    mergeMode: "merge_events_never_replace_file",
    events: planEvents,
    ...(host === "cursor"
      ? {
          notes: [
            "Cursor 原生 Hook 无 PermissionRequest 事件；PreToolUse 是最接近的动作前信号。",
            "Cursor 会监听 hooks.json 变更并自动重载，无需重启即可生效。"
          ]
        }
      : {}),
    capture: {
      mode: "metadata_only",
      includes: ["event_name", "hashed_session_id", "tool_name_when_available", "permission_mode_when_available", "outcome_when_available", "observed_at"],
      excludes: ["prompt", "response", "tool_input", "tool_output", "transcript", "transcript_path", "cwd", "credentials"]
    },
    configFragment,
    reviewChecks: [
      "确认项目与宿主匹配",
      "确认仅启用运行状态事件，且 Bridge 丢弃提示词、回复、参数、输出与源码",
      "确认 EOS 地址是本机回环地址",
      "确认以合并方式写入，不覆盖已有 Hook"
    ]
  };
}

export function hostHookConfigPath(host, workspaceDir) {
  if (!VERIFIED_HOSTS.has(host)) throw new Error(`Host Hook config path is not verified for: ${host}`);
  requireString(workspaceDir, "workspaceDir");
  if (host === "codex") return path.join(path.resolve(workspaceDir), ".codex", "hooks.json");
  if (host === "cursor") return path.join(path.resolve(workspaceDir), ".cursor", "hooks.json");
  return path.join(path.resolve(workspaceDir), ".claude", "settings.json");
}

export function hostObservationTokenPath(host, workspaceDir, secretRoot = path.join(os.homedir(), ".experience-os", "secrets")) {
  if (!VERIFIED_HOSTS.has(host)) throw new Error(`Host observation token path is not verified for: ${host}`);
  requireString(workspaceDir, "workspaceDir");
  requireString(secretRoot, "secretRoot");
  const workspaceHash = createHash("sha256").update(path.resolve(workspaceDir)).digest("hex").slice(0, 24);
  return path.join(path.resolve(secretRoot), workspaceHash, `${host}.token`);
}

export function mcpRelayTokenPath(host, workspaceDir, secretRoot = path.join(os.homedir(), ".experience-os", "secrets")) {
  if (!MCP_RELAY_HOSTS.has(host)) throw new Error(`MCP relay observation token path is not verified for host: ${host}`);
  requireString(workspaceDir, "workspaceDir");
  requireString(secretRoot, "secretRoot");
  const workspaceHash = createHash("sha256").update(path.resolve(workspaceDir)).digest("hex").slice(0, 24);
  return path.join(path.resolve(secretRoot), workspaceHash, `${host}.token`);
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'"'"'`)}'`;
}

function requireString(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
}
