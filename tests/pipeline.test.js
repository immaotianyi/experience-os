/**
 * Test suite for pipeline.js — extractThoughtFragment, validateCandidateIntoArtifact, etc.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  extractThoughtFragment,
  captureHumanEditLog,
  segmentSubgoal,
  deriveRule,
  deriveSkillCandidate,
  deriveWorkflowPattern,
  derivePreferenceHypothesis,
  validateCandidateIntoArtifact,
  reflectFromWallHit,
  recordMotherSkillTrajectory
} from "../src/pipeline.js";

import { createProject, createConversationEvent, STATES } from "../src/domain.js";

const baseProject = createProject({ id: "project.test_pipeline", name: "T", goal: "G" });
const baseEvent = createConversationEvent({
  id: "event.test.1", projectId: baseProject.id, actor: "user",
  content: "非线性思想需要被转为线性工程对象，包括 Skill 和 Schema"
});

describe("extractThoughtFragment", () => {
  it("extracts themes from content", () => {
    const t = extractThoughtFragment({ project: baseProject, event: baseEvent });
    assert.equal(t.kind, "ThoughtFragment");
    assert.ok(t.themes.includes("skill_growth"));
    assert.ok(t.themes.includes("nonlinear_to_linear"));
    assert.ok(t.themes.includes("production_validation"));
  });
});

describe("captureHumanEditLog", () => {
  it("captures structural refinement", () => {
    const log = captureHumanEditLog({ project: baseProject, event: baseEvent });
    assert.equal(log.kind, "HumanEditLog");
    assert.equal(log.editType, "structural_refinement");
    assert.ok(log.capturedSignals.length > 0);
  });
});

describe("segmentSubgoal", () => {
  it("creates subgoal with inputs and outputs", () => {
    const log = captureHumanEditLog({ project: baseProject, event: baseEvent });
    const sg = segmentSubgoal({ project: baseProject, editLog: log });
    assert.equal(sg.kind, "SubgoalSegment");
    assert.ok(sg.inputs.length > 0);
    assert.ok(sg.outputs.length > 0);
  });
});

describe("deriveRule", () => {
  it("creates rule from thought", () => {
    const t = extractThoughtFragment({ project: baseProject, event: baseEvent });
    const r = deriveRule({ project: baseProject, thought: t });
    assert.equal(r.kind, "Rule");
    assert.ok(r.sourceThoughtIds.includes(t.id));
  });
});

describe("deriveSkillCandidate", () => {
  it("creates incomplete skill without signals", () => {
    const s = deriveSkillCandidate({ project: baseProject, complete: false });
    assert.equal(s.status, "candidate");
    assert.equal(s.trigger.signals.length, 0);
  });

  it("creates complete skill with signals and schemas", () => {
    const s = deriveSkillCandidate({ project: baseProject, complete: true });
    assert.ok(s.trigger.signals.length > 0);
    assert.ok(s.inputSchema);
    assert.ok(s.outputSchema);
    assert.ok(s.fallback);
  });
});

describe("validateCandidateIntoArtifact", () => {
  it("produces wallhit for incomplete skill", () => {
    const s = deriveSkillCandidate({ project: baseProject, complete: false });
    const result = validateCandidateIntoArtifact({ project: baseProject, skill: s });
    assert.equal(result.ok, false);
    assert.ok(result.wallHit);
    assert.equal(result.wallHit.kind, "WallHit");
  });

  it("produces artifact for complete skill", () => {
    const s = deriveSkillCandidate({ project: baseProject, complete: true });
    const result = validateCandidateIntoArtifact({ project: baseProject, skill: s });
    assert.equal(result.ok, true);
    assert.ok(result.artifact);
    assert.equal(result.artifact.kind, "Artifact");
  });
});

describe("reflectFromWallHit", () => {
  it("creates reflection memory from wallhit", () => {
    const s = deriveSkillCandidate({ project: baseProject, complete: false });
    const validation = validateCandidateIntoArtifact({ project: baseProject, skill: s });
    const reflection = reflectFromWallHit({ project: baseProject, wallHit: validation.wallHit });
    assert.equal(reflection.kind, "ReflectionMemory");
    assert.ok(reflection.avoidNextTime.length > 0);
    assert.ok(reflection.replayPointers.includes(validation.wallHit.id));
  });
});

describe("deriveWorkflowPattern", () => {
  it("creates pattern linking subgoal to skill", () => {
    const log = captureHumanEditLog({ project: baseProject, event: baseEvent });
    const sg = segmentSubgoal({ project: baseProject, editLog: log });
    const s = deriveSkillCandidate({ project: baseProject, complete: true });
    const wf = deriveWorkflowPattern({ project: baseProject, subgoal: sg, skill: s });
    assert.equal(wf.kind, "WorkflowPattern");
    assert.ok(wf.candidateSkillIds.includes(s.id));
  });
});

describe("derivePreferenceHypothesis", () => {
  it("creates hypothesis with confidence", () => {
    const log = captureHumanEditLog({ project: baseProject, event: baseEvent });
    const ph = derivePreferenceHypothesis({ project: baseProject, editLog: log });
    assert.equal(ph.kind, "PreferenceHypothesis");
    assert.ok(ph.confidence > 0 && ph.confidence <= 1);
  });
});

describe("recordMotherSkillTrajectory", () => {
  it("records trajectory for success path", () => {
    const t = extractThoughtFragment({ project: baseProject, event: baseEvent });
    const log = captureHumanEditLog({ project: baseProject, event: baseEvent });
    const sg = segmentSubgoal({ project: baseProject, editLog: log });
    const r = deriveRule({ project: baseProject, thought: t });
    const s = deriveSkillCandidate({ project: baseProject, complete: true });
    const wf = deriveWorkflowPattern({ project: baseProject, subgoal: sg, skill: s });
    const validation = validateCandidateIntoArtifact({ project: baseProject, skill: s });
    const tr = recordMotherSkillTrajectory({
      project: baseProject, skill: s, event: baseEvent, thought: t,
      rule: r, editLog: log, subgoal: sg, workflow: wf, validation
    });
    assert.equal(tr.kind, "MotherSkillTrajectory");
    assert.equal(tr.fallbackUsed, false);
    assert.deepEqual(tr.wallHitIds, []);
  });

  it("records trajectory for failure path", () => {
    const t = extractThoughtFragment({ project: baseProject, event: baseEvent });
    const log = captureHumanEditLog({ project: baseProject, event: baseEvent });
    const sg = segmentSubgoal({ project: baseProject, editLog: log });
    const r = deriveRule({ project: baseProject, thought: t });
    const s = deriveSkillCandidate({ project: baseProject, complete: false });
    const wf = deriveWorkflowPattern({ project: baseProject, subgoal: sg, skill: s });
    const validation = validateCandidateIntoArtifact({ project: baseProject, skill: s });
    const tr = recordMotherSkillTrajectory({
      project: baseProject, skill: s, event: baseEvent, thought: t,
      rule: r, editLog: log, subgoal: sg, workflow: wf, validation
    });
    assert.equal(tr.fallbackUsed, true);
    assert.ok(tr.wallHitIds.length > 0);
  });
});
