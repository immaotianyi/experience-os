/**
 * End-to-end integration test: full marketplace lifecycle.
 *
 * Flow: create skill → publish → search → download → purchase → trial →
 *       rate → quality report → revenue summary → verify license →
 *       refund → revenue decrease → unpublish → stats
 *
 * This test exercises all 4 modules (marketplace, pricingEngine,
 * qualityRating, transactionLog) together with real GitVault.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { GitVault } from "../src/gitVault.js";
import { createSkillCandidate, createReviewPacket, createReviewDecision } from "../src/domain.js";
import { publishSkill, unpublishSkill, searchMarketplace, getListingDetails, recordDownload, getMarketplaceStats } from "../src/marketplace.js";
import { submitRating, getRatingSummary, getSkillQualityReport, getQualityLeaderboard, autoFlagLowQuality } from "../src/qualityRating.js";
import { processPurchase, processTrial, refundTransaction, getTransactionHistory, getRevenueSummary, verifyBuyerLicense } from "../src/transactionLog.js";
import { calculateCommission, checkTrial, verifyLicenseKey } from "../src/pricingEngine.js";

let tempDir;
let vault;
let skillId = "skill.e2e_lifecycle";
let listingId;

before(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "eos-e2e-test-"));
  vault = new GitVault(tempDir);
  await vault.init();

  // Seed a stable skill with review history
  const skill = createSkillCandidate({
    id: skillId,
    projectId: "project.e2e",
    name: "E2E Lifecycle Skill",
    origin: "pipeline",
    trigger: { intent: "e2e_intent", signals: ["e2e_sig"] },
    inputSchema: { type: "object", properties: {} },
    outputSchema: { type: "object", properties: {} },
    safetyLevel: "L1",
    fallback: "none",
    humanConfirmationRequired: false
  });
  skill.status = "stable";
  await vault.save(skill);

  // Add review history for quality scoring
  const packet = createReviewPacket({
    id: "review_packet.e2e_rp1",
    projectId: "project.e2e",
    targetKind: "Skill",
    targetId: skillId,
    title: "E2E Review",
    recommendation: "approve",
    why: "solid skill",
    evidence: [],
    risks: [],
    options: [{ id: "approve_candidate", label: "Approve" }],
    defaultOption: "approve_candidate"
  });
  await vault.save(packet);

  const decision = createReviewDecision({
    id: "review_decision.e2e_rd1",
    projectId: "project.e2e",
    reviewPacketId: "review_packet.e2e_rp1",
    targetKind: "Skill",
    targetId: skillId,
    decision: "promote_stable",
    rationale: "production ready",
    resultingStatus: "stable"
  });
  await vault.save(decision);
});

after(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("E2E: Full marketplace lifecycle", () => {
  // ─── Phase 1: Publish ──────────────────────────────────────────────

  it("Phase 1.1: publishes a stable skill as paid one_time listing", async () => {
    const listing = await publishSkill(vault, {
      skillId,
      sellerId: "seller.e2e",
      pricing: { model: "one_time", price: 19.9, currency: "CNY" },
      license: "Commercial",
      trialEnabled: true,
      version: "1.0.0",
      summary: "E2E test skill for lifecycle validation"
    });
    assert.equal(listing.status, "active");
    assert.equal(listing.pricing.price, 19.9);
    listingId = listing.id;
  });

  it("Phase 1.2: listing appears in marketplace search", async () => {
    const results = await searchMarketplace(vault, { query: "e2e" });
    assert.ok(results.some((l) => l.id === listingId));
  });

  it("Phase 1.3: listing details include skill metadata", async () => {
    const details = await getListingDetails(vault, listingId);
    assert.equal(details.skill.id, skillId);
    assert.equal(details.effectivePrice, 19.9);
  });

  // ─── Phase 2: Downloads ────────────────────────────────────────────

  it("Phase 2.1: records downloads and increments counter", async () => {
    await recordDownload(vault, listingId);
    await recordDownload(vault, listingId);
    await recordDownload(vault, listingId);
    const details = await getListingDetails(vault, listingId);
    assert.ok(details.downloads >= 3);
  });

  // ─── Phase 3: Purchase ─────────────────────────────────────────────

  it("Phase 3.1: processes a paid purchase with correct commission split", async () => {
    const result = await processPurchase(vault, { listingId, buyerId: "buyer.e2e_1" });
    assert.equal(result.transaction.amount, 19.9);
    assert.equal(result.transaction.type, "purchase");
    assert.equal(result.transaction.licenseType, "Commercial");
    assert.ok(result.licenseKey.startsWith("EOS-COMMERCIAL-"));

    // Verify commission: 19.9 * 0.15 = 2.985 → 2.99 (rounded)
    const expected = calculateCommission(19.9);
    assert.equal(result.transaction.commission, expected.commission);
    assert.equal(result.transaction.netToSeller, expected.netToSeller);
  });

  it("Phase 3.2: updates listing revenue after purchase", async () => {
    const listing = await vault.load("MarketplaceListing", listingId);
    assert.ok(listing.revenue >= 19.9);
  });

  it("Phase 3.3: buyer holds a valid license after purchase", async () => {
    const license = await verifyBuyerLicense(vault, listingId, "buyer.e2e_1");
    assert.equal(license.hasLicense, true);
    assert.ok(license.licenseKey);
    assert.equal(license.licenseType, "Commercial");
  });

  it("Phase 3.4: license key passes format verification", async () => {
    const license = await verifyBuyerLicense(vault, listingId, "buyer.e2e_1");
    const verification = verifyLicenseKey(license.licenseKey);
    assert.equal(verification.valid, true);
  });

  // ─── Phase 4: Trial ────────────────────────────────────────────────

  it("Phase 4.1: processes a trial with zero amount", async () => {
    const result = await processTrial(vault, { listingId, buyerId: "buyer.trial_1" });
    assert.equal(result.transaction.type, "trial");
    assert.equal(result.transaction.amount, 0);
  });

  it("Phase 4.2: trial does NOT grant a license", async () => {
    const license = await verifyBuyerLicense(vault, listingId, "buyer.trial_1");
    assert.equal(license.hasLicense, false);
  });

  it("Phase 4.3: trial count tracked correctly", async () => {
    const status = await checkTrial(vault, listingId, "buyer.trial_1");
    assert.equal(status.used, 1);
    assert.equal(status.remaining, 2);
  });

  // ─── Phase 5: Ratings & Quality ────────────────────────────────────

  it("Phase 5.1: accepts multiple ratings from different users", async () => {
    await submitRating(vault, { skillId, userId: "user.r1", score: 5, review: "excellent" });
    await submitRating(vault, { skillId, userId: "user.r2", score: 4, review: "good" });
    await submitRating(vault, { skillId, userId: "user.r3", score: 5, review: "great" });

    const summary = await getRatingSummary(vault, skillId);
    assert.equal(summary.count, 3);
    assert.ok(summary.average >= 4);
    assert.equal(summary.distribution[5], 2);
    assert.equal(summary.distribution[4], 1);
  });

  it("Phase 5.2: quality report reflects marketplace signals", async () => {
    const report = await getSkillQualityReport(vault, skillId);
    assert.ok(report.score > 0);
    assert.ok(["S", "A", "B", "C", "D"].includes(report.grade));
    assert.ok(report.signals.downloadCount >= 3);
    assert.ok(report.signals.ratingCount >= 3);
    assert.ok(report.signals.revenue >= 19.9);
    assert.equal(report.signals.approvalRate, 100);
  });

  it("Phase 5.3: skill appears in quality leaderboard", async () => {
    const board = await getQualityLeaderboard(vault, 10);
    const entry = board.find((e) => e.skillId === skillId);
    assert.ok(entry, "skill should be in leaderboard");
    assert.ok(entry.score > 0);
  });

  // ─── Phase 6: Revenue & Transaction History ────────────────────────

  it("Phase 6.1: seller revenue summary includes all completed transactions", async () => {
    const summary = await getRevenueSummary(vault, "seller.e2e");
    assert.ok(summary.transactionCount >= 1);
    assert.ok(summary.totalRevenue >= 19.9);
    assert.ok(summary.netRevenue > 0);
    assert.ok(summary.netRevenue < summary.totalRevenue); // commission deducted
    assert.ok(summary.topSkills.length >= 1);
    assert.equal(summary.topSkills[0].skillId, skillId);
  });

  it("Phase 6.2: transaction history returns all transactions for listing", async () => {
    const history = await getTransactionHistory(vault, { listingId });
    // At least 1 purchase + 1 trial
    assert.ok(history.length >= 2);
    const types = history.map((t) => t.type);
    assert.ok(types.includes("purchase"));
    assert.ok(types.includes("trial"));
  });

  // ─── Phase 7: Refund ───────────────────────────────────────────────

  it("Phase 7.1: refunds a completed transaction and reverses revenue", async () => {
    const listingBefore = await vault.load("MarketplaceListing", listingId);
    const revenueBefore = listingBefore.revenue;

    // Find the purchase transaction
    const history = await getTransactionHistory(vault, { listingId, buyerId: "buyer.e2e_1" });
    const purchaseTx = history.find((t) => t.type === "purchase");
    assert.ok(purchaseTx);

    const refunded = await refundTransaction(vault, purchaseTx.id);
    assert.equal(refunded.status, "refunded");

    const listingAfter = await vault.load("MarketplaceListing", listingId);
    assert.ok(listingAfter.revenue < revenueBefore);
    assert.ok(listingAfter.revenue <= revenueBefore - 19.9 + 0.01); // allow float tolerance
  });

  it("Phase 7.2: refunded buyer loses license", async () => {
    const license = await verifyBuyerLicense(vault, listingId, "buyer.e2e_1");
    assert.equal(license.hasLicense, false);
  });

  // ─── Phase 8: Marketplace Stats ────────────────────────────────────

  it("Phase 8.1: marketplace stats reflect all activity", async () => {
    const stats = await getMarketplaceStats(vault);
    assert.ok(stats.activeListings >= 1);
    assert.ok(stats.totalDownloads >= 3);
    assert.ok(stats.totalTransactions >= 1);
    assert.ok(stats.pricingModels.one_time >= 1);
  });

  // ─── Phase 9: Unpublish & Cleanup ──────────────────────────────────

  it("Phase 9.1: unpublishing removes listing from active search", async () => {
    await unpublishSkill(vault, listingId);
    const results = await searchMarketplace(vault, { query: "e2e" });
    assert.ok(!results.some((l) => l.id === listingId));
  });

  it("Phase 9.2: unpublished listing still accessible via direct load", async () => {
    const details = await getListingDetails(vault, listingId);
    assert.ok(details);
    assert.equal(details.status, "unpublished");
  });

  // ─── Phase 10: Auto-flag does not break on marketplace data ─────────

  it("Phase 10.1: autoFlagLowQuality runs without errors on marketplace-enriched vault", async () => {
    const flagged = await autoFlagLowQuality(vault);
    assert.ok(Array.isArray(flagged));
  });
});
