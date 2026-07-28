/**
 * Tests for 3.0 domain objects: Project (upgraded), EvidenceLink,
 * ExperienceReceipt, DecisionReceipt, OutcomeRecord.
 *
 * Verifies:
 *   - factory functions produce valid records
 *   - 3.0 constants are frozen and well-formed
 *   - backward compatibility: createProject still works without 3.0 fields
 *   - faithful-compression fields (uncertainty, counterexamples, applicabilityBounds) are present
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  AUTONOMY_MODES,
  PROJECT_STATUSES,
  EVIDENCE_TYPES,
  OUTCOME_STATES,
  createProject,
  createEvidenceLink,
  createExperienceReceipt,
  createDecisionReceipt,
  createOutcomeRecord
} from "../src/domain.js";
import {
  validateProject,
  validateEvidenceLink,
  validateExperienceReceipt,
  validateDecisionReceipt,
  validateOutcomeRecord,
  validateRecord
} from "../src/validate.js";

describe("3.0 domain constants", () => {
  it("AUTONOMY_MODES has 5 levels in risk order", () => {
    assert.deepEqual([...AUTONOMY_MODES], ["explore", "advise", "draft", "execute", "commit"]);
  });

  it("PROJECT_STATUSES has 5 lifecycle states", () => {
    assert.deepEqual([...PROJECT_STATUSES], ["planning", "active", "paused", "completed", "archived"]);
  });

  it("EVIDENCE_TYPES has 8 types", () => {
    assert.equal(EVIDENCE_TYPES.length, 8);
    assert.ok(EVIDENCE_TYPES.includes("code"));
    assert.ok(EVIDENCE_TYPES.includes("feedback"));
    assert.ok(EVIDENCE_TYPES.includes("code-graph"));
  });

  it("OUTCOME_STATES has 4 states", () => {
    assert.deepEqual([...OUTCOME_STATES], ["success", "partial", "failure", "unknown"]);
  });

  it("all constants are frozen", () => {
    assert.ok(Object.isFrozen(AUTONOMY_MODES));
    assert.ok(Object.isFrozen(PROJECT_STATUSES));
    assert.ok(Object.isFrozen(EVIDENCE_TYPES));
    assert.ok(Object.isFrozen(OUTCOME_STATES));
  });
});

describe("createProject (3.0 upgraded)", () => {
  it("backward compat: works without any 3.0 fields", () => {
    const p = createProject({ id: "p1", name: "legacy", goal: "g" });
    assert.equal(p.kind, "Project");
    assert.equal(p.status, "planning");          // default
    assert.equal(p.autonomyMode, "advise");       // default — human decides
    assert.deepEqual(p.tags, []);
    assert.deepEqual(p.evidenceLinkIds, []);
    assert.deepEqual(p.experienceReceiptIds, []);
    assert.equal(p.metricsSummary, null);
    assert.equal(p.ownerId, null);
  });

  it("accepts 3.0 fields", () => {
    const p = createProject({
      id: "p2",
      name: "modern",
      goal: "g",
      ownerId: "user.alice",
      status: "active",
      autonomyMode: "draft",
      tags: ["research", "ui"],
      evidenceLinkIds: ["ev1", "ev2"],
      experienceReceiptIds: ["r1"]
    });
    assert.equal(p.ownerId, "user.alice");
    assert.equal(p.status, "active");
    assert.equal(p.autonomyMode, "draft");
    assert.deepEqual(p.tags, ["research", "ui"]);
    assert.deepEqual(p.evidenceLinkIds, ["ev1", "ev2"]);
    assert.deepEqual(p.experienceReceiptIds, ["r1"]);
  });

  it("passes validation", () => {
    const p = createProject({ id: "p3", name: "validated", goal: "g", autonomyMode: "execute" });
    assert.deepEqual(validateProject(p), []);
    assert.deepEqual(validateRecord(p), []);
  });

  it("rejects invalid autonomyMode", () => {
    const p = createProject({ id: "p4", name: "bad", goal: "g", autonomyMode: "teleport" });
    const issues = validateProject(p);
    assert.ok(issues.some((i) => i.includes("autonomyMode")));
  });
});

describe("createEvidenceLink", () => {
  it("creates a faithful evidence record with all compression fields", () => {
    const ev = createEvidenceLink({
      id: "ev.test1",
      projectId: "p1",
      type: "code",
      title: "auth.js diff",
      source: "git://repo/auth.js@abc123",
      hash: "sha256:deadbeef",
      uncertainty: 0.2,
      counterexamples: ["mobile flow does not apply"],
      applicabilityBounds: ["web only", "v2 API"]
    });
    assert.equal(ev.kind, "EvidenceLink");
    assert.equal(ev.type, "code");
    assert.equal(ev.uncertainty, 0.2);
    assert.deepEqual(ev.counterexamples, ["mobile flow does not apply"]);
    assert.deepEqual(ev.applicabilityBounds, ["web only", "v2 API"]);
    assert.ok(ev.capturedAt);
    assert.ok(ev.createdAt);
  });

  it("passes validation", () => {
    const ev = createEvidenceLink({
      id: "ev.test2",
      projectId: "p1",
      type: "test",
      title: "coverage report",
      source: "coverage/lcov.info"
    });
    assert.deepEqual(validateEvidenceLink(ev), []);
    assert.deepEqual(validateRecord(ev), []);
  });

  it("rejects invalid type", () => {
    const ev = createEvidenceLink({
      id: "ev.bad",
      projectId: "p1",
      type: "gossip",
      title: "x",
      source: "y"
    });
    const issues = validateEvidenceLink(ev);
    assert.ok(issues.some((i) => i.includes("type")));
  });

  it("rejects out-of-range uncertainty", () => {
    const ev = createEvidenceLink({
      id: "ev.unc",
      projectId: "p1",
      type: "data",
      title: "x",
      source: "y",
      uncertainty: 1.5
    });
    const issues = validateEvidenceLink(ev);
    assert.ok(issues.some((i) => i.includes("uncertainty")));
  });

  it("accepts null uncertainty (not yet assessed)", () => {
    const ev = createEvidenceLink({
      id: "ev.null",
      projectId: "p1",
      type: "data",
      title: "x",
      source: "y",
      uncertainty: null
    });
    assert.deepEqual(validateEvidenceLink(ev), []);
  });
});

describe("createExperienceReceipt", () => {
  it("captures a faithful compression of a project phase", () => {
    const r = createExperienceReceipt({
      id: "receipt.test1",
      projectId: "p1",
      phase: "prototyping",
      summary: "Tried regex parser, failed on nested brackets.",
      evidenceLinkIds: ["ev1", "ev2"],
      outcome: "partial",
      uncertainty: 0.3,
      counterexamples: ["works for flat structures"],
      applicabilityBounds: ["only for flat bracket expressions"],
      lessonsLearned: ["need a proper parser, not regex"],
      autonomyMode: "draft"
    });
    assert.equal(r.kind, "ExperienceReceipt");
    assert.equal(r.outcome, "partial");
    assert.equal(r.uncertainty, 0.3);
    assert.deepEqual(r.lessonsLearned, ["need a proper parser, not regex"]);
    assert.deepEqual(r.evidenceLinkIds, ["ev1", "ev2"]);
  });

  it("passes validation", () => {
    const r = createExperienceReceipt({
      id: "receipt.test2",
      projectId: "p1",
      phase: "shipping",
      summary: "Shipped v1.",
      evidenceLinkIds: [],
      outcome: "success"
    });
    assert.deepEqual(validateExperienceReceipt(r), []);
  });

  it("rejects invalid outcome", () => {
    const r = createExperienceReceipt({
      id: "receipt.bad",
      projectId: "p1",
      phase: "x",
      summary: "y",
      evidenceLinkIds: [],
      outcome: "miracle"
    });
    assert.ok(validateExperienceReceipt(r).some((i) => i.includes("outcome")));
  });

  it("rejects missing evidenceLinkIds array", () => {
    const r = { id: "r", kind: "ExperienceReceipt", projectId: "p", phase: "x", summary: "y", outcome: "success" };
    assert.ok(validateExperienceReceipt(r).some((i) => i.includes("evidenceLinkIds")));
  });
});

describe("createDecisionReceipt", () => {
  it("records an autonomous decision with revert info", () => {
    const d = createDecisionReceipt({
      id: "decision.test1",
      projectId: "p1",
      action: "publish_skill",
      target: "skill.auth.v2",
      rationale: "Passed all tests and review.",
      evidenceLinkIds: ["ev1"],
      autonomyMode: "execute",
      humanReviewed: true,
      reviewedBy: "user.alice",
      revertible: true,
      revertInstructions: "run: unpublish skill.auth.v2"
    });
    assert.equal(d.kind, "DecisionReceipt");
    assert.equal(d.autonomyMode, "execute");
    assert.equal(d.humanReviewed, true);
    assert.equal(d.revertible, true);
    assert.ok(d.revertInstructions);
  });

  it("passes validation", () => {
    const d = createDecisionReceipt({
      id: "decision.test2",
      projectId: "p1",
      action: "draft",
      target: "doc.md",
      rationale: "Exploratory draft.",
      evidenceLinkIds: [],
      autonomyMode: "draft"
    });
    assert.deepEqual(validateDecisionReceipt(d), []);
  });

  it("rejects non-boolean humanReviewed", () => {
    const d = createDecisionReceipt({
      id: "decision.bad",
      projectId: "p1",
      action: "x",
      target: "y",
      rationale: "z",
      evidenceLinkIds: [],
      autonomyMode: "advise",
      humanReviewed: "yes"
    });
    assert.ok(validateDecisionReceipt(d).some((i) => i.includes("humanReviewed")));
  });
});

describe("createOutcomeRecord", () => {
  it("records the outcome of an action with metrics", () => {
    const o = createOutcomeRecord({
      id: "outcome.test1",
      projectId: "p1",
      decisionReceiptId: "decision.test1",
      action: "publish_skill",
      outcome: "success",
      metrics: { downloads: 12, rating: 4.5 },
      notes: "Adoption positive."
    });
    assert.equal(o.kind, "OutcomeRecord");
    assert.equal(o.outcome, "success");
    assert.equal(o.metrics.downloads, 12);
    assert.equal(o.decisionReceiptId, "decision.test1");
  });

  it("passes validation", () => {
    const o = createOutcomeRecord({
      id: "outcome.test2",
      projectId: "p1",
      action: "x",
      outcome: "failure",
      metrics: {}
    });
    assert.deepEqual(validateOutcomeRecord(o), []);
  });

  it("rejects non-object metrics", () => {
    const o = createOutcomeRecord({
      id: "outcome.bad",
      projectId: "p1",
      action: "x",
      outcome: "success",
      metrics: "not an object"
    });
    assert.ok(validateOutcomeRecord(o).some((i) => i.includes("metrics")));
  });
});

describe("validateRecord handles 3.0 kinds", () => {
  it("does not call EvidenceLink an unknown kind", () => {
    const ev = createEvidenceLink({ id: "x", projectId: "p", type: "doc", title: "t", source: "s" });
    const issues = validateRecord(ev);
    assert.ok(!issues.some((i) => i.includes("unknown record kind")));
  });

  it("does not call ExperienceReceipt an unknown kind", () => {
    const r = createExperienceReceipt({ id: "x", projectId: "p", phase: "f", summary: "s", evidenceLinkIds: [], outcome: "success" });
    const issues = validateRecord(r);
    assert.ok(!issues.some((i) => i.includes("unknown record kind")));
  });
});
