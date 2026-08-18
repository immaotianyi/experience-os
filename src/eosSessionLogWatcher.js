/**
 * 统一原生会话日志观察器（Unified native session-log watcher）。
 *
 * 原理（AgentBar watcher 模式的 EOS 实现）：
 *   所有主流 AI 编程宿主都会把会话状态落盘——Claude Code 的 jsonl 转写、
 *   Codex 的 rollout jsonl、Cursor 的 state.vscdb、TRAE 的 ai-agent SQLite WAL。
 *   本模块用轮询 stat 对比文件指纹（mtime+size）推导宿主活动，复用经许可的
 *   host-observation 管道上报仅元数据事件。宿主侧零安装：不需要 Hook、
 *   不需要 MCP 注册，即可覆盖全部宿主（对 TRAE 这类无 Hook 宿主是唯一可行路径）。
 *
 * 状态机（每宿主独立）：
 *   文件指纹变化 → 会话开启（SessionStart）→ 持续变化发心跳（PostToolUse，
 *   默认 60s 一次，activeWindowMs=2min 内足以维持 working 三灯流动）
 *   → 变化停止 45s → SessionEnd（completed 绿闪）→ 再次变化 → 新 SessionStart。
 *
 * AgentBar 协议发布（可选，agentbarStateDir 非空时启用）：
 *   对无 Hook 宿主（trae/vscode）把推导出的会话状态按 ~/.agentbar 文件协议
 *   （MIT · michalstrnadel/AgentBar docs/protocol.md）以原子写发布到
 *   state.d/<sessionId>.json，会话结束删文件。EOS 内部仍走 host-observation
 *   管线直报；发布仅为让任何协议前端（AgentBar、waybar 等）看到 TRAE 状态。
 *
 * 关键不变量：
 *   1. 只读 stat，绝不读取宿主文件内容——观察严格停留在元数据层。
 *   2. 首个 tick 只建立基线，不发任何事件（重启 Core 不会伪造会话开始）。
 *   3. 凭据（consent+captureToken）解析失败只降级该宿主，永不影响其他宿主。
 *   4. 单飞 tick（re-entrancy guard），异常吞掉并记日志，观察永不阻塞 Core。
 *   5. 协议发布失败只记日志，绝不影响观察事件上报。
 */

import { createHash, randomBytes } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { createHostCredentialResolver, inferWorkspaceDir } from "./eosCredentialResolver.js";

function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

const WATCHED_HOSTS = Object.freeze(["trae", "claude", "codex", "cursor"]);

const DEFAULT_INTERVAL_MS = 5_000;
const DEFAULT_HEARTBEAT_MS = 60_000;
const DEFAULT_DONE_AFTER_MS = 45_000;
const MAX_FILE_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_WALK_DEPTH = 4;
const WATCHED_FILE_RE = /\.(jsonl|vscdb|db-wal|db|json)$/i;

export function defaultWatchRoots() {
  const home = os.homedir();
  const appSupport = path.join(home, "Library", "Application Support");
  return {
    trae: [
      path.join(appSupport, "TRAE SOLO CN", "ModularData", "ai-agent", "database.db-wal"),
      path.join(appSupport, "TRAE SOLO CN", "ModularData", "ai-agent", "sandbox", "sandbox_impl.json")
    ],
    claude: [path.join(home, ".claude", "projects")],
    codex: [path.join(home, ".codex", "sessions")],
    cursor: [path.join(appSupport, "Cursor", "User", "workspaceStorage")]
  };
}

export function createSessionLogWatcher({
  vaultDir,
  listConsents,
  record,
  secretRoot = process.env.EOS_SECRET_ROOT || path.join(os.homedir(), ".experience-os", "secrets"),
  roots = defaultWatchRoots(),
  now = Date.now,
  intervalMs = DEFAULT_INTERVAL_MS,
  heartbeatMs = DEFAULT_HEARTBEAT_MS,
  doneAfterMs = DEFAULT_DONE_AFTER_MS,
  agentbarStateDir = null,
  agentbarPublishHosts = ["trae", "vscode"],
  log = (message) => process.stderr.write(`[EOS SessionLogWatcher] ${message}\n`)
} = {}) {
  if (typeof listConsents !== "function") throw new Error("listConsents is required");
  if (typeof record !== "function") throw new Error("record is required");

  const workspaceDir = inferWorkspaceDir(vaultDir);
  const salt = randomBytes(32).toString("hex");
  const resolveCredential = createHostCredentialResolver({ listConsents, secretRoot, now, log });
  const hosts = new Map();
  const publishedFiles = new Map();
  let timer = null;
  let ticking = false;

  for (const host of WATCHED_HOSTS) {
    hosts.set(host, {
      snapshot: new Map(),
      baselineDone: false,
      active: false,
      sessionEpoch: null,
      lastChangeAt: 0,
      lastHeartbeatAt: 0,
      endEmitted: true
    });
  }

  function opaque(value) {
    return `sha256:${createHash("sha256").update(`${salt}\0${value}`, "utf8").digest("hex")}`;
  }

  async function emit(host, eventName, { turnFingerprint = null } = {}) {
    const state = hosts.get(host);
    const credential = await resolveCredential.resolve(host, workspaceDir);
    if (!credential) return;
    if (credential.workspaceDir) state.sessionWorkspaceDir = credential.workspaceDir;
    const observation = {
      host,
      eventName,
      sessionHash: opaque(`${host}:${state.sessionEpoch}`),
      turnHash: turnFingerprint ? opaque(turnFingerprint) : null,
      toolName: "session-log-watcher",
      permissionMode: null,
      observedAt: new Date(now()).toISOString()
    };
    await record({ consentId: credential.consentId, captureToken: credential.captureToken, observation });
  }

  async function publishUpsert(host, agentState) {
    if (!agentbarStateDir || !agentbarPublishHosts.includes(host)) return;
    const state = hosts.get(host);
    if (!state?.sessionEpoch) return;
    const cwd = state.sessionWorkspaceDir || workspaceDir || "";
    const fileName = `${state.sessionEpoch}.json`;
    const target = path.join(agentbarStateDir, fileName);
    const body = JSON.stringify({
      agent: host,
      state: agentState,
      label: "EOS session-log watcher",
      project: cwd ? path.basename(cwd) : "",
      cwd,
      sessionId: state.sessionEpoch,
      pid: process.pid,
      started: true,
      ts: Math.floor(now() / 1000)
    });
    try {
      await mkdir(agentbarStateDir, { recursive: true });
      const tmp = `${target}.${process.pid}.tmp`;
      await writeFile(tmp, body, "utf8");
      await rename(tmp, target);
      publishedFiles.set(host, target);
    } catch (error) {
      log(`agentbar publish for ${host} failed: ${safeDetail(error)}`);
    }
  }

  async function publishRemove(host) {
    if (!agentbarStateDir || !agentbarPublishHosts.includes(host)) return;
    const target = publishedFiles.get(host);
    if (!target) return;
    publishedFiles.delete(host);
    try {
      await rm(target, { force: true });
    } catch (error) {
      log(`agentbar cleanup for ${host} failed: ${safeDetail(error)}`);
    }
  }

  async function scanRoots(hostRoots) {
    const entries = new Map();
    for (const root of hostRoots || []) {
      const rootStat = await stat(root).catch(() => null);
      if (!rootStat) continue;
      if (rootStat.isFile()) {
        if (now() - rootStat.mtimeMs < MAX_FILE_AGE_MS) {
          entries.set(root, `${rootStat.mtimeMs}:${rootStat.size}`);
        }
      } else if (rootStat.isDirectory()) {
        await walk(root, 0, entries);
      }
    }
    return entries;
  }

  async function walk(dir, depth, entries) {
    if (depth > MAX_WALK_DEPTH) return;
    const dirents = await readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const dirent of dirents) {
      if (dirent.name.startsWith(".")) continue;
      const full = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        await walk(full, depth + 1, entries);
      } else if (dirent.isFile() && WATCHED_FILE_RE.test(dirent.name)) {
        const fileStat = await stat(full).catch(() => null);
        if (fileStat && now() - fileStat.mtimeMs < MAX_FILE_AGE_MS) {
          entries.set(full, `${fileStat.mtimeMs}:${fileStat.size}`);
        }
      }
    }
  }

  async function tickHost(host) {
    const state = hosts.get(host);
    const snapshot = await scanRoots(roots[host]);
    if (!state.baselineDone) {
      state.snapshot = snapshot;
      state.baselineDone = true;
      return;
    }

    let changed = false;
    let fingerprint = null;
    for (const [file, value] of snapshot) {
      if (state.snapshot.get(file) !== value) {
        changed = true;
        fingerprint = value;
      }
    }
    state.snapshot = snapshot;

    const nowMs = now();
    if (changed) {
      state.lastChangeAt = nowMs;
      state.endEmitted = false;
      if (!state.active) {
        state.active = true;
        state.sessionEpoch = `watch.${nowMs}`;
        state.sessionWorkspaceDir = null;
        state.lastHeartbeatAt = nowMs;
        await emit(host, "SessionStart");
        await publishUpsert(host, "tool");
      } else if (nowMs - state.lastHeartbeatAt >= heartbeatMs) {
        state.lastHeartbeatAt = nowMs;
        await emit(host, "PostToolUse", { turnFingerprint: fingerprint });
        await publishUpsert(host, "tool");
      }
      return;
    }

    if (state.active && !state.endEmitted && nowMs - state.lastChangeAt >= doneAfterMs) {
      state.active = false;
      state.endEmitted = true;
      await emit(host, "SessionEnd");
      await publishRemove(host);
    }
  }

  async function tick() {
    if (ticking) return;
    ticking = true;
    try {
      for (const host of WATCHED_HOSTS) {
        try {
          await tickHost(host);
        } catch (error) {
          log(`tick for ${host} failed: ${safeDetail(error)}`);
        }
      }
    } finally {
      ticking = false;
    }
  }

  async function sweepOrphanPublishes() {
    if (!agentbarStateDir) return;
    const names = await readdir(agentbarStateDir).catch(() => []);
    for (const name of names) {
      if (!name.endsWith(".json") || !name.startsWith("watch.")) continue;
      const filePath = path.join(agentbarStateDir, name);
      try {
        const parsed = JSON.parse(await readFile(filePath, "utf8"));
        if (parsed?.label !== "EOS session-log watcher") continue;
        if (parsed.pid === process.pid) continue;
        if (pidAlive(Number(parsed.pid))) continue;
        await rm(filePath, { force: true });
        log(`removed orphan publish ${name} (pid ${parsed.pid} dead)`);
      } catch (error) {
        log(`orphan sweep for ${name} failed: ${safeDetail(error)}`);
      }
    }
  }

  return {
    hosts: WATCHED_HOSTS,
    agentbarPublishHosts: agentbarPublishHosts.filter((host) => WATCHED_HOSTS.includes(host)),
    async start() {
      if (timer) return;
      await sweepOrphanPublishes();
      await tick();
      timer = setInterval(() => {
        void tick();
      }, intervalMs);
      timer.unref?.();
    },
    async stop() {
      if (timer) clearInterval(timer);
      timer = null;
      for (const host of [...publishedFiles.keys()]) {
        await publishRemove(host);
      }
    },
    tick
  };
}

function safeDetail(error) {
  return String(error?.message || error || "unknown").slice(0, 200);
}
