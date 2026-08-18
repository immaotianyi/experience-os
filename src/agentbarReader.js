/**
 * AgentBar 协议读取器（frontend reader for the ~/.agentbar file protocol）。
 *
 * 协议（MIT · michalstrnadel/AgentBar docs/protocol.md）：各宿主 Hook 或 watcher
 * 以原子写向 state.d/<sessionId>.json 发布仅元数据会话状态；本模块作为协议
 * 前端读取目录，套用协议修剪规则（pid 存活 + 24h 时效 + started 门控），把状态
 * 转换映射为经许可的 host-observation 事件，复用 consent+captureToken 管线。
 *
 * 状态映射（三灯）：
 *   新鲜会话首次出现 → SessionStart（工作态流动）
 *   state permission / question → PermissionRequest（黄闪）
 *   state thinking / tool 且签名(ts)变化 → PostToolUse（心跳维持流动）
 *   state done → Stop（绿闪）
 *   文件删除 / pid 死亡 / 超 24h → SessionEnd（熄灭）
 *
 * 关键不变量：
 *   1. 只读 state.d JSON 的元数据字段；prompt/model 等可选内容字段一律丢弃。
 *   2. 解析失败的文件只跳过；无凭据只跳过上报；读取异常永不影响 Core。
 *   3. EOS 自己经 session-log watcher 发布的宿主（trae 等）由调用方 skipHosts
 *      排除，避免同宿主双通道重复上报。
 */

import { createHash, randomBytes } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { createHostCredentialResolver, inferWorkspaceDir } from "./eosCredentialResolver.js";

const AGENT_TO_HOST = Object.freeze({
  claude: "claude",
  codex: "codex",
  cursor: "cursor",
  trae: "trae",
  vscode: "vscode"
});

const SESSION_FILE_RE = /^[A-Za-z0-9_.-]{1,64}\.json$/;
const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 2_500;

const TERMINAL_STATE_EVENT = Object.freeze({
  permission: "PermissionRequest",
  question: "PermissionRequest",
  done: "Stop"
});
const WORKING_STATES = new Set(["thinking", "tool"]);

export function defaultAgentbarStateDir() {
  if (process.env.EOS_AGENTBAR_DIR) {
    return path.join(process.env.EOS_AGENTBAR_DIR, "state.d");
  }
  return path.join(os.homedir(), ".agentbar", "state.d");
}

export function createAgentbarReader({
  stateDir = defaultAgentbarStateDir(),
  agentHosts = AGENT_TO_HOST,
  skipHosts = [],
  vaultDir,
  listConsents,
  record,
  secretRoot = process.env.EOS_SECRET_ROOT || path.join(os.homedir(), ".experience-os", "secrets"),
  now = Date.now,
  intervalMs = DEFAULT_INTERVAL_MS,
  log = (message) => process.stderr.write(`[EOS AgentbarReader] ${message}\n`)
} = {}) {
  if (typeof listConsents !== "function") throw new Error("listConsents is required");
  if (typeof record !== "function") throw new Error("record is required");

  const workspaceDir = inferWorkspaceDir(vaultDir);
  const salt = randomBytes(32).toString("hex");
  const skipped = new Set(skipHosts);
  const resolver = createHostCredentialResolver({ listConsents, secretRoot, now, log });
  const sessions = new Map();
  let timer = null;
  let ticking = false;

  function opaque(value) {
    return `sha256:${createHash("sha256").update(`${salt}\0${value}`, "utf8").digest("hex")}`;
  }

  async function emit(host, eventName, { sessionId, signature = null } = {}) {
    const credential = await resolver.resolve(host, workspaceDir);
    if (!credential) return;
    const observation = {
      host,
      eventName,
      sessionHash: opaque(`${host}:${sessionId}`),
      turnHash: signature ? opaque(signature) : null,
      toolName: "agentbar-protocol",
      permissionMode: null,
      observedAt: new Date(now()).toISOString()
    };
    await record({ consentId: credential.consentId, captureToken: credential.captureToken, observation });
  }

  function pidAlive(pid) {
    if (!Number.isInteger(pid) || pid <= 0) return true;
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return error?.code === "EPERM";
    }
  }

  async function endSession(sessionId, entry) {
    sessions.delete(sessionId);
    if (!entry.ended) {
      entry.ended = true;
      await emit(entry.host, "SessionEnd", { sessionId });
    }
  }

  async function readStateFile(fileName) {
    try {
      const raw = await readFile(path.join(stateDir, fileName), "utf8");
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch {
      return null;
    }
  }

  async function tick() {
    if (ticking) return;
    ticking = true;
    try {
      const dirents = await readdir(stateDir, { withFileTypes: true }).catch(() => []);
      const listed = new Set();

      for (const dirent of dirents) {
        if (!dirent.isFile() || !SESSION_FILE_RE.test(dirent.name)) continue;
        const sessionId = dirent.name.slice(0, -5);
        listed.add(sessionId);
        await ingest(sessionId);
      }

      for (const [sessionId, entry] of sessions) {
        if (!listed.has(sessionId)) {
          await endSession(sessionId, entry);
        }
      }
    } catch (error) {
      log(`tick failed: ${safeDetail(error)}`);
    } finally {
      ticking = false;
    }
  }

  async function ingest(sessionId) {
    const payload = await readStateFile(`${sessionId}.json`);
    if (!payload) {
      const tracked = sessions.get(sessionId);
      if (tracked && tracked.corruptStreak >= 1) {
        // 原子写保证不会读到半文件；连续两次损坏视为会话消失，避免僵尸跟踪。
        await endSession(sessionId, tracked);
      } else if (tracked) {
        tracked.corruptStreak = 1;
      }
      return;
    }

    const host = agentHosts[String(payload.agent || "").toLowerCase()];
    if (!host || skipped.has(host)) {
      sessions.delete(sessionId);
      return;
    }
    if (payload.started === false) return;

    const nowMs = now();
    const tsSeconds = Number(payload.ts);
    const staleByAge = Number.isFinite(tsSeconds) && tsSeconds > 0
      && nowMs - tsSeconds * 1000 > MAX_SESSION_AGE_MS;
    const deadPid = !pidAlive(Number(payload.pid));

    const tracked = sessions.get(sessionId);
    if (staleByAge || deadPid) {
      if (tracked) await endSession(sessionId, tracked);
      return;
    }

    const state = String(payload.state || "idle");
    const signature = `${state}:${Number.isFinite(tsSeconds) ? tsSeconds : 0}`;

    if (!tracked) {
      sessions.set(sessionId, { host, lastSignature: signature, ended: false, corruptStreak: 0 });
      await emit(host, "SessionStart", { sessionId });
      if (TERMINAL_STATE_EVENT[state]) {
        await emit(host, TERMINAL_STATE_EVENT[state], { sessionId, signature });
      }
      return;
    }

    tracked.corruptStreak = 0;
    if (tracked.lastSignature === signature) return;
    tracked.lastSignature = signature;

    if (TERMINAL_STATE_EVENT[state]) {
      await emit(host, TERMINAL_STATE_EVENT[state], { sessionId, signature });
    } else if (WORKING_STATES.has(state)) {
      await emit(host, "PostToolUse", { sessionId, signature });
    }
  }

  return {
    agentHosts: Object.keys(AGENT_TO_HOST),
    async start() {
      if (timer) return;
      await tick();
      timer = setInterval(() => {
        void tick();
      }, intervalMs);
      timer.unref?.();
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
      sessions.clear();
    },
    tick
  };
}

function safeDetail(error) {
  return String(error?.message || error || "unknown").slice(0, 200);
}
