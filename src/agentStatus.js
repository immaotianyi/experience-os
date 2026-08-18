const HOST_LABELS = Object.freeze({
  codex: "Codex",
  claude: "Claude Code",
  cursor: "Cursor",
  trae: "TRAE",
  vscode: "VS Code"
});

const WORKING_EVENTS = new Set([
  "SessionStart",
  "SubagentStart",
  "UserPromptSubmit",
  "PreToolUse",
  "PostToolUse",
  "PreCompact",
  "PostCompact",
  "Notification"
]);
const COMPLETED_EVENTS = new Set(["SessionEnd", "SubagentStop", "Stop"]);
const BLOCKED_EVENTS = new Set(["PermissionDenied", "PostToolUseFailure", "StopFailure"]);

const STATE_PRIORITY = Object.freeze({
  blocked: 0,
  waiting_permission: 1,
  working: 2,
  completed: 3,
  stale: 4,
  idle: 5,
  disconnected: 6,
  unknown: 7
});

export const AGENT_ACTIVITY_STATES = Object.freeze([
  "working",
  "waiting_permission",
  "completed",
  "blocked",
  "idle",
  "stale",
  "disconnected",
  "unknown"
]);

/**
 * Derive current Agent activity only from callable host evidence and recent,
 * metadata-only observations. An installed process or old event is never
 * promoted into a live "working" claim.
 */
export function buildAgentStatus({
  platforms = {},
  observations = [],
  now = Date.now(),
  activeWindowMs = 2 * 60 * 1000,
  attentionWindowMs = 15 * 60 * 1000,
  completedWindowMs = 5 * 60 * 1000
} = {}) {
  const nowMs = timestamp(now) ?? Date.now();
  const latestByHost = latestObservationByHost(observations);
  const agents = Object.entries(platforms)
    .filter(([, platform]) => platform?.proof?.hostInstalled)
    .map(([host, platform]) => deriveAgent({
      host,
      platform,
      observation: latestByHost.get(host) || null,
      nowMs,
      activeWindowMs,
      attentionWindowMs,
      completedWindowMs
    }))
    .sort((left, right) =>
      (STATE_PRIORITY[left.state] ?? 99) - (STATE_PRIORITY[right.state] ?? 99)
      || left.label.localeCompare(right.label)
    );

  return {
    agents,
    summary: {
      installed: agents.length,
      working: count(agents, "working"),
      waitingPermission: count(agents, "waiting_permission"),
      completed: count(agents, "completed"),
      blocked: count(agents, "blocked"),
      stale: count(agents, "stale"),
      callable: agents.filter((agent) => agent.evidenceLevel >= 3).length,
      observing: agents.filter((agent) => agent.evidenceLevel >= 4).length
    }
  };
}

function deriveAgent({ host, platform, observation, nowMs, activeWindowMs, attentionWindowMs, completedWindowMs }) {
  const evidenceLevel = Number(platform.compatibilityLevel) || 0;
  const base = {
    id: host,
    label: HOST_LABELS[host] || host,
    state: "unknown",
    stateLabel: "状态未知",
    detail: "EOS 尚无足够证据判断当前活动。",
    evidenceLevel,
    platformStatus: platform.status || "unknown",
    lastEvent: observation ? {
      name: observation.eventName,
      category: observation.eventCategory,
      outcome: observation.outcome,
      observedAt: observation.observedAt || observation.createdAt || null
    } : null
  };

  if (platform.status === "error") {
    return { ...base, state: "unknown", detail: "宿主检测失败，当前状态不可判断。" };
  }
  if (evidenceLevel < 3) {
    return {
      ...base,
      state: "disconnected",
      stateLabel: evidenceLevel >= 2 ? "待验收" : "未连接",
      detail: evidenceLevel >= 2 ? "已有配置，但当前 Vault 尚未通过可调用验收。" : "已检测宿主，但尚未连接当前 EOS Vault。"
    };
  }
  if (!observation) {
    return {
      ...base,
      state: "idle",
      stateLabel: "等待事件",
      detail: "宿主已可调用，但尚未收到经许可的活动事件。"
    };
  }

  const observedAt = timestamp(observation.observedAt || observation.createdAt);
  if (observedAt === null) {
    return { ...base, state: "unknown", detail: "最近事件缺少有效时间，不能判断是否仍在运行。" };
  }
  const ageMs = Math.max(0, nowMs - observedAt);
  const timedBase = { ...base, ageMs };

  if (observation.eventName === "PermissionRequest") {
    return ageMs <= attentionWindowMs
      ? { ...timedBase, state: "waiting_permission", stateLabel: "需要权限", detail: "Agent 已请求人类许可，尚无后续事件证明请求已解决。" }
      : stale(timedBase);
  }
  if (BLOCKED_EVENTS.has(observation.eventName)) {
    return ageMs <= attentionWindowMs
      ? { ...timedBase, state: "blocked", stateLabel: "已阻塞", detail: "最近的真实宿主事件报告失败或许可被拒绝。" }
      : stale(timedBase);
  }
  if (COMPLETED_EVENTS.has(observation.eventName)) {
    return ageMs <= completedWindowMs
      ? { ...timedBase, state: "completed", stateLabel: "刚刚完成", detail: "最近的真实宿主事件确认本轮工作已经结束。" }
      : idle(timedBase);
  }
  if (WORKING_EVENTS.has(observation.eventName)) {
    return ageMs <= activeWindowMs
      ? { ...timedBase, state: "working", stateLabel: "正在工作", detail: "EOS 收到当前 Vault 的近期活动事件。" }
      : idle(timedBase);
  }
  return ageMs <= attentionWindowMs ? stale(timedBase) : idle(timedBase);
}

function stale(base) {
  return { ...base, state: "stale", stateLabel: "证据已过期", detail: "曾收到活动事件，但时间不足以证明 Agent 仍处于该状态。" };
}

function idle(base) {
  return { ...base, state: "idle", stateLabel: "当前空闲", detail: "宿主已连接，但没有足够新的事件证明 Agent 正在工作。" };
}

function latestObservationByHost(observations) {
  const latest = new Map();
  for (const observation of observations) {
    const host = String(observation?.host || "").toLowerCase();
    if (!host) continue;
    const current = latest.get(host);
    const candidateTime = timestamp(observation.observedAt || observation.createdAt) ?? -1;
    const currentTime = timestamp(current?.observedAt || current?.createdAt) ?? -1;
    if (!current || candidateTime > currentTime) latest.set(host, observation);
  }
  return latest;
}

function timestamp(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function count(agents, state) {
  return agents.filter((agent) => agent.state === state).length;
}
