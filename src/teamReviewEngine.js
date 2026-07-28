/**
 * Team Review Engine — extends the single-user review flow with
 * multi-person assignees, discussion threads, and confirmation thresholds.
 *
 * Design:
 * - ReviewPackets gain assigneeIds[] and discussion[] fields
 * - Each assignee can submit a preliminary vote (approve/reject/abstain)
 * - When confirmations reach the threshold (default 2 for team, 1 for solo),
 *   the review is finalized and the decision is applied to the target
 * - Discussion threads allow @mentions and inline comments
 *
 * This module is additive — it does not change the existing single-user
 * reviewEngine.js flow. In single-user mode, the threshold is 1 and
 * team review behaves identically to the original flow.
 */

import { createReviewDecision, nowIso } from "./domain.js";

/**
 * Default confirmation threshold for team review.
 * Solo mode uses threshold = 1 (auto-pass on first decision).
 */
export const DEFAULT_TEAM_THRESHOLD = 2;

/**
 * Vote types for preliminary assignee votes.
 */
export const VOTE_TYPES = Object.freeze({
  APPROVE: "approve",
  REJECT: "reject",
  ABSTAIN: "abstain"
});

/**
 * Assign reviewers to a ReviewPacket.
 * Adds assigneeIds to the packet if not already present.
 *
 * @param {Object} packet - ReviewPacket record
 * @param {string[]} userIds - Array of user IDs to assign
 * @returns {Object} Updated packet
 */
export function assignReviewers(packet, userIds) {
  if (!packet.assigneeIds) {
    packet.assigneeIds = [];
  }
  if (!packet.votes) {
    packet.votes = [];
  }
  for (const userId of userIds) {
    if (!packet.assigneeIds.includes(userId)) {
      packet.assigneeIds.push(userId);
    }
  }
  packet.updatedAt = nowIso();
  return packet;
}

/**
 * Submit a preliminary vote from an assignee.
 *
 * @param {Object} packet - ReviewPacket record
 * @param {Object} params
 * @param {string} params.userId - The voter's user ID
 * @param {string} params.vote - One of VOTE_TYPES
 * @param {string} [params.comment] - Optional comment
 * @returns {Object} Updated packet
 */
export function submitVote(packet, { userId, vote, comment }) {
  if (!packet.assigneeIds || !packet.assigneeIds.includes(userId)) {
    throw new Error(`User ${userId} is not an assignee of this review packet`);
  }

  if (packet.status === "decided") {
    throw new Error("Cannot vote on a packet that has already been finalized (decided)");
  }

  if (!Object.values(VOTE_TYPES).includes(vote)) {
    throw new Error(`Invalid vote type: ${vote}. Must be one of: ${Object.values(VOTE_TYPES).join(", ")}`);
  }

  if (!packet.votes) {
    packet.votes = [];
  }

  // Remove existing vote from this user (if any) — votes are mutable
  packet.votes = packet.votes.filter((v) => v.userId !== userId);

  packet.votes.push({
    userId,
    vote,
    comment: comment || null,
    timestamp: nowIso()
  });

  packet.updatedAt = nowIso();
  return packet;
}

let commentCounter = 0;

/**
 * Add a discussion comment to a ReviewPacket.
 *
 * @param {Object} packet
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.message
 * @param {string} [params.mentions] - Comma-separated user IDs to mention
 * @returns {Object} Updated packet
 */
export function addDiscussionComment(packet, { userId, message, mentions }) {
  if (!packet.discussion) {
    packet.discussion = [];
  }

  const mentionList = mentions
    ? mentions.split(",").map((m) => m.trim()).filter(Boolean)
    : [];

  commentCounter += 1;
  packet.discussion.push({
    id: `comment.${Date.now()}.${commentCounter}.${userId}`,
    userId,
    message,
    mentions: mentionList,
    timestamp: nowIso()
  });

  packet.updatedAt = nowIso();
  return packet;
}

/**
 * Check if the review packet has enough confirmations to finalize.
 *
 * @param {Object} packet
 * @param {number} [threshold] - Required approvals (default: DEFAULT_TEAM_THRESHOLD, or 1 if no assignees)
 * @returns {{ ready: boolean, approvals: number, rejections: number, abstentions: number, threshold: number }}
 */
export function checkConfirmationStatus(packet, threshold) {
  const votes = packet.votes || [];
  const approvals = votes.filter((v) => v.vote === VOTE_TYPES.APPROVE).length;
  const rejections = votes.filter((v) => v.vote === VOTE_TYPES.REJECT).length;
  const abstentions = votes.filter((v) => v.vote === VOTE_TYPES.ABSTAIN).length;

  // In solo mode (no assignees), threshold is 1
  const effectiveThreshold = threshold || (packet.assigneeIds?.length > 0 ? DEFAULT_TEAM_THRESHOLD : 1);

  // Ready when approvals >= threshold
  // Also ready if any rejection (early reject) — prevents waiting for all votes on clear rejections
  const ready = approvals >= effectiveThreshold || rejections > 0;

  return { ready, approvals, rejections, abstentions, threshold: effectiveThreshold };
}

/**
 * Finalize a team review. Called when checkConfirmationStatus().ready is true.
 *
 * @param {Object} params
 * @param {Object} params.packet - The ReviewPacket
 * @param {Object} params.vault - GitVault instance
 * @param {string} [params.finalDecisionBy] - User ID who triggered finalization
 * @returns {Promise<{ decision: Object, packet: Object }>}
 */
export async function finalizeTeamReview({ packet, vault, finalDecisionBy }) {
  const status = checkConfirmationStatus(packet);

  if (!status.ready) {
    throw new Error(`Review not ready: ${status.approvals}/${status.threshold} approvals, ${status.rejections} rejections`);
  }

  // Determine final decision based on votes
  const finalDecision = status.rejections > 0 ? "reject" : "approve_candidate";
  const resultingStatus = status.rejections > 0 ? "rejected" : "candidate_confirmed";

  const decision = createReviewDecision({
    id: `review_decision.team.${packet.id}.${Date.now()}`,
    projectId: packet.projectId,
    reviewPacketId: packet.id,
    targetKind: packet.targetKind,
    targetId: packet.targetId,
    decision: finalDecision,
    rationale: `Team review finalized: ${status.approvals} approvals, ${status.rejections} rejections, ${status.abstentions} abstentions. Threshold: ${status.threshold}.`,
    resultingStatus
  });

  // Add team metadata to decision
  decision.teamReview = {
    votes: packet.votes || [],
    assigneeIds: packet.assigneeIds || [],
    finalizedBy: finalDecisionBy || "system",
    threshold: status.threshold
  };

  // Update packet status
  packet.status = "decided";
  packet.decidedAt = nowIso();
  packet.decisionId = decision.id;
  packet.updatedAt = nowIso();

  // Save both records atomically — if either fails, the other must not persist.
  // Reload the packet inside the lock to prevent TOCTOU: two concurrent
  // finalize calls could both pass the "ready" check and create duplicate
  // ReviewDecision records.
  const doSave = async () => {
    if (typeof vault.load === "function") {
      const freshPacket = await vault.load("ReviewPacket", packet.id).catch(() => null);
      if (freshPacket && freshPacket.status === "decided") {
        throw new Error(`Review packet ${packet.id} has already been finalized`);
      }
      // Sync any vote changes from the fresh packet back into our working copy
      if (freshPacket) {
        packet.votes = freshPacket.votes || packet.votes;
        packet.assigneeIds = freshPacket.assigneeIds || packet.assigneeIds;
      }
    }
    await vault.save(decision);
    await vault.save(packet);
  };

  if (typeof vault.withTransaction === "function") {
    await vault.withTransaction(doSave, { message: `[Review] team finalize: ${packet.id}` });
  } else if (typeof vault.withWriteLock === "function") {
    await vault.withWriteLock(doSave);
  } else {
    await doSave();
  }

  return { decision, packet };
}

/**
 * Get a summary of the team review status for display.
 *
 * @param {Object} packet
 * @returns {Object} Summary object
 */
export function getReviewSummary(packet) {
  const status = checkConfirmationStatus(packet);
  return {
    packetId: packet.id,
    title: packet.title,
    status: packet.status,
    assignees: packet.assigneeIds || [],
    votes: packet.votes || [],
    discussion: packet.discussion || [],
    approvals: status.approvals,
    rejections: status.rejections,
    abstentions: status.abstentions,
    threshold: status.threshold,
    ready: status.ready
  };
}
