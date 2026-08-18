/**
 * Test suite for domain.js — all 17 record factory functions.
 * Uses Node.js built-in test runner (node:test).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  STATES,
  WALL_TYPES,
  SKILL_LEVELS,
  SKILL_STATUSES,
  PREFERENCE_STATUSES,
  REVIEW_PACKET_STATUSES,
  nowIso,
  createProject,
  createConversationEvent,
  createHostObservationConsent,
  createHostObservation,
  createThoughtFragment,
  createRule,
  createSkillCandidate,
  createWallHit,
  createArtifact,
  createHumanEditLog,
  createSubgoalSegment,
  createWorkflowPattern,
  createPreferenceHypothesis,
  createReflectionMemory,
  createMotherSkillTrajectory,
  createReuseContext,
  createSelfIterationRun,
  createReviewPacket,
  createReviewDecision
} from "../src/domain.js";

describe("domain constants", () => {
  it("STATES has 11 states", () => {
    assert.equal(Object.keys(STATES).length, 11);
  });

  it("WALL_TYPES has 6 types", () => {
    assert.equal(Object.keys(WALL_TYPES).length, 6);
  });

  it("SKILL_STATUSES has 6 statuses", () => {
    assert.equal(SKILL_STATUSES.length, 6);
    assert.ok(SKILL_STATUSES.includes("candidate"));
    assert.ok(SKILL_STATUSES.includes("stable"));
    assert.ok(SKILL_STATUSES.includes("rejected"));
  });

  it("PREFERENCE_STATUSES has 4 statuses", () => {
    assert.equal(PREFERENCE_STATUSES.length, 4);
  });

  it("REVIEW_PACKET_STATUSES has 2 statuses", () => {
    assert.equal(REVIEW_PACKET_STATUSES.length, 2);
  });
});

describe("createProject", () => {
  it("creates a valid project with defaults", () => {
    const p = createProject({ id: "p1", name: "Test", goal: "Test goal" });
    assert.equal(p.kind, "Project");
    assert.equal(p.id, "p1");
    assert.equal(p.name, "Test");
    assert.equal(p.goal, "Test goal");
    assert.deepEqual(p.constraints, []);
    assert.deepEqual(p.acceptanceCriteria, []);
    assert.equal(p.state, STATES.IDLE);
    assert.ok(p.createdAt);
    assert.ok(p.updatedAt);
  });

  it("accepts constraints and acceptance criteria", () => {
    const p = createProject({
      id: "p2",
      name: "Test",
      goal: "G",
      constraints: ["c1"],
      acceptanceCriteria: ["a1"]
    });
    assert.deepEqual(p.constraints, ["c1"]);
    assert.deepEqual(p.acceptanceCriteria, ["a1"]);
  });
});

describe("createConversationEvent", () => {
  it("creates event with required fields", () => {
    const e = createConversationEvent({ id: "e1", projectId: "p1", actor: "user", content: "hello" });
    assert.equal(e.kind, "ConversationEvent");
    assert.equal(e.actor, "user");
    assert.equal(e.content, "hello");
  });
});

describe("host observation records", () => {
  it("keeps metadata consent separate from collaboration content consent", () => {
    const consent = createHostObservationConsent({
      id: "host_consent.p1.codex",
      projectId: "p1",
      host: "codex",
      approvedBy: "human"
    });
    assert.equal(consent.scope, "metadata_only");
    assert.equal(consent.status, "active");
    assert.equal(consent.captureTokenHash, null);
  });

  it("creates metadata-only proof without content fields", () => {
    const observation = createHostObservation({
      id: "host_observation.codex.1",
      projectId: "p1",
      host: "codex",
      eventName: "SessionStart",
      eventCategory: "session",
      sessionHash: `sha256:${"a".repeat(64)}`,
      consentId: "host_consent.p1.codex"
    });
    assert.equal(observation.captureMode, "metadata_only");
    assert.equal("content" in observation, false);
    assert.equal("transcriptPath" in observation, false);
  });
});

describe("createThoughtFragment", () => {
  it("creates thought with themes and evidence", () => {
    const t = createThoughtFragment({
      id: "t1",
      projectId: "p1",
      sourceEventId: "e1",
      summary: "test",
      themes: ["skill_growth"],
      evidence: "raw text"
    });
    assert.equal(t.kind, "ThoughtFragment");
    assert.deepEqual(t.themes, ["skill_growth"]);
  });
});

describe("createSkillCandidate", () => {
  it("creates candidate with default status", () => {
    const s = createSkillCandidate({
      id: "s1",
      projectId: "p1",
      name: "Test Skill",
      origin: "test",
      trigger: { intent: "test", signals: ["s"] },
      inputSchema: { type: "object" },
      outputSchema: { type: "object" },
      safetyLevel: "L1",
      fallback: "none",
      humanConfirmationRequired: true
    });
    assert.equal(s.kind, "Skill");
    assert.equal(s.status, "candidate");
    assert.equal(s.skillLevel, SKILL_LEVELS.FUNCTIONAL);
    assert.equal(s.promotionGate, null);
    assert.equal(s.lastReviewDecisionId, null);
    assert.equal(s.schemaVersion, "experience-os.dev/portable-skill/v2");
    assert.equal(s.version, "0.1.0");
    assert.equal(s.instructions, null);
    assert.deepEqual(s.appliesTo, { projects: ["p1"] });
    assert.deepEqual(s.activation.intents, ["test"]);
    assert.deepEqual(s.capabilities.required, []);
    assert.equal(s.degradation.mode, "report_wallhit");
    assert.equal(s.executionBinding, null);
  });

  it("accepts custom skillLevel", () => {
    const s = createSkillCandidate({
      id: "s2",
      projectId: "p1",
      name: "Strategic",
      origin: "test",
      trigger: { intent: "test", signals: ["s"] },
      inputSchema: {},
      outputSchema: {},
      safetyLevel: "L1",
      fallback: "none",
      humanConfirmationRequired: true,
      skillLevel: SKILL_LEVELS.STRATEGIC
    });
    assert.equal(s.skillLevel, "strategic");
  });
});

describe("createWallHit", () => {
  it("creates wallhit with default open status", () => {
    const w = createWallHit({
      id: "w1",
      projectId: "p1",
      wallType: WALL_TYPES.SCHEMA_MISSING,
      stage: STATES.PRODUCTION_VALIDATING,
      message: "fail",
      blockedBy: ["issue1"],
      suggestedFixes: ["fix1"]
    });
    assert.equal(w.kind, "WallHit");
    assert.equal(w.status, "open");
    assert.equal(w.humanDecisionNeeded, true);
    assert.deepEqual(w.resolvedByIds, []);
    assert.equal(w.resolvedAt, null);
  });
});

describe("createArtifact", () => {
  it("creates artifact with sourceIds default", () => {
    const a = createArtifact({
      id: "a1",
      projectId: "p1",
      title: "T",
      artifactType: "skill_spec",
      content: "{}"
    });
    assert.equal(a.kind, "Artifact");
    assert.deepEqual(a.sourceIds, []);
  });
});

describe("createHumanEditLog", () => {
  it("creates edit log with captured signals", () => {
    const log = createHumanEditLog({
      id: "h1",
      projectId: "p1",
      sourceEventId: "e1",
      before: "a",
      after: "b",
      editType: "structural",
      rationale: "because",
      capturedSignals: ["sig1"]
    });
    assert.equal(log.kind, "HumanEditLog");
    assert.deepEqual(log.capturedSignals, ["sig1"]);
  });
});

describe("createSubgoalSegment", () => {
  it("creates subgoal with inputs/outputs", () => {
    const sg = createSubgoalSegment({
      id: "sg1",
      projectId: "p1",
      sourceEditLogIds: ["h1"],
      title: "T",
      intent: "test",
      inputs: ["in"],
      outputs: ["out"]
    });
    assert.equal(sg.kind, "SubgoalSegment");
    assert.deepEqual(sg.inputs, ["in"]);
  });
});

describe("createWorkflowPattern", () => {
  it("creates workflow with defaults", () => {
    const wf = createWorkflowPattern({
      id: "wf1",
      projectId: "p1",
      sourceSubgoalIds: ["sg1"],
      name: "N",
      pattern: "P"
    });
    assert.equal(wf.kind, "WorkflowPattern");
    assert.deepEqual(wf.recurrenceEvidence, []);
    assert.deepEqual(wf.candidateSkillIds, []);
  });
});

describe("createPreferenceHypothesis", () => {
  it("creates hypothesis with default status", () => {
    const ph = createPreferenceHypothesis({
      id: "ph1",
      projectId: "p1",
      statement: "S",
      evidenceIds: ["e1"],
      confidence: 0.8
    });
    assert.equal(ph.kind, "PreferenceHypothesis");
    assert.equal(ph.status, "hypothesis");
    assert.equal(ph.confidence, 0.8);
  });
});

describe("createReflectionMemory", () => {
  it("creates reflection with replay pointers", () => {
    const rm = createReflectionMemory({
      id: "rm1",
      projectId: "p1",
      sourceWallHitId: "w1",
      lesson: "learned",
      avoidNextTime: ["dont do x"],
      replayPointers: ["w1"]
    });
    assert.equal(rm.kind, "ReflectionMemory");
    assert.deepEqual(rm.replayPointers, ["w1"]);
  });
});

describe("createMotherSkillTrajectory", () => {
  it("creates trajectory with defaults", () => {
    const tr = createMotherSkillTrajectory({
      id: "tr1",
      projectId: "p1",
      motherSkillId: "ms1",
      route: ["step1"],
      inputs: { a: "b" },
      outputs: { c: "d" }
    });
    assert.equal(tr.kind, "MotherSkillTrajectory");
    assert.deepEqual(tr.wallHitIds, []);
    assert.equal(tr.fallbackUsed, false);
  });
});

describe("createReuseContext", () => {
  it("creates reuse context with defaults", () => {
    const rc = createReuseContext({
      id: "rc1",
      projectId: "p1",
      query: "test",
      summary: "s"
    });
    assert.equal(rc.kind, "ReuseContext");
    assert.deepEqual(rc.matchedRecordIds, []);
    assert.deepEqual(rc.contributionCandidates, []);
  });
});

describe("createSelfIterationRun", () => {
  it("creates run with iteration default 1", () => {
    const run = createSelfIterationRun({
      id: "si1",
      projectId: "p1",
      summary: "s"
    });
    assert.equal(run.kind, "SelfIterationRun");
    assert.equal(run.iteration, 1);
    assert.deepEqual(run.rejectedSkillIds, []);
  });
});

describe("createReviewPacket", () => {
  it("creates packet with pending status", () => {
    const rp = createReviewPacket({
      id: "rp1",
      projectId: "p1",
      targetKind: "Skill",
      targetId: "s1",
      title: "T",
      recommendation: "r",
      why: "w",
      options: [{ id: "approve", label: "Approve" }],
      defaultOption: "approve"
    });
    assert.equal(rp.kind, "ReviewPacket");
    assert.equal(rp.status, "pending");
  });
});

describe("createReviewDecision", () => {
  it("creates decision", () => {
    const rd = createReviewDecision({
      id: "rd1",
      projectId: "p1",
      reviewPacketId: "rp1",
      targetKind: "Skill",
      targetId: "s1",
      decision: "approve",
      rationale: "looks good",
      resultingStatus: "candidate_confirmed"
    });
    assert.equal(rd.kind, "ReviewDecision");
    assert.equal(rd.decision, "approve");
  });
});

describe("nowIso", () => {
  it("returns a valid ISO string", () => {
    const ts = nowIso();
    assert.ok(!isNaN(new Date(ts).getTime()));
  });
});
