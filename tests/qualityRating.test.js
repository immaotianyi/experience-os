/**
 * Test suite for qualityRating.js — market-aware quality scoring & ratings.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { GitVault } from "../src/gitVault.js";
import { createSkillCandidate, createReviewPacket, createReviewDecision, createMarketplaceListing } from "../src/domain.js";
import {
  submitRating,
  getRatingSummary,
  computeMarketQualityScore,
  computeQualityGrade,
  getSkillQualityReport,
  autoFlagLowQuality,
  getQualityLeaderboard
} from "../src/qualityRating.js";

let tempDir;
let vault;

before(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "eos-quality-test-"));
  vault = new GitVault(tempDir);
  await vault.init();

  // Seed a stable skill with reviews + reuse context
  const skill = createSkillCandidate({
    id: "skill.quality_stable",
    projectId: "project.quality",
    name: "Quality Stable Skill",
    origin: "pipeline",
    trigger: { intent: "quality_intent", signals: ["sig_a"] },
    inputSchema: { type: "object" },
    outputSchema: { type: "object" },
    safetyLevel: "L1",
    fallback: "none",
    humanConfirmationRequired: false
  });
  skill.status = "stable";
  await vault.save(skill);

  // Review packet + approve decision
  const packet = createReviewPacket({
    id: "review_packet.quality_rp1",
    projectId: "project.quality",
    targetKind: "Skill",
    targetId: "skill.quality_stable",
    title: "Review",
    recommendation: "approve",
    why: "good",
    evidence: [],
    risks: [],
    options: [{ id: "approve_candidate", label: "Approve" }],
    defaultOption: "approve_candidate"
  });
  await vault.save(packet);
  const decision = createReviewDecision({
    id: "review_decision.quality_rd1",
    projectId: "project.quality",
    reviewPacketId: "review_packet.quality_rp1",
    targetKind: "Skill",
    targetId: "skill.quality_stable",
    decision: "promote_stable",
    rationale: "solid",
    resultingStatus: "stable"
  });
  await vault.save(decision);

  // A second stable skill with no reviews (low quality)
  const lowSkill = createSkillCandidate({
    id: "skill.quality_low",
    projectId: "project.quality",
    name: "Low Quality Skill",
    origin: "import",
    trigger: { intent: "low_intent", signals: ["sig_b"] },
    inputSchema: { type: "object" },
    outputSchema: { type: "object" },
    safetyLevel: "L1",
    fallback: "none",
    humanConfirmationRequired: false
  });
  lowSkill.status = "stable";
  await vault.save(lowSkill);
});

after(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("submitRating", () => {
  it("creates a rating record", async () => {
    const rating = await submitRating(vault, {
      skillId: "skill.quality_stable",
      userId: "user.alpha",
      score: 5,
      review: "excellent"
    });
    assert.equal(rating.kind, "SkillRating");
    assert.equal(rating.score, 5);
    assert.equal(rating.userId, "user.alpha");
  });

  it("rejects score below 1", async () => {
    await assert.rejects(
      () => submitRating(vault, { skillId: "skill.quality_stable", userId: "user.bad", score: 0 }),
      /score must be/
    );
  });

  it("rejects score above 5", async () => {
    await assert.rejects(
      () => submitRating(vault, { skillId: "skill.quality_stable", userId: "user.bad", score: 6 }),
      /score must be/
    );
  });

  it("rejects missing skillId", async () => {
    await assert.rejects(
      () => submitRating(vault, { userId: "user.bad", score: 3 }),
      /skillId is required/
    );
  });

  it("rejects missing userId", async () => {
    await assert.rejects(
      () => submitRating(vault, { skillId: "skill.quality_stable", score: 3 }),
      /userId is required/
    );
  });

  it("replaces existing rating from same user", async () => {
    await submitRating(vault, { skillId: "skill.quality_stable", userId: "user.replace", score: 3 });
    const updated = await submitRating(vault, {
      skillId: "skill.quality_stable",
      userId: "user.replace",
      score: 4,
      review: "improved"
    });
    assert.equal(updated.score, 4);

    const summary = await getRatingSummary(vault, "skill.quality_stable");
    const replaceRatings = summary.ratings.filter((r) => r.userId === "user.replace");
    assert.equal(replaceRatings.length, 1);
  });
});

describe("getRatingSummary", () => {
  it("returns summary with average and distribution", async () => {
    const summary = await getRatingSummary(vault, "skill.quality_stable");
    assert.ok(summary.count >= 1);
    assert.ok(summary.average > 0);
    assert.equal(Object.keys(summary.distribution).length, 5);
  });

  it("returns empty summary for unrated skill", async () => {
    const summary = await getRatingSummary(vault, "skill.quality_low");
    assert.equal(summary.count, 0);
    assert.equal(summary.average, 0);
  });
});

describe("computeMarketQualityScore", () => {
  it("returns higher score for skill with strong signals", () => {
    const high = computeMarketQualityScore({
      reuseCount: 5,
      approvalPct: 1,
      reviewCount: 4,
      downloadCount: 20,
      ratingCount: 8,
      ratingAverage: 4.5,
      revenue: 100,
      gitCommits: 10
    });
    const low = computeMarketQualityScore({
      reuseCount: 0,
      approvalPct: 0,
      reviewCount: 0,
      downloadCount: 0,
      ratingCount: 0,
      ratingAverage: 0,
      revenue: 0,
      gitCommits: 0
    });
    assert.ok(high > low);
    assert.ok(high > 50);
    assert.equal(low, 0);
  });

  it("caps at 100", () => {
    const score = computeMarketQualityScore({
      reuseCount: 100,
      approvalPct: 1,
      reviewCount: 100,
      downloadCount: 1000,
      ratingCount: 100,
      ratingAverage: 5,
      revenue: 10000,
      gitCommits: 100
    });
    assert.ok(score <= 100);
  });
});

describe("computeQualityGrade", () => {
  it("returns S for 90+", () => assert.equal(computeQualityGrade(95), "S"));
  it("returns A for 80-89", () => assert.equal(computeQualityGrade(85), "A"));
  it("returns B for 70-79", () => assert.equal(computeQualityGrade(75), "B"));
  it("returns C for 60-69", () => assert.equal(computeQualityGrade(65), "C"));
  it("returns D for <60", () => assert.equal(computeQualityGrade(50), "D"));
});

describe("getSkillQualityReport", () => {
  it("returns report with signals and grade", async () => {
    const report = await getSkillQualityReport(vault, "skill.quality_stable");
    assert.equal(report.skillId, "skill.quality_stable");
    assert.ok(report.score >= 0);
    assert.ok(["S", "A", "B", "C", "D"].includes(report.grade));
    assert.equal(report.signals.approvalRate, 100);
  });

  it("returns null for missing skill", async () => {
    const report = await getSkillQualityReport(vault, "skill.nonexistent");
    assert.equal(report, null);
  });

  it("flags low-quality stable skill", async () => {
    const report = await getSkillQualityReport(vault, "skill.quality_low");
    assert.equal(report.shouldFlag, true);
    assert.equal(report.grade, "D");
  });
});

describe("autoFlagLowQuality", () => {
  it("flags stable skills with D grade as needs_revision", async () => {
    const flagged = await autoFlagLowQuality(vault);
    assert.ok(flagged.length >= 1);
    const lowFlag = flagged.find((f) => f.skillId === "skill.quality_low");
    assert.ok(lowFlag, "low skill should be flagged");

    const updated = await vault.load("Skill", "skill.quality_low");
    assert.equal(updated.status, "needs_revision");
    assert.equal(updated.promotionGate, "quality_below_threshold");
  });

  it("does not flag already-flagged skills again", async () => {
    const flagged = await autoFlagLowQuality(vault);
    const lowFlag = flagged.find((f) => f.skillId === "skill.quality_low");
    assert.equal(lowFlag, undefined);
  });
});

describe("getQualityLeaderboard", () => {
  it("returns sorted leaderboard", async () => {
    const board = await getQualityLeaderboard(vault, 10);
    assert.ok(board.length >= 1);
    // Higher score should come first
    for (let i = 1; i < board.length; i++) {
      assert.ok(board[i - 1].score >= board[i].score);
    }
  });

  it("respects limit", async () => {
    const board = await getQualityLeaderboard(vault, 1);
    assert.equal(board.length, 1);
  });
});
