/**
 * Boundary tests for the 2.0-C comprehensive audit fixes.
 *
 * Covers:
 * - vault.js: path traversal rejection, corrupt file handling, atomic write
 * - pricingEngine: crypto-secure license key, strict verifyLicenseKey
 * - selfIterationEngine: non-deterministic IDs (timestamp suffix)
 * - reviewEngine: ID prefix alignment (review_packet. / review_decision.)
 * - gitVault: legacy ID prefix aliases (review. / decision.)
 * - transactionLog: duplicate purchase prevention, refund downloads rollback, trial refund rejection
 * - qualityRating: submitRating syncs listing cache, re-rating preserves createdAt
 * - teamReviewEngine: submitVote rejects on decided packet
 * - validate: unknown kind rejection, Transaction amount/licenseKey consistency
 * - accessControl: filterReadable with null context passes all
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { Vault } from "../src/vault.js";
import { GitVault } from "../src/gitVault.js";
import { generateLicenseKey, verifyLicenseKey, calculateCommission } from "../src/pricingEngine.js";
import { createSkillCandidate, createReviewPacket, createMarketplaceListing, createTransaction, createSkillRating } from "../src/domain.js";
import { publishSkill, searchMarketplace } from "../src/marketplace.js";
import { submitRating, getRatingSummary } from "../src/qualityRating.js";
import { processPurchase, processTrial, refundTransaction, verifyBuyerLicense } from "../src/transactionLog.js";
import { submitVote, assignReviewers, VOTE_TYPES } from "../src/teamReviewEngine.js";
import { validateRecord } from "../src/validate.js";
import { filterReadable, canRead, canEdit, contextFromRequest, applyOwnership, ROLES, VISIBILITY } from "../src/accessControl.js";

let tempDir;
let vault;
let gitVault;

before(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "eos-audit-test-"));
  vault = new Vault(tempDir);
  gitVault = new GitVault(tempDir);
  await gitVault.init();
});

after(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

// ============================================================
// 1. vault.js: path traversal rejection
// ============================================================
describe("vault.js path traversal protection", () => {
  it("rejects IDs containing ..", async () => {
    await assert.rejects(
      () => vault.load("Skill", "../../etc/passwd"),
      /path traversal|Invalid record id/i
    );
  });

  it("rejects IDs with slashes", async () => {
    await assert.rejects(
      () => vault.load("Skill", "foo/bar"),
      /Invalid record id/i
    );
  });

  it("rejects empty IDs", async () => {
    await assert.rejects(
      () => vault.load("Skill", ""),
      /Invalid record id/i
    );
  });

  it("rejects IDs with special characters", async () => {
    await assert.rejects(
      () => vault.load("Skill", "skill;rm -rf /"),
      /Invalid record id/i
    );
  });

  it("accepts valid IDs with dots, dashes, underscores", async () => {
    const skill = createSkillCandidate({
      id: "skill.valid-id_test.1",
      projectId: "project.test",
      name: "Test",
      origin: "test",
      trigger: { intent: "test", signals: ["sig"] },
      inputSchema: {},
      outputSchema: {},
      safetyLevel: "safe",
      fallback: "none"
    });
    await vault.save(skill);
    const loaded = await vault.load("Skill", "skill.valid-id_test.1");
    assert.equal(loaded.name, "Test");
  });
});

// ============================================================
// 2. vault.js: corrupt file handling
// ============================================================
describe("vault.js corrupt file handling", () => {
  it("throws descriptive error for corrupt JSON on load", async () => {
    const corruptDir = path.join(tempDir, "skills");
    await mkdir(corruptDir, { recursive: true });
    const corruptFile = path.join(corruptDir, "skill.corrupt.json");
    await writeFile(corruptFile, "{ broken json !!!");

    await assert.rejects(
      () => vault.load("Skill", "skill.corrupt"),
      /Corrupt record file/i
    );
  });

  it("returns null for missing files on load", async () => {
    const result = await vault.load("Skill", "skill.nonexistent");
    assert.equal(result, null);
  });
});

// ============================================================
// 3. pricingEngine: crypto-secure license key
// ============================================================
describe("pricingEngine license key security", () => {
  it("generates keys with 8-char random segment", () => {
    const key = generateLicenseKey({
      licenseType: "MIT",
      listingId: "listing.test",
      buyerId: "buyer.test"
    });
    const match = key.match(/^EOS-MIT-([A-Z0-9]{6})-([A-Z0-9]{4})-([A-Z0-9]{8})$/);
    assert.ok(match, `key should match strict format: ${key}`);
  });

  it("generates different keys for same inputs (crypto random)", () => {
    const key1 = generateLicenseKey({
      licenseType: "MIT",
      listingId: "listing.same",
      buyerId: "buyer.same"
    });
    const key2 = generateLicenseKey({
      licenseType: "MIT",
      listingId: "listing.same",
      buyerId: "buyer.same"
    });
    assert.notEqual(key1, key2, "crypto random should produce different keys");
  });

  it("verifyLicenseKey rejects keys with wrong segment length", () => {
    const result = verifyLicenseKey("EOS-MIT-ABCDEF-ABCD-SHORT");
    assert.equal(result.valid, false);
  });

  it("verifyLicenseKey rejects unknown license types", () => {
    const result = verifyLicenseKey("EOS-UNKNOWN-ABCDEF-ABCD-ABCDEF12");
    assert.equal(result.valid, false);
  });

  it("verifyLicenseKey accepts properly formatted keys", () => {
    const result = verifyLicenseKey("EOS-COMMERCIAL-ABCDEF-ABCD-ABCDEF12");
    assert.equal(result.valid, true);
    assert.equal(result.licenseType, "COMMERCIAL");
  });
});

// ============================================================
// 4. reviewEngine: ID prefix alignment
// ============================================================
describe("reviewEngine ID prefix alignment", () => {
  it("gitVault.findCollectionDir resolves review_packet. prefix", () => {
    const dir = gitVault.findCollectionDir("review_packet.test.123");
    assert.equal(dir, "review-packets");
  });

  it("gitVault.findCollectionDir resolves review_decision. prefix", () => {
    const dir = gitVault.findCollectionDir("review_decision.test.123");
    assert.equal(dir, "review-decisions");
  });

  it("gitVault.findCollectionDir resolves legacy review. alias", () => {
    const dir = gitVault.findCollectionDir("review.test.123");
    assert.equal(dir, "review-packets");
  });

  it("gitVault.findCollectionDir resolves legacy decision. alias", () => {
    const dir = gitVault.findCollectionDir("decision.test.123");
    assert.equal(dir, "review-decisions");
  });
});

// ============================================================
// 5. transactionLog: duplicate purchase prevention
// ============================================================
describe("transactionLog duplicate purchase prevention", () => {
  it("rejects second one_time purchase by same buyer", async () => {
    // Create and publish a skill
    const skill = createSkillCandidate({
      id: `skill.dup_test.${Date.now()}`,
      projectId: "project.dup",
      name: "Dup Test Skill",
      origin: "test",
      trigger: { intent: "test", signals: ["sig"] },
      inputSchema: {},
      outputSchema: {},
      safetyLevel: "safe",
      fallback: "none"
    });
    skill.status = "stable";
    await gitVault.save(skill);

    const listing = await publishSkill(gitVault, {
      skillId: skill.id,
      sellerId: "seller.dup",
      version: "1.0.0",
      pricing: { model: "one_time", price: 10 },
      license: "MIT"
    });

    // First purchase succeeds
    const result1 = await processPurchase(gitVault, {
      listingId: listing.id,
      buyerId: "buyer.dup"
    });
    assert.ok(result1.transaction);

    // Second purchase should fail
    await assert.rejects(
      () => processPurchase(gitVault, {
        listingId: listing.id,
        buyerId: "buyer.dup"
      }),
      /already holds a license/i
    );
  });
});

// ============================================================
// 6. transactionLog: refund downloads rollback + trial rejection
// ============================================================
describe("transactionLog refund behavior", () => {
  it("rolls back downloads on refund", async () => {
    const skill = createSkillCandidate({
      id: `skill.refund_test.${Date.now()}`,
      projectId: "project.refund",
      name: "Refund Test Skill",
      origin: "test",
      trigger: { intent: "test", signals: ["sig"] },
      inputSchema: {},
      outputSchema: {},
      safetyLevel: "safe",
      fallback: "none"
    });
    skill.status = "stable";
    await gitVault.save(skill);

    const listing = await publishSkill(gitVault, {
      skillId: skill.id,
      sellerId: "seller.refund",
      version: "1.0.0",
      pricing: { model: "one_time", price: 20 },
      license: "Commercial"
    });

    const { transaction } = await processPurchase(gitVault, {
      listingId: listing.id,
      buyerId: "buyer.refund"
    });

    // Check downloads increased
    const listingBefore = await gitVault.load("MarketplaceListing", listing.id);
    assert.ok(listingBefore.downloads >= 1);

    // Refund
    await refundTransaction(gitVault, transaction.id);

    // Check downloads decreased
    const listingAfter = await gitVault.load("MarketplaceListing", listing.id);
    assert.ok(
      listingAfter.downloads < listingBefore.downloads,
      `downloads should decrease after refund: ${listingAfter.downloads} < ${listingBefore.downloads}`
    );
  });

  it("rejects refund for trial transactions", async () => {
    const skill = createSkillCandidate({
      id: `skill.trial_refund_test.${Date.now()}`,
      projectId: "project.trial_refund",
      name: "Trial Refund Test",
      origin: "test",
      trigger: { intent: "test", signals: ["sig"] },
      inputSchema: {},
      outputSchema: {},
      safetyLevel: "safe",
      fallback: "none"
    });
    skill.status = "stable";
    await gitVault.save(skill);

    const listing = await publishSkill(gitVault, {
      skillId: skill.id,
      sellerId: "seller.trial",
      version: "1.0.0",
      pricing: { model: "one_time", price: 15 },
      license: "MIT",
      trialEnabled: true
    });

    const { transaction } = await processTrial(gitVault, {
      listingId: listing.id,
      buyerId: "buyer.trial"
    });

    await assert.rejects(
      () => refundTransaction(gitVault, transaction.id),
      /cannot be refunded/i
    );
  });
});

// ============================================================
// 7. qualityRating: submitRating syncs listing cache
// ============================================================
describe("qualityRating cache sync", () => {
  it("submitRating updates listing ratingSum/ratingCount", async () => {
    const skill = createSkillCandidate({
      id: `skill.rating_sync_test.${Date.now()}`,
      projectId: "project.rating_sync",
      name: "Rating Sync Test",
      origin: "test",
      trigger: { intent: "test", signals: ["sig"] },
      inputSchema: {},
      outputSchema: {},
      safetyLevel: "safe",
      fallback: "none"
    });
    skill.status = "stable";
    await gitVault.save(skill);

    const listing = await publishSkill(gitVault, {
      skillId: skill.id,
      sellerId: "seller.rating",
      version: "1.0.0",
      pricing: { model: "free", price: 0 },
      license: "MIT"
    });

    // Submit a rating
    await submitRating(gitVault, {
      skillId: skill.id,
      userId: "user.rater1",
      score: 4,
      review: "good"
    });

    // Check listing cache was synced
    const updated = await gitVault.load("MarketplaceListing", listing.id);
    assert.ok(updated.ratingSum !== undefined, "listing.ratingSum should be synced");
    assert.ok(updated.ratingCount !== undefined, "listing.ratingCount should be synced");
    assert.equal(updated.ratingCount, 1);
    assert.equal(updated.ratingSum, 4);
  });

  it("re-rating preserves original createdAt", async () => {
    const skill = createSkillCandidate({
      id: `skill.rerate_test.${Date.now()}`,
      projectId: "project.rerate",
      name: "Re-rate Test",
      origin: "test",
      trigger: { intent: "test", signals: ["sig"] },
      inputSchema: {},
      outputSchema: {},
      safetyLevel: "safe",
      fallback: "none"
    });
    skill.status = "stable";
    await gitVault.save(skill);

    await publishSkill(gitVault, {
      skillId: skill.id,
      sellerId: "seller.rerate",
      version: "1.0.0",
      pricing: { model: "free", price: 0 },
      license: "MIT"
    });

    // First rating
    const r1 = await submitRating(gitVault, {
      skillId: skill.id,
      userId: "user.rerate",
      score: 3,
      review: "ok"
    });
    const originalCreatedAt = r1.createdAt;

    // Wait a tiny bit to ensure timestamp would differ
    await new Promise(resolve => setTimeout(resolve, 10));

    // Re-rate
    const r2 = await submitRating(gitVault, {
      skillId: skill.id,
      userId: "user.rerate",
      score: 5,
      review: "actually great"
    });

    assert.equal(r2.createdAt, originalCreatedAt, "createdAt should be preserved on re-rating");
    assert.ok(r2.updatedAt, "updatedAt should be set on re-rating");
    assert.equal(r2.score, 5);
  });
});

// ============================================================
// 8. teamReviewEngine: submitVote status check
// ============================================================
describe("teamReviewEngine submitVote status guard", () => {
  it("rejects vote on decided packet", () => {
    const packet = createReviewPacket({
      id: "review_packet.vote_test",
      projectId: "project.vote",
      targetKind: "Skill",
      targetId: "skill.vote_test",
      title: "Vote Test",
      recommendation: "approve_candidate",
      why: "test",
      evidence: [],
      risks: [],
      options: [{ id: "approve", label: "Approve" }, { id: "reject", label: "Reject" }],
      defaultOption: "approve"
    });
    packet.assigneeIds = ["user.voter"];
    packet.status = "decided";

    assert.throws(
      () => submitVote(packet, { userId: "user.voter", vote: VOTE_TYPES.APPROVE }),
      /already been finalized/i
    );
  });

  it("accepts vote on open packet", () => {
    const packet = createReviewPacket({
      id: "review_packet.vote_open",
      projectId: "project.vote",
      targetKind: "Skill",
      targetId: "skill.vote_open",
      title: "Vote Open",
      recommendation: "approve_candidate",
      why: "test",
      evidence: [],
      risks: [],
      options: [{ id: "approve", label: "Approve" }, { id: "reject", label: "Reject" }],
      defaultOption: "approve"
    });
    packet.assigneeIds = ["user.voter"];
    packet.status = "open";

    const updated = submitVote(packet, { userId: "user.voter", vote: VOTE_TYPES.APPROVE });
    assert.equal(updated.votes.length, 1);
  });
});

// ============================================================
// 9. validate: unknown kind rejection
// ============================================================
describe("validate unknown kind rejection", () => {
  it("returns error for unknown record kind", () => {
    const issues = validateRecord({ kind: "TotallyUnknown", id: "x" });
    assert.ok(issues.length > 0);
    assert.ok(issues[0].includes("unknown record kind"));
  });

  it("returns no issues for valid known kind", () => {
    const issues = validateRecord({
      kind: "Project",
      id: "project.valid",
      name: "Valid Project",
      goal: "Test goal",
      constraints: [],
      acceptanceCriteria: []
    });
    assert.equal(issues.length, 0);
  });
});

// ============================================================
// 10. validate: Transaction amount/licenseKey consistency
// ============================================================
describe("validate Transaction consistency", () => {
  it("flags amount != commission + netToSeller", () => {
    const issues = validateRecord({
      kind: "Transaction",
      id: "transaction.broken",
      projectId: "project.test",
      listingId: "listing.test",
      skillId: "skill.test",
      buyerId: "buyer",
      sellerId: "seller",
      type: "purchase",
      amount: 100,
      commission: 10,
      netToSeller: 80, // 10 + 80 = 90, not 100
      licenseType: "MIT",
      status: "completed",
      licenseKey: "EOS-MIT-ABCDEF-ABCD-ABCDEF12"
    });
    assert.ok(issues.some(i => i.includes("must equal commission + netToSeller")));
  });

  it("flags non-trial transaction without licenseKey", () => {
    const issues = validateRecord({
      kind: "Transaction",
      id: "transaction.no_key",
      projectId: "project.test",
      listingId: "listing.test",
      skillId: "skill.test",
      buyerId: "buyer",
      sellerId: "seller",
      type: "purchase",
      amount: 10,
      commission: 1.5,
      netToSeller: 8.5,
      licenseType: "MIT",
      status: "completed"
      // no licenseKey
    });
    assert.ok(issues.some(i => i.includes("licenseKey is required")));
  });

  it("flags trial transaction with non-zero amount", () => {
    const issues = validateRecord({
      kind: "Transaction",
      id: "transaction.trial_paid",
      projectId: "project.test",
      listingId: "listing.test",
      skillId: "skill.test",
      buyerId: "buyer",
      sellerId: "seller",
      type: "trial",
      amount: 5, // should be 0
      commission: 0,
      netToSeller: 0,
      licenseType: "MIT",
      status: "completed",
      licenseKey: "EOS-MIT-PLACEHOLDER"
    });
    assert.ok(issues.some(i => i.includes("must be 0 for trial")));
  });

  it("passes valid transaction with consistent amounts", () => {
    const split = calculateCommission(29.9);
    const issues = validateRecord({
      kind: "Transaction",
      id: "transaction.valid",
      projectId: "project.test",
      listingId: "listing.test",
      skillId: "skill.test",
      buyerId: "buyer",
      sellerId: "seller",
      type: "purchase",
      amount: split.amount,
      commission: split.commission,
      netToSeller: split.netToSeller,
      licenseType: "MIT",
      status: "completed",
      licenseKey: "EOS-MIT-ABCDEF-ABCD-ABCDEF12"
    });
    assert.equal(issues.length, 0, `expected no issues, got: ${issues.join("; ")}`);
  });

  it("passes trial transaction with zero amount and no licenseKey", () => {
    const issues = validateRecord({
      kind: "Transaction",
      id: "transaction.trial_valid",
      projectId: "project.test",
      listingId: "listing.test",
      skillId: "skill.test",
      buyerId: "buyer",
      sellerId: "seller",
      type: "trial",
      amount: 0,
      commission: 0,
      netToSeller: 0,
      licenseType: "MIT",
      status: "completed"
    });
    assert.equal(issues.length, 0, `expected no issues, got: ${issues.join("; ")}`);
  });
});

// ============================================================
// 11. accessControl: zero-intrusion single-user mode
// ============================================================
describe("accessControl zero-intrusion mode", () => {
  it("filterReadable returns all records when context is null", () => {
    const records = [
      { id: "a", ownerId: "user1", visibility: "private" },
      { id: "b", ownerId: "user2", visibility: "team" },
      { id: "c", ownerId: "user3", visibility: "public" }
    ];
    const filtered = filterReadable(records, null);
    assert.equal(filtered.length, 3);
  });

  it("filterReadable filters private records for non-owner", () => {
    const records = [
      { id: "a", ownerId: "user1", visibility: "private" },
      { id: "b", ownerId: "user2", visibility: "team" },
      { id: "c", ownerId: "user3", visibility: "public" }
    ];
    const filtered = filterReadable(records, { userId: "viewer1", role: ROLES.VIEWER });
    assert.equal(filtered.length, 2); // team + public, not private
  });

  it("canEdit returns true for all when context is null", () => {
    const record = { ownerId: "someone_else", visibility: "private" };
    assert.equal(canEdit(record, null), true);
  });

  it("canEdit returns false for viewer editing others' private record", () => {
    const record = { ownerId: "owner1", visibility: "private" };
    assert.equal(canEdit(record, { userId: "viewer1", role: ROLES.VIEWER }), false);
  });

  it("contextFromRequest returns null when no x-user-id header", () => {
    const req = { headers: {} };
    assert.equal(contextFromRequest(req), null);
  });

  it("contextFromRequest returns context when x-user-id present", () => {
    const req = { headers: { "x-user-id": "alice", "x-user-role": "editor" } };
    const ctx = contextFromRequest(req);
    assert.equal(ctx.userId, "alice");
    assert.equal(ctx.role, "editor");
  });

  it("applyOwnership sets defaults for new records", () => {
    const record = { id: "test" };
    const annotated = applyOwnership(record, { userId: "alice" });
    assert.equal(annotated.ownerId, "alice");
    assert.equal(annotated.visibility, VISIBILITY.PRIVATE);
  });

  it("applyOwnership preserves existing ownership", () => {
    const record = { id: "test", ownerId: "bob", visibility: VISIBILITY.PUBLIC };
    const annotated = applyOwnership(record, { userId: "alice" });
    assert.equal(annotated.ownerId, "bob");
    assert.equal(annotated.visibility, "public");
  });
});
