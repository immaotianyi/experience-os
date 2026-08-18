/**
 * Test suite for validate.js — all validators.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  validateProject,
  validateSkillForProduction,
  validateHumanEditLog,
  validateConversationEvent,
  validateHostObservationConsent,
  validateHostObservation,
  validateThoughtFragment,
  validateRule,
  validateSubgoalSegment,
  validateWorkflowPattern,
  validateArtifact,
  validateReflectionMemory,
  validateMotherSkillTrajectory,
  validatePreferenceHypothesis,
  validateWallHit,
  validateReviewPacket,
  validateReviewDecision,
  validateReuseContext,
  validateExperienceReuseTrial,
  validateSelfIterationRun,
  validateRecord,
  wallTypeForIssue
} from "../src/validate.js";

import { createSkillCandidate, createProject, createWallHit, createHostObservationConsent, createHostObservation } from "../src/domain.js";

describe("validateProject", () => {
  it("passes for valid project", () => {
    const p = createProject({ id: "p1", name: "N", goal: "G" });
    assert.equal(validateProject(p).length, 0);
  });

  it("fails for missing id", () => {
    assert.ok(validateProject({ name: "N", goal: "G" }).length > 0);
  });
});

describe("host observation validation", () => {
  const consent = createHostObservationConsent({
    id: "host_consent.p1.codex",
    projectId: "p1",
    host: "codex",
    approvedBy: "human"
  });
  const observation = createHostObservation({
    id: "host_observation.codex.1",
    projectId: "p1",
    host: "codex",
    eventName: "SessionStart",
    eventCategory: "session",
    sessionHash: `sha256:${"a".repeat(64)}`,
    consentId: consent.id
  });

  it("accepts explicit metadata-only consent and observation records", () => {
    assert.deepEqual(validateHostObservationConsent(consent), []);
    assert.deepEqual(validateHostObservation(observation), []);
    assert.deepEqual(validateRecord(consent), []);
    assert.deepEqual(validateRecord(observation), []);
  });

  it("rejects any raw collaboration field on an observation", () => {
    const issues = validateHostObservation({ ...observation, prompt: "do not persist me" });
    assert.ok(issues.includes("hostObservation.prompt is forbidden"));
  });

  it("rejects a persisted raw capture credential in the consent hash field", () => {
    const issues = validateHostObservationConsent({ ...consent, captureTokenHash: "host_capture.raw" });
    assert.ok(issues.includes("hostObservationConsent.captureTokenHash must be null or a SHA-256 digest"));
  });
});

describe("validateSkillForProduction", () => {
  it("passes for complete skill", () => {
    const s = createSkillCandidate({
      id: "s1", projectId: "p1", name: "N", origin: "o",
      trigger: { intent: "i", signals: ["sig"] },
      inputSchema: { type: "object" }, outputSchema: { type: "object" },
      safetyLevel: "L1", fallback: "f", humanConfirmationRequired: true
    });
    assert.equal(validateSkillForProduction(s).length, 0);
  });

  it("fails for missing trigger signals", () => {
    const s = createSkillCandidate({
      id: "s1", projectId: "p1", name: "N", origin: "o",
      trigger: { intent: "i", signals: [] },
      inputSchema: {}, outputSchema: {},
      safetyLevel: "L1", fallback: "f", humanConfirmationRequired: true
    });
    const issues = validateSkillForProduction(s);
    assert.ok(issues.some((i) => i.includes("signals")));
  });

  it("fails for invalid status", () => {
    const s = createSkillCandidate({
      id: "s1", projectId: "p1", name: "N", origin: "o",
      trigger: { intent: "i", signals: ["s"] },
      inputSchema: {}, outputSchema: {},
      safetyLevel: "L1", fallback: "f", humanConfirmationRequired: true
    });
    s.status = "bogus";
    const issues = validateSkillForProduction(s);
    assert.ok(issues.some((i) => i.includes("status")));
  });

  it("validates optional PortableSkill v2 fields without rejecting legacy records", () => {
    const s = createSkillCandidate({
      id: "s1", projectId: "p1", name: "N", origin: "o",
      trigger: { intent: "i", signals: ["sig"] },
      inputSchema: {}, outputSchema: {},
      safetyLevel: "L1", fallback: "f", humanConfirmationRequired: true,
      instructions: "Perform the verified workflow.",
      capabilities: { required: ["ide.files.read"], optional: [], denied: [] }
    });
    assert.equal(validateSkillForProduction(s).length, 0);

    const legacy = { ...s };
    for (const field of [
      "schemaVersion", "version", "instructions", "evidenceLinkIds", "appliesTo",
      "activation", "capabilities", "targetOverrides", "degradation",
      "executionBinding", "validationPlan", "compatibilityReceipts"
    ]) delete legacy[field];
    assert.equal(validateSkillForProduction(legacy).length, 0);

    const invalid = { ...s, version: "latest", appliesTo: { projects: [] } };
    const issues = validateSkillForProduction(invalid);
    assert.ok(issues.some((issue) => issue.includes("semantic version")));
    assert.ok(issues.some((issue) => issue.includes("appliesTo")));
  });
});

describe("validateWallHit", () => {
  it("passes for valid wallhit", () => {
    const w = createWallHit({
      id: "w1", projectId: "p1", wallType: "schema_missing",
      stage: "PRODUCTION_VALIDATING", message: "m",
      blockedBy: ["b"], suggestedFixes: ["f"]
    });
    assert.equal(validateWallHit(w).length, 0);
  });

  it("fails for missing wallType", () => {
    assert.ok(validateWallHit({ id: "w1", projectId: "p1", stage: "s", message: "m", blockedBy: [], suggestedFixes: [] }).length > 0);
  });
});

describe("validateExperienceReuseTrial", () => {
  it("requires a bounded adopted trial and a valid outcome when completed", () => {
    const trial = {
      id: "reuse_trial.1", kind: "ExperienceReuseTrial", projectId: "target", assetId: "asset.1", sourceProjectId: "source",
      taskTitle: "Use prior lesson", decision: "adopted", decisionNote: "", outcome: "success", outcomeNote: "worked",
      reducedRepeatedDecision: true, completedAt: new Date().toISOString()
    };
    assert.equal(validateExperienceReuseTrial(trial).length, 0);
    assert.ok(validateExperienceReuseTrial({ ...trial, outcome: "unknown" }).some((issue) => issue.includes("outcome")));
  });
});

describe("validateReviewPacket", () => {
  it("passes with valid defaultOption", () => {
    const issues = validateReviewPacket({
      id: "rp1", projectId: "p1", targetKind: "Skill", targetId: "s1",
      title: "T", recommendation: "r", why: "w",
      evidence: [], risks: [], options: [{ id: "a", label: "A" }],
      defaultOption: "a", status: "pending"
    });
    assert.equal(issues.length, 0);
  });

  it("fails when defaultOption not in options", () => {
    const issues = validateReviewPacket({
      id: "rp1", projectId: "p1", targetKind: "Skill", targetId: "s1",
      title: "T", recommendation: "r", why: "w",
      evidence: [], risks: [], options: [{ id: "a", label: "A" }],
      defaultOption: "b", status: "pending"
    });
    assert.ok(issues.some((i) => i.includes("defaultOption")));
  });
});

describe("validateRecord dispatch", () => {
  it("dispatches to correct validator by kind", () => {
    const p = createProject({ id: "p1", name: "N", goal: "G" });
    assert.equal(validateRecord(p).length, 0);
  });

  it("returns error for non-object", () => {
    assert.ok(validateRecord(null).length > 0);
  });

  it("returns error for missing kind", () => {
    assert.ok(validateRecord({ id: "x" }).length > 0);
  });

  it("returns error for unknown kind", () => {
    const issues = validateRecord({ kind: "Unknown", id: "x" });
    assert.ok(issues.length > 0, "unknown kind should produce an error");
    assert.ok(issues[0].includes("unknown record kind"), `error message should mention unknown kind, got: ${issues[0]}`);
  });
});

describe("wallTypeForIssue", () => {
  it("maps schema issues to schema_missing", () => {
    assert.equal(wallTypeForIssue("skill.inputSchema is required"), "schema_missing");
  });

  it("maps trigger issues to trigger_unstable", () => {
    assert.equal(wallTypeForIssue("skill.trigger is required"), "trigger_unstable");
  });

  it("maps fallback issues to fallback_missing", () => {
    assert.equal(wallTypeForIssue("skill.fallback is required"), "fallback_missing");
  });
});

describe("validatePreferenceHypothesis", () => {
  it("fails for confidence out of range", () => {
    const issues = validatePreferenceHypothesis({
      id: "ph1", projectId: "p1", statement: "S",
      evidenceIds: [], confidence: 1.5, status: "hypothesis"
    });
    assert.ok(issues.some((i) => i.includes("confidence")));
  });
});

describe("validateSelfIterationRun", () => {
  it("fails for iteration < 1", () => {
    const issues = validateSelfIterationRun({
      id: "si1", projectId: "p1", sourceRecordIds: [],
      candidateSkillIds: [], acceptedSkillIds: [], wallHitIds: [],
      artifactIds: [], iteration: 0, summary: "s"
    });
    assert.ok(issues.some((i) => i.includes("iteration")));
  });
});
