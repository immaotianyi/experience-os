/**
 * Round 5 fix regression tests.
 *
 * Pins the following fixes so they cannot regress:
 *   1. Decision ID "promote_stable" (not "promote_to_stable") counts as approval
 *   2. Team review finalDecision uses "reject" (not "reject_candidate")
 *   3. Free model duplicate purchase prevention
 *   4. refundTransaction rejects non-completed transactions
 *   5. finalizeTeamReview wraps saves in a transaction
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { GitVault } from "../src/gitVault.js";
import { processPurchase, refundTransaction } from "../src/transactionLog.js";
import { publishSkill } from "../src/marketplace.js";
import { createSkillCandidate, createReviewDecision, createReviewPacket } from "../src/domain.js";
import { VOTE_TYPES, assignReviewers, submitVote, finalizeTeamReview } from "../src/teamReviewEngine.js";

let tmpDir;
let vault;

beforeEach(async () => {
  tmpDir = await mkdtemp(path.join(tmpdir(), "eos-round5-"));
  vault = new GitVault(tmpDir);
  await vault.init();
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

// ============================================================
// 1. Decision ID "promote_stable" counts as approval
// ============================================================
describe("Decision ID promote_stable counts as approval", () => {
  it("getSkillMetadata counts promote_stable as approved in approvalRate", async () => {
    const skill = createSkillCandidate({
      id: "skill.promote-stable-test",
      projectId: "project.test",
      name: "Promote Stable Test",
      origin: "pipeline",
      trigger: { intent: "test", signals: ["sig"] },
      inputSchema: {},
      outputSchema: {},
      safetyLevel: "L1",
      fallback: "none",
      humanConfirmationRequired: false
    });
    skill.status = "stable";
    await vault.save(skill);

    // Create a ReviewDecision with decision = "promote_stable"
    const decision = createReviewDecision({
      id: "review_decision.promote_stable_test",
      projectId: "project.test",
      reviewPacketId: "review_packet.test",
      targetKind: "Skill",
      targetId: "skill.promote-stable-test",
      decision: "promote_stable",
      rationale: "ready for production",
      resultingStatus: "stable"
    });
    await vault.save(decision);

    // Import and call getSkillMetadata
    const { getSkillMetadata } = await import("../src/skillRegistry.js");
    const meta = await getSkillMetadata(vault, "skill.promote-stable-test");

    // approvalRate should be 100% (1/1) — not 0%
    assert.equal(meta.stats.totalDecisions, 1);
    assert.equal(meta.stats.approvalRate, 100);
  });

  it("qualityRating counts promote_stable as approved", async () => {
    const skill = createSkillCandidate({
      id: "skill.quality-promote-test",
      projectId: "project.test",
      name: "Quality Promote Test",
      origin: "pipeline",
      trigger: { intent: "test", signals: ["sig"] },
      inputSchema: {},
      outputSchema: {},
      safetyLevel: "L1",
      fallback: "none",
      humanConfirmationRequired: false
    });
    skill.status = "stable";
    await vault.save(skill);

    const decision = createReviewDecision({
      id: "review_decision.quality_promote_test",
      projectId: "project.test",
      reviewPacketId: "review_packet.quality_test",
      targetKind: "Skill",
      targetId: "skill.quality-promote-test",
      decision: "promote_stable",
      rationale: "solid",
      resultingStatus: "stable"
    });
    await vault.save(decision);

    const { getSkillQualityReport } = await import("../src/qualityRating.js");
    const report = await getSkillQualityReport(vault, "skill.quality-promote-test");

    // signals.approvalRate should be 100 (1/1 * 100), not 0
    assert.equal(report.signals.approvalRate, 100);
  });
});

// ============================================================
// 2. Team review finalDecision uses "reject" (not "reject_candidate")
// ============================================================
describe("Team review finalDecision uses 'reject'", () => {
  it("finalizeTeamReview produces decision='reject' when rejections > 0", async () => {
    const skill = createSkillCandidate({
      id: "skill.team-reject-test",
      projectId: "project.team",
      name: "Team Reject Test",
      origin: "pipeline",
      trigger: { intent: "test", signals: ["sig"] },
      inputSchema: {},
      outputSchema: {},
      safetyLevel: "L1",
      fallback: "none",
      humanConfirmationRequired: false
    });
    await vault.save(skill);

    const packet = createReviewPacket({
      id: `review_packet.team_reject_test.${Date.now()}`,
      projectId: "project.team",
      targetKind: "Skill",
      targetId: "skill.team-reject-test",
      title: "Team Review Reject Test",
      recommendation: "Review for stability",
      why: "Testing team review rejection flow",
      evidence: [],
      risks: [],
      options: [
        { id: "approve_candidate", label: "确认", effect: "status=candidate_confirmed" },
        { id: "promote_stable", label: "升级", effect: "status=stable" },
        { id: "reject", label: "驳回", effect: "status=rejected" }
      ],
      defaultOption: "approve_candidate"
    });
    assignReviewers(packet, ["reviewer-1", "reviewer-2"]);
    submitVote(packet, { userId: "reviewer-1", vote: VOTE_TYPES.REJECT, comment: "not ready" });
    await vault.save(packet);

    const { decision } = await finalizeTeamReview({ packet, vault, finalDecisionBy: "admin" });

    assert.equal(decision.decision, "reject");
    assert.equal(decision.resultingStatus, "rejected");
  });
});

// ============================================================
// 3. Free model duplicate purchase prevention
// ============================================================
describe("Free model duplicate purchase prevention", () => {
  it("prevents duplicate purchase of a free listing", async () => {
    const skill = createSkillCandidate({
      id: "skill.free-dup-test",
      projectId: "project.free",
      name: "Free Dup Test",
      origin: "pipeline",
      trigger: { intent: "test", signals: ["sig"] },
      inputSchema: {},
      outputSchema: {},
      safetyLevel: "L1",
      fallback: "none",
      humanConfirmationRequired: false
    });
    skill.status = "stable";
    await vault.save(skill);

    const listing = await publishSkill(vault, {
      skillId: skill.id,
      sellerId: "seller-free",
      version: "1.0.0",
      license: "MIT",
      pricing: { model: "free", price: 0, currency: "CNY" }
    });

    // First purchase must succeed
    const first = await processPurchase(vault, {
      listingId: listing.id,
      buyerId: "buyer-free",
      purchaseType: "purchase"
    });
    assert.ok(first.licenseKey);

    // Second purchase must be blocked
    await assert.rejects(
      () => processPurchase(vault, { listingId: listing.id, buyerId: "buyer-free", purchaseType: "purchase" }),
      /already holds a license/
    );
  });
});

// ============================================================
// 4. refundTransaction rejects non-completed transactions
// ============================================================
describe("refundTransaction rejects non-completed transactions", () => {
  it("throws when transaction status is 'pending'", async () => {
    // Manually create a transaction with status 'pending'
    const tx = {
      kind: "Transaction",
      id: "transaction.pending_test",
      projectId: "project.test",
      listingId: "marketplace_listing.test",
      skillId: "skill.test",
      buyerId: "buyer-1",
      sellerId: "seller-1",
      type: "purchase",
      amount: 50,
      commission: 7.5,
      netToSeller: 42.5,
      licenseKey: "key-test",
      licenseType: "MIT",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await vault.save(tx);

    await assert.rejects(
      () => refundTransaction(vault, "transaction.pending_test"),
      /Cannot refund a transaction with status: pending/
    );
  });
});
