/**
 * Compress live EOS state into a small human attention surface.
 *
 * Red means a human decision is blocking progress. Amber means follow-up is
 * useful but work may continue. Green means no known item needs attention.
 * The snapshot deliberately includes no captured collaboration content.
 */

function signal(id, label, level, detail, count) {
  return { id, label, level, detail, count };
}

export function buildAttentionSnapshot({
  permits = [],
  drafts = [],
  reviewPackets = [],
  wallHits = [],
  agents = [],
  agentSummary = null,
  llm
}) {
  const pendingPermits = permits.filter((permit) => permit.status === "pending");
  const pendingDrafts = drafts.filter((draft) => draft.status === "pending_review");
  const pendingReviews = reviewPackets.filter((packet) => packet.status !== "decided");
  const openWalls = wallHits.filter((wall) => wall.status === "open");
  const urgentWalls = openWalls.filter((wall) => ["high", "blocker"].includes(wall.severity));
  const workingAgents = agents.filter((agent) => agent.state === "working");
  const permissionAgents = agents.filter((agent) => agent.state === "waiting_permission");
  const completedAgents = agents.filter((agent) => agent.state === "completed");
  const blockedAgents = agents.filter((agent) => agent.state === "blocked");
  const actions = [];

  if (permissionAgents.length) {
    actions.push({
      id: "agent-permissions",
      level: "amber",
      title: `${permissionAgents.length} 个 Agent 等待宿主权限`,
      detail: "返回对应宿主查看请求；EOS 不会代替你批准。",
      view: "platform",
      anchor: null
    });
  }
  if (pendingPermits.length) {
    actions.push({
      id: "capture-permits",
      level: "red",
      title: `${pendingPermits.length} 项外部捕获等待许可`,
      detail: "内容仍在本地待许可区，尚未进入 Vault。",
      view: "project",
      anchor: "capture-permits"
    });
  }
  if (pendingDrafts.length) {
    actions.push({
      id: "receipt-drafts",
      level: "amber",
      title: `${pendingDrafts.length} 份经验草案待处理`,
      detail: "确认、改写、暂缓或丢弃都需要你决定。",
      view: "project",
      anchor: "drafts"
    });
  }
  if (pendingReviews.length) {
    actions.push({
      id: "review-packets",
      level: "amber",
      title: `${pendingReviews.length} 个生产审查等待决定`,
      detail: "系统给出证据与选项，但不会替你批准。",
      view: "review",
      anchor: null
    });
  }
  if (openWalls.length) {
    actions.push({
      id: "wall-hits",
      level: urgentWalls.length ? "red" : "amber",
      title: `${openWalls.length} 个生产撞墙仍未解决`,
      detail: urgentWalls.length ? `${urgentWalls.length} 个为高影响或阻塞级。` : "未阻塞当前操作，但值得回看修复路径。",
      view: "wallhits",
      anchor: null
    });
  }

  const decisionsLevel = pendingPermits.length ? "red" : (pendingDrafts.length || pendingReviews.length ? "amber" : "green");
  const productionLevel = urgentWalls.length ? "red" : (openWalls.length ? "amber" : "green");
  const modelLevel = llm?.isLive ? "green" : "amber";
  const overall = overallState({
    pendingPermits,
    pendingDrafts,
    pendingReviews,
    openWalls,
    urgentWalls,
    workingAgents,
    permissionAgents,
    completedAgents,
    blockedAgents
  });
  return {
    generatedAt: new Date().toISOString(),
    overall,
    agents,
    agentSummary: agentSummary || summarizeAgents(agents),
    signals: [
      signal("decisions", "需要你决定", decisionsLevel, pendingPermits.length ? "有外部内容等待你的明确许可。" : pendingDrafts.length || pendingReviews.length ? "有草案或审查项等待你的判断。" : "当前没有等待你决定的事项。", pendingPermits.length + pendingDrafts.length + pendingReviews.length),
      signal("production", "生产安全", productionLevel, urgentWalls.length ? "检测到高影响撞墙，生产路径被阻塞。" : openWalls.length ? "检测到可跟进的撞墙记录。" : "当前没有未解决的生产撞墙。", openWalls.length),
      signal("model", "模型状态", modelLevel, llm?.isLive ? `真实模型可用：${llm.adapter}/${llm.model}。` : llm?.mockDraftsAllowed ? "离线演练模式：输出不会计入真实模型证据。" : "真实模型未配置或不可用，草案生成已锁定。", 0)
    ],
    actions
  };
}

function workingDetail(workingAgents, { pendingDrafts, pendingReviews, openWalls }) {
  const pending = pendingDrafts.length + pendingReviews.length + openWalls.length;
  const base = `${workingAgents.length} 个 Agent 有近期、可验证的活动事件。`;
  return pending > 0 ? `${base} 另有 ${pending} 项内容等待人类跟进。` : base;
}

function overallState({
  pendingPermits,
  pendingDrafts,
  pendingReviews,
  openWalls,
  urgentWalls,
  workingAgents,
  permissionAgents,
  completedAgents,
  blockedAgents
}) {
  if (blockedAgents.length || urgentWalls.length) {
    return {
      state: "blocked",
      label: "存在阻塞",
      detail: `${blockedAgents.length + urgentWalls.length} 项失败或高影响撞墙需要处理。`
    };
  }
  if (pendingPermits.length || permissionAgents.length) {
    return {
      state: "waiting_permission",
      label: "等待权限",
      detail: `${pendingPermits.length + permissionAgents.length} 项许可需要人类决定。`
    };
  }
  // 实时工作进行中优先于积压的审查项：工作态是转瞬即逝的现场信号（三灯流动），
  // 审查项会一直挂着，若压过 working，用户在工作期间永远看不到流动灯。
  // 阻塞与权限仍高于 working，因为它们需要人类立即处理。
  if (workingAgents.length) {
    return {
      state: "working",
      label: "Agent 正在工作",
      detail: workingDetail(workingAgents, { pendingDrafts, pendingReviews, openWalls })
    };
  }
  if (pendingDrafts.length || pendingReviews.length || openWalls.length) {
    return {
      state: "waiting_review",
      label: "等待审查",
      detail: `${pendingDrafts.length + pendingReviews.length + openWalls.length} 项内容等待人类跟进。`
    };
  }
  if (completedAgents.length) {
    return {
      state: "completed",
      label: "工作刚刚完成",
      detail: `${completedAgents.length} 个 Agent 报告本轮工作结束。`
    };
  }
  return { state: "idle", label: "当前空闲", detail: "没有需要人类处理的已知事项。" };
}

function summarizeAgents(agents) {
  const count = (state) => agents.filter((agent) => agent.state === state).length;
  return {
    installed: agents.length,
    working: count("working"),
    waitingPermission: count("waiting_permission"),
    completed: count("completed"),
    blocked: count("blocked"),
    stale: count("stale"),
    callable: agents.filter((agent) => agent.evidenceLevel >= 3).length,
    observing: agents.filter((agent) => agent.evidenceLevel >= 4).length
  };
}
