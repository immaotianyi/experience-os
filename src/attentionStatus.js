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

export function buildAttentionSnapshot({ permits = [], drafts = [], reviewPackets = [], wallHits = [], llm }) {
  const pendingPermits = permits.filter((permit) => permit.status === "pending");
  const pendingDrafts = drafts.filter((draft) => draft.status === "pending_review");
  const pendingReviews = reviewPackets.filter((packet) => packet.status !== "decided");
  const openWalls = wallHits.filter((wall) => wall.status === "open");
  const urgentWalls = openWalls.filter((wall) => ["high", "blocker"].includes(wall.severity));
  const actions = [];

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
  return {
    generatedAt: new Date().toISOString(),
    signals: [
      signal("decisions", "需要你决定", decisionsLevel, pendingPermits.length ? "有外部内容等待你的明确许可。" : pendingDrafts.length || pendingReviews.length ? "有草案或审查项等待你的判断。" : "当前没有等待你决定的事项。", pendingPermits.length + pendingDrafts.length + pendingReviews.length),
      signal("production", "生产安全", productionLevel, urgentWalls.length ? "检测到高影响撞墙，生产路径被阻塞。" : openWalls.length ? "检测到可跟进的撞墙记录。" : "当前没有未解决的生产撞墙。", openWalls.length),
      signal("model", "模型状态", modelLevel, llm?.isLive ? `真实模型可用：${llm.adapter}/${llm.model}。` : llm?.mockDraftsAllowed ? "离线演练模式：输出不会计入真实模型证据。" : "真实模型未配置或不可用，草案生成已锁定。", 0)
    ],
    actions
  };
}
