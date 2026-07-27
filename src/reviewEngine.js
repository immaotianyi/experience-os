import { createReviewDecision, createReviewPacket, createWallHit } from "./domain.js";
import { slug, latest } from "./utils.js";
import { randomBytes } from "node:crypto";

/** Short random hex suffix to prevent same-millisecond ID collisions. */
function nonce(len = 4) {
  return randomBytes(len).toString("hex");
}

function reviewPacketForPreference({ projectId, preference }) {
  return createReviewPacket({
    id: `review_packet.${slug(projectId)}.${slug(preference.id)}.${Date.now()}.${nonce()}`,
    projectId,
    targetKind: "PreferenceHypothesis",
    targetId: preference.id,
    title: "确认偏好假设",
    recommendation: "建议先确认，不直接固化为永久偏好。",
    why: preference.statement,
    evidence: preference.evidenceIds.map((id) => `证据资产: ${id}`),
    risks: [
      "如果误判偏好，系统会在后续输出中持续放大错误适配。",
      "偏好可能随项目阶段变化，需要保留重新验证机制。"
    ],
    options: [
      { id: "confirm", label: "确认", effect: "status=confirmed, confidence +0.15" },
      { id: "revise", label: "修改后确认", effect: "status=confirmed_after_revision" },
      { id: "reject", label: "驳回", effect: "status=rejected" },
      { id: "defer", label: "暂缓", effect: "status=hypothesis" }
    ],
    defaultOption: "defer"
  });
}

function reviewPacketForSkill({ projectId, skill }) {
  const strategicOptions = [
    { id: "keep_candidate", label: "保留候选", effect: "status=candidate_retained, promotionGate=blocked_until_more_evidence" },
    { id: "promote_stable", label: "升级稳定", effect: "status=stable, requires further tests" },
    { id: "revise", label: "要求修改", effect: "status=needs_revision" },
    { id: "reject", label: "驳回", effect: "status=rejected" }
  ];
  const defaultOptions = [
    { id: "approve_candidate", label: "确认候选", effect: "status=candidate_confirmed" },
    { id: "promote_stable", label: "升级稳定", effect: "status=stable, requires further tests" },
    { id: "revise", label: "要求修改", effect: "status=needs_revision" },
    { id: "reject", label: "驳回", effect: "status=rejected" }
  ];
  const isStrategic = skill.skillLevel === "strategic";

  return createReviewPacket({
    id: `review_packet.${slug(projectId)}.${slug(skill.id)}.${Date.now()}.${nonce()}`,
    projectId,
    targetKind: "Skill",
    targetId: skill.id,
    title: `审查自生成 Skill：${skill.name}`,
    recommendation: skill.skillLevel === "strategic" ? "建议保留为候选，不直接升级为稳定 Skill。" : "建议确认进入候选 Skill 库。",
    why: `该 Skill 来源为 ${skill.origin}，层级为 ${skill.skillLevel}，用于 ${skill.memoryUtility?.expectedUse ?? "复用经验"}。`,
    evidence: [
      `触发意图: ${skill.trigger?.intent}`,
      `触发信号: ${(skill.trigger?.signals ?? []).join(", ")}`,
      `降级路径: ${skill.fallback}`
    ],
    risks: [
      "自生成 Skill 可能过拟合当前项目。",
      "如果触发信号过宽，可能在不合适场景误触发。",
      "strategic 层级 Skill 必须保持人类确认。"
    ],
    options: isStrategic ? strategicOptions : defaultOptions,
    defaultOption: isStrategic ? "keep_candidate" : "approve_candidate"
  });
}

export async function buildHumanReviewPackets({ vault, projectId = "project.experience_os_human_review", limit = 4 }) {
  const [preferences, skills, existingPackets] = await Promise.all([
    vault.list("PreferenceHypothesis"),
    vault.list("Skill"),
    vault.list("ReviewPacket")
  ]);

  // A target only needs a new packet if it has no *pending* packet already.
  // Without this guard, every call re-packeted already-decided skills (the skills
  // filter was origin-only, not status-aware), producing unbounded ReviewPacket
  // growth and duplicate human-review work for the same target.
  const pendingTargetKeys = new Set(
    existingPackets
      .filter((packet) => packet.status === "pending")
      .map((packet) => `${packet.targetKind}:${packet.targetId}`)
  );

  const preferenceTargets = latest(preferences.filter((item) => item.status === "hypothesis"), 2)
    .filter((preference) => !pendingTargetKeys.has(`PreferenceHypothesis:${preference.id}`))
    .map((preference) => reviewPacketForPreference({ projectId, preference }));

  // Only self-iterated skills that are still awaiting first review (status === "candidate")
  // qualify. Once decided (candidate_retained / candidate_confirmed / stable /
  // needs_revision / rejected) they must not be re-packeted until regenerated.
  const skillTargets = latest(
    skills.filter((item) => item.origin === "self_iteration" && item.status === "candidate"),
    limit
  )
    .filter((skill) => !pendingTargetKeys.has(`Skill:${skill.id}`))
    .map((skill) => reviewPacketForSkill({ projectId, skill }));

  const reviewTargets = [...preferenceTargets, ...skillTargets].slice(0, limit);

  const doSave = async () => {
    for (const packet of reviewTargets) {
      await vault.save(packet);
    }
  };
  if (typeof vault.withTransaction === "function") {
    await vault.withTransaction(doSave, { message: `[Review] build packets: ${projectId}` });
  } else {
    await doSave();
  }
  return reviewTargets;
}

export async function applyReviewDecision({ vault, packet, decision = packet.defaultOption, rationale = "demo auto decision" }) {
  // Defense in depth: the web layer validates this too, but any direct caller
  // (demos, scripts) must not be able to push an unknown decision through the
  // engine — statusForDecision would otherwise silently map it to
  // "candidate_confirmed", hiding the bug.
  const allowedDecisionIds = new Set((packet.options ?? []).map((option) => option.id));
  if (!allowedDecisionIds.has(decision)) {
    throw new Error(
      `Decision "${decision}" is not allowed for packet ${packet.id}. ` +
      `Allowed: ${[...allowedDecisionIds].join(", ") || "(none)"}`
    );
  }

  const resultingStatus = statusForDecision(packet, decision);
  const reviewDecision = createReviewDecision({
    id: `review_decision.${slug(packet.projectId)}.${slug(packet.targetKind)}.${slug(packet.targetId)}.${slug(decision)}.${Date.now()}.${nonce()}`,
    projectId: packet.projectId,
    reviewPacketId: packet.id,
    targetKind: packet.targetKind,
    targetId: packet.targetId,
    decision,
    rationale,
    resultingStatus
  });

  const decidedAt = new Date().toISOString();
  const targetUpdate = await prepareDecisionTargetUpdate({ vault, packet, reviewDecision, resultingStatus, decidedAt });

  // Persist all side-effects atomically — if any save fails, the transaction
  // rolls back so the packet does not get stuck in a half-decided state.
  // CRITICAL: reload packet inside the transaction to prevent TOCTOU double-decision.
  const doPersist = async () => {
    const freshPacket = await vault.load("ReviewPacket", packet.id);
    if (freshPacket.status === "decided") {
      throw new Error(`ReviewPacket ${packet.id} was already decided by another request`);
    }
    if (targetUpdate?.wallHit) {
      await vault.save(targetUpdate.wallHit);
    }
    if (targetUpdate?.record) {
      await vault.save(targetUpdate.record);
    }
    await vault.save({
      ...freshPacket,
      status: "decided",
      updatedAt: decidedAt
    });
    await vault.save(reviewDecision);
  };

  if (typeof vault.withTransaction === "function") {
    await vault.withTransaction(doPersist, { message: `[Review] decide: ${packet.id}` });
  } else {
    await doPersist();
  }

  if (targetUpdate?.wallHit) {
    return {
      ...reviewDecision,
      resultingStatus: "target_missing",
      wallHitId: targetUpdate.wallHit.id
    };
  }
  return reviewDecision;
}

async function prepareDecisionTargetUpdate({ vault, packet, reviewDecision, resultingStatus, decidedAt }) {
  if (!["PreferenceHypothesis", "Skill"].includes(packet.targetKind)) return null;

  let target;
  try {
    target = await vault.load(packet.targetKind, packet.targetId);
  } catch (error) {
    return {
      wallHit: createWallHit({
        id: `wallhit.${slug(packet.projectId)}.${slug(packet.targetKind)}.${slug(packet.targetId)}.target_missing.${Date.now()}.${nonce()}`,
        projectId: packet.projectId,
        wallType: "target_missing",
        stage: "human_review_decision",
        message: "Human Review 决策无法回写目标资产，因为目标记录不存在。",
        blockedBy: [
          `targetKind=${packet.targetKind}`,
          `targetId=${packet.targetId}`,
          error.message
        ],
        suggestedFixes: [
          "确认目标资产是否被清理或迁移",
          "重新生成 ReviewPacket",
          "为 Vault 清理策略增加引用完整性检查"
        ]
      })
    };
  }

  // vault.load returns null for missing files — treat same as load error
  if (!target) {
    return {
      wallHit: createWallHit({
        id: `wallhit.${slug(packet.projectId)}.${slug(packet.targetKind)}.${slug(packet.targetId)}.target_null.${Date.now()}.${nonce()}`,
        projectId: packet.projectId,
        wallType: "target_missing",
        stage: "human_review_decision",
        message: "Human Review 决策无法回写目标资产，因为目标记录为空。",
        blockedBy: [
          `targetKind=${packet.targetKind}`,
          `targetId=${packet.targetId}`,
          "vault.load returned null"
        ],
        suggestedFixes: [
          "确认目标资产是否被清理或迁移",
          "重新生成 ReviewPacket"
        ]
      })
    };
  }

  const nextTarget = {
    ...target,
    status: resultingStatus,
    lastReviewDecisionId: reviewDecision.id,
    reviewedAt: decidedAt,
    updatedAt: decidedAt
  };

  if (packet.targetKind === "PreferenceHypothesis") {
    nextTarget.confidence = confidenceForDecision(target.confidence, reviewDecision.decision);
  }

  if (packet.targetKind === "Skill") {
    Object.assign(nextTarget, skillReviewFieldsForDecision(reviewDecision.decision));
  }

  return { record: nextTarget };
}

function skillReviewFieldsForDecision(decision) {
  if (decision === "keep_candidate") {
    return {
      promotionGate: "blocked_until_more_evidence",
      candidateReason: "strategic_keep"
    };
  }
  if (decision === "promote_stable") {
    return {
      promotionGate: null,
      candidateReason: "human_promoted"
    };
  }
  if (decision === "approve_candidate") {
    return {
      promotionGate: null,
      candidateReason: "human_approved_candidate"
    };
  }
  return {
    promotionGate: null,
    candidateReason: decision
  };
}

function confidenceForDecision(confidence, decision) {
  const current = Number.isFinite(confidence) ? confidence : 0;
  if (decision === "confirm") return Math.min(1, current + 0.15);
  if (decision === "revise") return Math.min(1, current + 0.05);
  if (decision === "reject") return Math.max(0, current - 0.25);
  return current;
}

function statusForDecision(packet, decision) {
  if (packet.targetKind === "PreferenceHypothesis") {
    if (decision === "confirm") return "confirmed";
    if (decision === "revise") return "confirmed_after_revision";
    if (decision === "reject") return "rejected";
    return "hypothesis";
  }
  if (packet.targetKind === "Skill") {
    if (decision === "promote_stable") return "stable";
    if (decision === "reject") return "rejected";
    if (decision === "revise") return "needs_revision";
    if (decision === "keep_candidate") return "candidate_retained";
    if (decision === "approve_candidate") return "candidate_confirmed";
    throw new Error(`Unknown Skill review decision: ${decision}`);
  }
  throw new Error(`Unsupported targetKind for review decision: ${packet.targetKind}`);
}
