/**
 * Critical bug-fix regression tests for Experience OS.
 *
 * Each describe block pins a specific fix so it cannot silently regress:
 *   1. TOCTOU double-decision prevention in reviewEngine.applyReviewDecision
 *   2. BetaFeedback stage="blocked" requires a non-empty blocked field
 *   3. Marketplace unpublishSkill rejects a suspended listing
 *   4. buildProjectTimeline survives records with missing timestamps
 *   5. boundedText coerces non-string helped/blocked to "" (not "[object Object]")
 *
 * Every test uses a fresh temp GitVault so nothing depends on the real vault.
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { GitVault } from "../src/gitVault.js";
import {
  createReviewPacket,
  createPreferenceHypothesis,
  createSkillCandidate
} from "../src/domain.js";
import { applyReviewDecision } from "../src/reviewEngine.js";
import { submitBetaFeedback } from "../src/betaFeedback.js";
import { publishSkill, suspendListing, unpublishSkill } from "../src/marketplace.js";
import { startProject, buildProjectTimeline } from "../src/projectEngine.js";

let tmpDir;
let vault;

beforeEach(async () => {
  tmpDir = await mkdtemp(path.join(tmpdir(), "eos-critical-"));
  vault = new GitVault(tmpDir);
  await vault.init();
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

// ============================================================
// 1. TOCTOU double-decision prevention in reviewEngine.js
// ============================================================
describe("TOCTOU double-decision prevention in applyReviewDecision", () => {
  it("throws on the second call to applyReviewDecision for the same packet", async () => {
    // Create a preference hypothesis as the review target so the decision
    // can be written back (no wall-hit path).
    const preference = createPreferenceHypothesis({
      id: "pref.toctou",
      projectId: "project.toctou",
      statement: "User prefers concise summaries",
      evidenceIds: ["ev.toctou"],
      confidence: 0.5
    });
    await vault.save(preference);

    const packet = createReviewPacket({
      id: "review_packet.toctou.pref",
      projectId: "project.toctou",
      targetKind: "PreferenceHypothesis",
      targetId: "pref.toctou",
      title: "Confirm preference hypothesis",
      recommendation: "Confirm before固化.",
      why: "Observed consistent preference for concise output.",
      evidence: ["ev.toctou"],
      risks: ["Preference may change across project phases."],
      options: [
        { id: "confirm", label: "Confirm", effect: "status=confirmed" },
        { id: "reject", label: "Reject", effect: "status=rejected" }
      ],
      defaultOption: "confirm"
    });
    await vault.save(packet);

    // First decision must succeed and mark the packet as decided.
    const first = await applyReviewDecision({
      vault,
      packet,
      decision: "confirm",
      rationale: "first call"
    });
    assert.equal(first.decision, "confirm");
    assert.equal(first.resultingStatus, "confirmed");

    const reloaded = await vault.load("ReviewPacket", packet.id);
    assert.equal(reloaded.status, "decided");

    // Second decision on the same packet must throw — the TOCTOU guard
    // reloads the packet inside the transaction and detects the prior decision.
    await assert.rejects(
      () => applyReviewDecision({ vault, packet, decision: "confirm", rationale: "second call" }),
      /already decided/
    );
  });
});

// ============================================================
// 2. BetaFeedback stage="blocked" validation
// ============================================================
describe("BetaFeedback stage=blocked validation", () => {
  it("throws when stage is 'blocked' but the blocked field is empty", async () => {
    await assert.rejects(
      () => submitBetaFeedback(vault, {
        consent: true,
        stage: "blocked",
        usefulness: 2,
        clarity: 2,
        wouldUseAgain: "no",
        blocked: ""
      }),
      /blocked field is required/
    );
  });

  it("throws when stage is 'blocked' and blocked field is only whitespace", async () => {
    await assert.rejects(
      () => submitBetaFeedback(vault, {
        consent: true,
        stage: "blocked",
        usefulness: 1,
        clarity: 1,
        wouldUseAgain: "no",
        blocked: "   "
      }),
      /blocked field is required/
    );
  });

  it("accepts stage='blocked' when blocked field is non-empty", async () => {
    const feedback = await submitBetaFeedback(vault, {
      consent: true,
      stage: "blocked",
      usefulness: 2,
      clarity: 2,
      wouldUseAgain: "no",
      blocked: "Could not install the package on Node 18."
    });
    assert.equal(feedback.stage, "blocked");
    assert.equal(feedback.blocked, "Could not install the package on Node 18.");
  });
});

// ============================================================
// 3. Marketplace state validation — unpublish on suspended listing
// ============================================================
describe("Marketplace state validation", () => {
  it("throws 'cannot unpublish a suspended listing' when unpublishing a suspended listing", async () => {
    const skill = createSkillCandidate({
      id: "skill.suspended_test",
      projectId: "project.market_critical",
      name: "Suspended Test Skill",
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
      skillId: "skill.suspended_test",
      sellerId: "seller.critical",
      pricing: { model: "free", price: 0, currency: "CNY" },
      license: "MIT"
    });
    assert.equal(listing.status, "active");

    const suspended = await suspendListing(vault, listing.id);
    assert.equal(suspended.status, "suspended");

    // A suspended listing is a platform-level action; unpublish must be refused
    // so the seller cannot mask a suspension by silently withdrawing the listing.
    await assert.rejects(
      () => unpublishSkill(vault, listing.id),
      /cannot unpublish a suspended listing/
    );

    // The listing must remain suspended (not silently changed to unpublished).
    const stillSuspended = await vault.load("MarketplaceListing", listing.id);
    assert.equal(stillSuspended.status, "suspended");
  });
});

// ============================================================
// 4. Timeline sort with missing timestamps
// ============================================================
describe("Timeline sort with missing timestamps", () => {
  it("does not crash when records have missing createdAt/capturedAt fields", async () => {
    await startProject(vault, { id: "project.missing_ts", name: "x", goal: "g" });

    // Save records of the directly-listed kinds (DecisionReceipt, OutcomeRecord,
    // WorkCheckpoint) with NO createdAt field. buildProjectTimeline extracts
    // timestamp = record.createdAt (undefined) and must sort without throwing.
    await vault.save({
      id: "decision.missing_ts",
      kind: "DecisionReceipt",
      projectId: "project.missing_ts",
      action: "test",
      target: "target",
      rationale: "rationale",
      evidenceLinkIds: [],
      autonomyMode: "advise",
      humanReviewed: false,
      revertible: true,
      updatedAt: new Date().toISOString()
      // intentionally no createdAt
    });

    await vault.save({
      id: "outcome.missing_ts",
      kind: "OutcomeRecord",
      projectId: "project.missing_ts",
      action: "test",
      outcome: "success",
      evidenceLinkIds: [],
      metrics: {},
      updatedAt: new Date().toISOString()
      // intentionally no createdAt
    });

    await vault.save({
      id: "checkpoint.missing_ts",
      kind: "WorkCheckpoint",
      projectId: "project.missing_ts",
      title: "missing-timestamp checkpoint",
      eventId: "event.missing_ts",
      evidenceLinkId: "evidence.missing_ts",
      notes: "",
      status: "captured",
      updatedAt: new Date().toISOString()
      // intentionally no createdAt
    });

    // Must not throw — the sort uses (b.timestamp || "").localeCompare(a.timestamp || "").
    const timeline = await buildProjectTimeline(vault, "project.missing_ts");
    assert.ok(Array.isArray(timeline.timeline));
    assert.equal(timeline.timeline.length, 3);
    assert.equal(timeline.counts.decisions, 1);
    assert.equal(timeline.counts.outcomes, 1);
    assert.equal(timeline.counts.checkpoints, 1);
  });

  it("sorts correctly when some records have timestamps and others do not", async () => {
    await startProject(vault, { id: "project.mixed_ts", name: "x", goal: "g" });

    // A record WITH a createdAt
    await vault.save({
      id: "decision.with_ts",
      kind: "DecisionReceipt",
      projectId: "project.mixed_ts",
      action: "a",
      target: "t",
      rationale: "r",
      evidenceLinkIds: [],
      autonomyMode: "advise",
      humanReviewed: false,
      revertible: true,
      createdAt: "2026-07-20T10:00:00.000Z",
      updatedAt: "2026-07-20T10:00:00.000Z"
    });

    // A record WITHOUT a createdAt
    await vault.save({
      id: "outcome.without_ts",
      kind: "OutcomeRecord",
      projectId: "project.mixed_ts",
      action: "a",
      outcome: "success",
      evidenceLinkIds: [],
      metrics: {},
      updatedAt: new Date().toISOString()
      // intentionally no createdAt
    });

    const timeline = await buildProjectTimeline(vault, "project.mixed_ts");
    assert.equal(timeline.timeline.length, 2);
    // Both records must be present — no item is lost by the sort comparator.
    const kinds = timeline.timeline.map((item) => item.kind);
    assert.ok(kinds.includes("DecisionReceipt"));
    assert.ok(kinds.includes("OutcomeRecord"));
  });
});

// ============================================================
// 5. boundedText type check — non-string inputs
// ============================================================
describe("boundedText type check for non-string inputs", () => {
  it("coerces non-string helped/blocked to empty string, not '[object Object]'", async () => {
    const feedback = await submitBetaFeedback(vault, {
      consent: true,
      stage: "after_trying",
      usefulness: 4,
      clarity: 4,
      wouldUseAgain: "yes",
      helped: { foo: "bar" },
      blocked: { baz: "qux" }
    });
    assert.equal(feedback.helped, "");
    assert.equal(feedback.blocked, "");
    assert.notEqual(feedback.helped, "[object Object]");
    assert.notEqual(feedback.blocked, "[object Object]");
  });

  it("coerces numeric and array inputs to empty string as well", async () => {
    const feedback = await submitBetaFeedback(vault, {
      consent: true,
      stage: "first_impression",
      usefulness: 5,
      clarity: 5,
      wouldUseAgain: "yes",
      helped: 12345,
      blocked: ["not", "a", "string"]
    });
    assert.equal(feedback.helped, "");
    assert.equal(feedback.blocked, "");
  });
});
