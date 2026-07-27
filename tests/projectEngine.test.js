/**
 * Tests for 3.0 Project Engine — the real main loop.
 *
 * Verifies the full closed loop:
 *   project start → add evidence → write experience receipt
 *   → record decision → record outcome → build timeline
 *
 * Also verifies input validation, error handling, and that the
 * faithful-compression fields (uncertainty, counterexamples,
 * applicability bounds) survive the full round-trip.
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { GitVault } from "../src/gitVault.js";
import { MockLLMAdapter } from "../src/llmAdapter.js";
import {
  startProject,
  updateProject,
  getProject,
  addEvidenceLink,
  listEvidenceForProject,
  writeExperienceReceipt,
  listReceiptsForProject,
  recordDecision,
  recordOutcome,
  buildProjectTimeline,
  captureCollaborationEvent,
  captureWorkCheckpoint,
  proposeExperienceReceiptDraft,
  submitAgentExperienceReceiptDraft,
  acceptExperienceReceiptDraft,
  rejectExperienceReceiptDraft,
  deferExperienceReceiptDraft,
  resumeExperienceReceiptDraft,
  promoteExperienceAsset,
  getProjectReadiness,
  getProjectTrialEvidence,
  startExperienceReuseTrial,
  completeExperienceReuseTrial,
  listExperienceReuseTrials
} from "../src/projectEngine.js";

let tmpDir;
let vault;

beforeEach(async () => {
  tmpDir = await mkdtemp(path.join(tmpdir(), "eos-proj-"));
  vault = new GitVault(tmpDir);
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe("startProject", () => {
  it("creates a project with 3.0 defaults", async () => {
    const p = await startProject(vault, {
      id: "project.test1",
      name: "Test Project",
      goal: "Verify the 3.0 main loop"
    });
    assert.equal(p.kind, "Project");
    assert.equal(p.status, "planning");
    assert.equal(p.autonomyMode, "advise"); // human decides by default
    assert.deepEqual(p.tags, []);
    assert.deepEqual(p.evidenceLinkIds, []);
  });

  it("persists the project to the vault", async () => {
    await startProject(vault, {
      id: "project.persist",
      name: "Persist Test",
      goal: "g"
    });
    const loaded = await getProject(vault, "project.persist");
    assert.equal(loaded.name, "Persist Test");
  });

  it("rejects empty name", async () => {
    await assert.rejects(
      () => startProject(vault, { id: "p", name: "", goal: "g" }),
      /name is required/
    );
  });

  it("rejects invalid autonomyMode", async () => {
    await assert.rejects(
      () => startProject(vault, { id: "p", name: "x", goal: "g", autonomyMode: "teleport" }),
      /autonomyMode/
    );
  });
});

describe("updateProject", () => {
  it("updates status and autonomyMode", async () => {
    await startProject(vault, { id: "project.upd", name: "x", goal: "g" });
    const updated = await updateProject(vault, "project.upd", {
      status: "active",
      autonomyMode: "draft"
    });
    assert.equal(updated.status, "active");
    assert.equal(updated.autonomyMode, "draft");
  });

  it("rejects unknown status", async () => {
    await startProject(vault, { id: "project.bad", name: "x", goal: "g" });
    await assert.rejects(
      () => updateProject(vault, "project.bad", { status: "teleported" }),
      /status/
    );
  });

  it("throws for non-existent project", async () => {
    await assert.rejects(
      () => updateProject(vault, "project.nope", { status: "active" }),
      /not found/
    );
  });

  it("rejects immutable and unknown fields", async () => {
    await startProject(vault, { id: "project.locked", name: "x", goal: "g" });
    await assert.rejects(
      () => updateProject(vault, "project.locked", { kind: "Skill" }),
      /cannot be updated/
    );
  });
});

describe("addEvidenceLink", () => {
  it("creates an evidence link with faithful compression fields", async () => {
    await startProject(vault, { id: "project.ev", name: "x", goal: "g" });
    const link = await addEvidenceLink(vault, {
      id: "evidence.test1",
      projectId: "project.ev",
      type: "code",
      title: "auth diff",
      source: "git://repo@abc",
      hash: "sha256:123",
      uncertainty: 0.15,
      counterexamples: ["fails on mobile"],
      applicabilityBounds: ["web only"]
    });
    assert.equal(link.kind, "EvidenceLink");
    assert.equal(link.uncertainty, 0.15);
    assert.deepEqual(link.counterexamples, ["fails on mobile"]);
  });

  it("links evidence back to the project", async () => {
    await startProject(vault, { id: "project.link", name: "x", goal: "g" });
    await addEvidenceLink(vault, {
      id: "evidence.l1",
      projectId: "project.link",
      type: "doc",
      title: "spec",
      source: "docs/spec.md"
    });
    const project = await getProject(vault, "project.link");
    assert.deepEqual(project.evidenceLinkIds, ["evidence.l1"]);
  });

  it("throws for non-existent project", async () => {
    await assert.rejects(
      () => addEvidenceLink(vault, {
        id: "e", projectId: "nope", type: "doc", title: "t", source: "s"
      }),
      /not found/
    );
  });
});

describe("writeExperienceReceipt", () => {
  it("captures a faithful compression of a phase", async () => {
    await startProject(vault, { id: "project.rec", name: "x", goal: "g" });
    const receipt = await writeExperienceReceipt(vault, {
      id: "receipt.test1",
      projectId: "project.rec",
      phase: "prototyping",
      summary: "Tried regex parser, failed on nested brackets.",
      evidenceLinkIds: [],
      outcome: "partial",
      uncertainty: 0.3,
      counterexamples: ["works for flat structures"],
      applicabilityBounds: ["only flat bracket expressions"],
      lessonsLearned: ["need a real parser"]
    });
    assert.equal(receipt.outcome, "partial");
    assert.equal(receipt.uncertainty, 0.3);
    assert.deepEqual(receipt.lessonsLearned, ["need a real parser"]);
  });

  it("links receipt back to the project", async () => {
    await startProject(vault, { id: "project.rl", name: "x", goal: "g" });
    await writeExperienceReceipt(vault, {
      id: "receipt.l1",
      projectId: "project.rl",
      phase: "x",
      summary: "s",
      evidenceLinkIds: [],
      outcome: "success"
    });
    const project = await getProject(vault, "project.rl");
    assert.deepEqual(project.experienceReceiptIds, ["receipt.l1"]);
  });
});

describe("provenance and autonomy guardrails", () => {
  it("rejects a receipt that cites missing or cross-project evidence", async () => {
    await startProject(vault, { id: "project.a", name: "a", goal: "g" });
    await startProject(vault, { id: "project.b", name: "b", goal: "g" });
    await addEvidenceLink(vault, { id: "ev.b", projectId: "project.b", type: "doc", title: "b", source: "b.md" });
    await assert.rejects(
      () => writeExperienceReceipt(vault, {
        id: "receipt.bad", projectId: "project.a", phase: "test", summary: "s",
        evidenceLinkIds: ["ev.b"], outcome: "partial"
      }),
      /belongs to another project/
    );
  });

  it("allows human capture at advise but refuses an AI vault write", async () => {
    await startProject(vault, { id: "project.policy", name: "x", goal: "g", autonomyMode: "advise" });
    await addEvidenceLink(vault, { id: "ev.human", projectId: "project.policy", type: "observation", title: "human note", source: "manual" });
    await assert.rejects(
      () => addEvidenceLink(vault, {
        id: "ev.ai", projectId: "project.policy", type: "observation", title: "ai note", source: "relay", origin: "ai"
      }),
      /requires autonomy >= execute/
    );
  });

  it("requires explicit consent for Relay capture", async () => {
    await startProject(vault, { id: "project.relay", name: "x", goal: "g" });
    await assert.rejects(
      () => captureCollaborationEvent(vault, {
        id: "event.no", projectId: "project.relay", actor: "human", content: "secret", sourceTool: "codex"
      }),
      /explicit consent/
    );
    const event = await captureCollaborationEvent(vault, {
      id: "event.yes", projectId: "project.relay", actor: "human", content: "keep this", sourceTool: "codex", consented: true
    });
    assert.equal(event.sourceTool, "codex");
  });

  it("promotes only an evidence-backed, reviewed, successful experience", async () => {
    await startProject(vault, { id: "project.promote", name: "x", goal: "g" });
    await addEvidenceLink(vault, { id: "ev.promote", projectId: "project.promote", type: "test", title: "passing test", source: "test-output" });
    await writeExperienceReceipt(vault, {
      id: "receipt.promote", projectId: "project.promote", phase: "validation", summary: "worked",
      evidenceLinkIds: ["ev.promote"], outcome: "success"
    });
    await recordDecision(vault, {
      id: "decision.promote", projectId: "project.promote", action: "publish_skill", target: "draft", rationale: "reviewed",
      receiptId: "receipt.promote", evidenceLinkIds: ["ev.promote"], autonomyMode: "execute", humanReviewed: true, reviewedBy: "human"
    });
    await recordOutcome(vault, {
      id: "outcome.promote", projectId: "project.promote", decisionReceiptId: "decision.promote", action: "publish_skill",
      outcome: "success", evidenceLinkIds: ["ev.promote"]
    });
    const asset = await promoteExperienceAsset(vault, {
      id: "asset.promote", projectId: "project.promote", receiptId: "receipt.promote", decisionReceiptId: "decision.promote",
      outcomeRecordId: "outcome.promote", title: "Validated publish flow", approvedBy: "human"
    });
    assert.equal(asset.status, "approved");
    const readiness = await getProjectReadiness(vault, "project.promote");
    assert.equal(readiness.receipts[0].eligible, true);
  });

  it("does not let a successful decision for one receipt make another receipt eligible", async () => {
    await startProject(vault, { id: "project.receipt-link", name: "x", goal: "g" });
    await addEvidenceLink(vault, { id: "ev.receipt-link", projectId: "project.receipt-link", type: "test", title: "test", source: "test-output" });
    await writeExperienceReceipt(vault, { id: "receipt.a", projectId: "project.receipt-link", phase: "a", summary: "a", evidenceLinkIds: ["ev.receipt-link"], outcome: "partial" });
    await writeExperienceReceipt(vault, { id: "receipt.b", projectId: "project.receipt-link", phase: "b", summary: "b", evidenceLinkIds: ["ev.receipt-link"], outcome: "partial" });
    await recordDecision(vault, {
      id: "decision.a", projectId: "project.receipt-link", action: "validate", target: "receipt.a", receiptId: "receipt.a",
      rationale: "reviewed A", evidenceLinkIds: ["ev.receipt-link"], autonomyMode: "execute", humanReviewed: true
    });
    await recordOutcome(vault, { id: "outcome.a", projectId: "project.receipt-link", decisionReceiptId: "decision.a", action: "validate", outcome: "success", evidenceLinkIds: ["ev.receipt-link"] });
    const readiness = await getProjectReadiness(vault, "project.receipt-link");
    assert.equal(readiness.receipts.find((entry) => entry.receiptId === "receipt.a").eligible, true);
    assert.equal(readiness.receipts.find((entry) => entry.receiptId === "receipt.b").eligible, false);
  });
});

describe("Experience reuse trials", () => {
  it("links an adopted cross-project asset to an observed task result", async () => {
    await startProject(vault, { id: "project.source", name: "Source", goal: "g" });
    await startProject(vault, { id: "project.target", name: "Target", goal: "g" });
    await vault.save({
      id: "asset.approved", kind: "ExperienceAsset", projectId: "project.source", receiptId: "receipt.source",
      decisionReceiptId: "decision.source", outcomeRecordId: "outcome.source", title: "Verified source experience",
      status: "approved", approvedBy: "human", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });

    const trial = await startExperienceReuseTrial(vault, {
      id: "reuse_trial.target", projectId: "project.target", assetId: "asset.approved", taskTitle: "Set up a second project safely"
    });
    assert.equal(trial.outcome, null);
    const completed = await completeExperienceReuseTrial(vault, {
      id: trial.id, projectId: "project.target", outcome: "success", reducedRepeatedDecision: true,
      outcomeNote: "The existing boundary rule avoided repeating the setup decision."
    });
    assert.equal(completed.reducedRepeatedDecision, true);
    assert.equal((await listExperienceReuseTrials(vault, "project.target")).length, 1);
    assert.equal((await getProjectTrialEvidence(vault, "project.target")).interpretation.isSufficientForValueClaim, true);
    await assert.rejects(
      () => completeExperienceReuseTrial(vault, { id: trial.id, projectId: "project.target", outcome: "success", reducedRepeatedDecision: true }),
      /already completed/
    );
  });

  it("refuses same-project or unapproved experiences", async () => {
    await startProject(vault, { id: "project.only", name: "Only", goal: "g" });
    await vault.save({ id: "asset.same", kind: "ExperienceAsset", projectId: "project.only", receiptId: "r", decisionReceiptId: "d", outcomeRecordId: "o", title: "same", status: "approved", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    await assert.rejects(
      () => startExperienceReuseTrial(vault, { id: "reuse_trial.same", projectId: "project.only", assetId: "asset.same", taskTitle: "repeat" }),
      /another project/
    );
  });
});

describe("captureWorkCheckpoint", () => {
  it("requires explicit consent before saving any grouped work record", async () => {
    await startProject(vault, { id: "project.checkpoint.no", name: "x", goal: "g" });
    await assert.rejects(
      () => captureWorkCheckpoint(vault, {
        id: "checkpoint.no", eventId: "event.no", evidenceId: "evidence.no",
        projectId: "project.checkpoint.no", title: "Private work", content: "do not save", sourceTool: "codex"
      }),
      /explicit consent/
    );
    assert.equal(await vault.load("WorkCheckpoint", "checkpoint.no"), null);
  });

  it("creates a replayable event, evidence link, and readable work boundary", async () => {
    await startProject(vault, { id: "project.checkpoint.yes", name: "x", goal: "g" });
    const captured = await captureWorkCheckpoint(vault, {
      id: "checkpoint.yes", eventId: "event.yes", evidenceId: "evidence.yes",
      projectId: "project.checkpoint.yes", title: "Diagnosed the failing test",
      content: "The test passed after the schema was corrected.", sourceTool: "codex",
      notes: "Keep the test as the verification boundary.", consented: true,
      capturePermitId: "capture_permit.test_provenance"
    });
    assert.equal(captured.checkpoint.status, "captured");
    assert.equal(captured.event.consented, true);
    assert.equal(captured.evidence.type, "observation");
    assert.equal(captured.event.capturePermitId, "capture_permit.test_provenance");
    assert.equal(captured.evidence.capturePermitId, "capture_permit.test_provenance");
    assert.equal(captured.checkpoint.capturePermitId, "capture_permit.test_provenance");
    assert.equal((await getProject(vault, "project.checkpoint.yes")).evidenceLinkIds[0], "evidence.yes");
    const timeline = await buildProjectTimeline(vault, "project.checkpoint.yes");
    assert.equal(timeline.counts.checkpoints, 1);
    assert.ok(timeline.timeline.some((item) => item.kind === "WorkCheckpoint"));
  });

  it("serializes concurrent checkpoints so project evidence links are not lost", async () => {
    await vault.init();
    await startProject(vault, { id: "project.checkpoint.parallel", name: "x", goal: "g" });
    const otherWriter = new GitVault(tmpDir);
    await otherWriter.init();

    await Promise.all([
      captureWorkCheckpoint(vault, {
        id: "checkpoint.parallel.a", eventId: "event.parallel.a", evidenceId: "evidence.parallel.a",
        projectId: "project.checkpoint.parallel", title: "First capture", content: "First consented fragment.",
        sourceTool: "trae", consented: true
      }),
      captureWorkCheckpoint(otherWriter, {
        id: "checkpoint.parallel.b", eventId: "event.parallel.b", evidenceId: "evidence.parallel.b",
        projectId: "project.checkpoint.parallel", title: "Second capture", content: "Second consented fragment.",
        sourceTool: "trae", consented: true
      })
    ]);

    const project = await getProject(vault, "project.checkpoint.parallel");
    assert.deepEqual([...project.evidenceLinkIds].sort(), ["evidence.parallel.a", "evidence.parallel.b"]);
    const timeline = await buildProjectTimeline(vault, "project.checkpoint.parallel");
    assert.equal(timeline.counts.checkpoints, 2);
  });

  it("rolls back the full source chain when checkpoint persistence fails", async () => {
    await vault.init();
    await startProject(vault, { id: "project.checkpoint.rollback", name: "x", goal: "g" });
    const originalSave = vault.vault.save.bind(vault.vault);
    vault.vault.save = async (record) => {
      if (record.kind === "WorkCheckpoint") throw new Error("injected checkpoint failure");
      return originalSave(record);
    };

    await assert.rejects(
      () => captureWorkCheckpoint(vault, {
        id: "checkpoint.rollback", eventId: "event.rollback", evidenceId: "evidence.rollback",
        projectId: "project.checkpoint.rollback", title: "Must not be partial", content: "A failed write must leave no source chain.",
        sourceTool: "trae", consented: true
      }),
      /injected checkpoint failure/
    );

    assert.equal(await vault.load("ConversationEvent", "event.rollback"), null);
    assert.equal(await vault.load("EvidenceLink", "evidence.rollback"), null);
    assert.equal(await vault.load("WorkCheckpoint", "checkpoint.rollback"), null);
    assert.deepEqual((await getProject(vault, "project.checkpoint.rollback")).evidenceLinkIds, []);
  });
});

describe("Experience Receipt drafts", () => {
  it("creates a cited draft from consented checkpoints and requires human acceptance", async () => {
    await startProject(vault, { id: "project.draft", name: "x", goal: "g" });
    await captureWorkCheckpoint(vault, {
      id: "checkpoint.draft", eventId: "event.draft", evidenceId: "evidence.draft",
      projectId: "project.draft", title: "Fixed a schema mismatch", content: "The test passed after schema validation was fixed.",
      sourceTool: "codex", consented: true
    });
    const draft = await proposeExperienceReceiptDraft(vault, new MockLLMAdapter(), {
      id: "receipt_draft.test", projectId: "project.draft", checkpointIds: ["checkpoint.draft"]
    });
    assert.equal(draft.status, "pending_review");
    assert.deepEqual(draft.evidenceLinkIds, ["evidence.draft"]);
    assert.equal(await vault.load("ExperienceReceipt", "receipt.fromdraft"), null);
    const accepted = await acceptExperienceReceiptDraft(vault, { draftId: draft.id, receiptId: "receipt.fromdraft", actor: "human" });
    assert.equal(accepted.draft.status, "accepted");
    assert.equal(accepted.receipt.sourceDraftId, draft.id);
    const evidence = await getProjectTrialEvidence(vault, "project.draft");
    assert.equal(evidence.draftReview.handled, 1);
    assert.equal(evidence.evidenceCoverage.ratio, 1);
    assert.equal(evidence.verification.approvedAssets, 0);
    assert.equal(evidence.interpretation.isSufficientForValueClaim, false);
  });

  it("degrades malformed model uncertainty to an explicit human-visible warning", async () => {
    await startProject(vault, { id: "project.draft.normalized", name: "x", goal: "g" });
    await captureWorkCheckpoint(vault, {
      id: "checkpoint.draft.normalized", eventId: "event.draft.normalized", evidenceId: "evidence.draft.normalized",
      projectId: "project.draft.normalized", title: "Schema resilience", content: "A model may explain uncertainty instead of returning a number.",
      sourceTool: "codex", consented: true
    });
    const llm = {
      name: "test-live",
      mode: "live",
      complete: async () => ({
        content: JSON.stringify({ phase: "test", summary: "A sourced draft.", outcome: "not a controlled outcome", uncertainty: "not numerically calibrated", counterexamples: "one counterexample", applicabilityBounds: "one boundary", lessonsLearned: "one lesson" }),
        model: "test-model",
        usage: { promptTokens: 1, completionTokens: 1 }
      })
    };
    const draft = await proposeExperienceReceiptDraft(vault, llm, {
      id: "draft.normalized", projectId: "project.draft.normalized", checkpointIds: ["checkpoint.draft.normalized"]
    });
    assert.equal(draft.uncertainty, null);
    assert.equal(draft.outcome, "unknown");
    assert.deepEqual(draft.counterexamples, ["one counterexample"]);
    assert.deepEqual(draft.applicabilityBounds, ["one boundary"]);
    assert.equal(draft.generationWarnings.length, 5);
  });

  it("accepts an active-agent draft without an EOS API call and still requires human acceptance", async () => {
    await startProject(vault, { id: "project.agent.hosted", name: "x", goal: "g" });
    await captureWorkCheckpoint(vault, {
      id: "checkpoint.agent.hosted", eventId: "event.agent.hosted", evidenceId: "evidence.agent.hosted",
      projectId: "project.agent.hosted", title: "Agent-hosted proposal", content: "The current coding agent already has this consented context.",
      sourceTool: "codex", consented: true
    });
    const draft = await submitAgentExperienceReceiptDraft(vault, {
      id: "receipt_draft.agent.hosted",
      projectId: "project.agent.hosted",
      checkpointIds: ["checkpoint.agent.hosted"],
      proposal: {
        phase: "协作", summary: "当前工具可在不暴露 EOS Key 的情况下提交候选草案。",
        outcome: "natural language claim", uncertainty: "low", counterexamples: "没有第二个工具的对照", applicabilityBounds: "仅适用于支持 MCP 的当前会话", lessonsLearned: "人类仍需确认"
      },
      agent: { provider: "codex", model: "hosted-session", actor: "codex-agent", sourceTool: "codex" }
    });
    assert.equal(draft.status, "pending_review");
    assert.equal(draft.generatedBy.mode, "agent_hosted");
    assert.equal(draft.outcome, "unknown");
    assert.equal(draft.uncertainty, null);
    assert.ok(draft.generationWarnings.some((warning) => warning.includes("没有调用或保存")));
    assert.equal(await vault.load("ExperienceReceipt", "receipt.agent.hosted"), null);
  });

  it("refuses an agent-hosted draft that cites another project's checkpoint", async () => {
    await startProject(vault, { id: "project.agent.a", name: "a", goal: "g" });
    await startProject(vault, { id: "project.agent.b", name: "b", goal: "g" });
    await captureWorkCheckpoint(vault, {
      id: "checkpoint.agent.b", eventId: "event.agent.b", evidenceId: "evidence.agent.b",
      projectId: "project.agent.b", title: "Private", content: "Not shareable across projects.", sourceTool: "codex", consented: true
    });
    await assert.rejects(() => submitAgentExperienceReceiptDraft(vault, {
      id: "receipt_draft.agent.bad", projectId: "project.agent.a", checkpointIds: ["checkpoint.agent.b"],
      proposal: { summary: "Must fail." }, agent: { provider: "codex", model: "hosted-session", actor: "codex-agent" }
    }), /belongs to another project/);
  });

  it("rolls back receipt creation when draft acceptance cannot be persisted", async () => {
    await vault.init();
    await startProject(vault, { id: "project.draft.rollback", name: "x", goal: "g" });
    await captureWorkCheckpoint(vault, {
      id: "checkpoint.draft.rollback", eventId: "event.draft.rollback", evidenceId: "evidence.draft.rollback",
      projectId: "project.draft.rollback", title: "Transaction boundary", content: "Draft confirmation must be all or nothing.",
      sourceTool: "trae", consented: true
    });
    const draft = await proposeExperienceReceiptDraft(vault, new MockLLMAdapter(), {
      id: "receipt_draft.rollback", projectId: "project.draft.rollback", checkpointIds: ["checkpoint.draft.rollback"]
    });
    const originalSave = vault.vault.save.bind(vault.vault);
    vault.vault.save = async (record) => {
      if (record.kind === "ExperienceReceiptDraft" && record.status === "accepted") {
        throw new Error("injected draft acceptance failure");
      }
      return originalSave(record);
    };

    await assert.rejects(
      () => acceptExperienceReceiptDraft(vault, { draftId: draft.id, receiptId: "receipt.rollback", actor: "human" }),
      /injected draft acceptance failure/
    );

    assert.equal(await vault.load("ExperienceReceipt", "receipt.rollback"), null);
    assert.equal((await vault.load("ExperienceReceiptDraft", draft.id)).status, "pending_review");
    assert.deepEqual((await getProject(vault, "project.draft.rollback")).experienceReceiptIds, []);
  });

  it("refuses drafts from another project's checkpoint and keeps rejection reversible at the source level", async () => {
    await startProject(vault, { id: "project.draft.a", name: "a", goal: "g" });
    await startProject(vault, { id: "project.draft.b", name: "b", goal: "g" });
    await captureWorkCheckpoint(vault, {
      id: "checkpoint.draft.b", eventId: "event.draft.b", evidenceId: "evidence.draft.b",
      projectId: "project.draft.b", title: "Private node", content: "Only B may cite this.", sourceTool: "codex", consented: true
    });
    await assert.rejects(
      () => proposeExperienceReceiptDraft(vault, new MockLLMAdapter(), { id: "receipt_draft.bad", projectId: "project.draft.a", checkpointIds: ["checkpoint.draft.b"] }),
      /belongs to another project/
    );
    const draft = await proposeExperienceReceiptDraft(vault, new MockLLMAdapter(), { id: "receipt_draft.reject", projectId: "project.draft.b", checkpointIds: ["checkpoint.draft.b"] });
    const rejected = await rejectExperienceReceiptDraft(vault, { draftId: draft.id, actor: "human", reason: "too broad" });
    assert.equal(rejected.status, "rejected");
    assert.ok(await vault.load("WorkCheckpoint", "checkpoint.draft.b"));
  });

  it("allows a human to defer rather than silently abandon a pending draft", async () => {
    await startProject(vault, { id: "project.draft.defer", name: "x", goal: "g" });
    await captureWorkCheckpoint(vault, {
      id: "checkpoint.draft.defer", eventId: "event.draft.defer", evidenceId: "evidence.draft.defer",
      projectId: "project.draft.defer", title: "Need more evidence", content: "One observation is not enough.", sourceTool: "codex", consented: true
    });
    const draft = await proposeExperienceReceiptDraft(vault, new MockLLMAdapter(), {
      id: "receipt_draft.defer", projectId: "project.draft.defer", checkpointIds: ["checkpoint.draft.defer"]
    });
    const deferred = await deferExperienceReceiptDraft(vault, { draftId: draft.id, actor: "human", reason: "wait for a second project" });
    assert.equal(deferred.status, "deferred");
    assert.equal(deferred.deferralReason, "wait for a second project");
    await assert.rejects(() => acceptExperienceReceiptDraft(vault, { draftId: draft.id, receiptId: "receipt.defer", actor: "human" }), /only a pending/);
    const resumed = await resumeExperienceReceiptDraft(vault, { draftId: draft.id, actor: "human" });
    assert.equal(resumed.status, "pending_review");
    await assert.rejects(() => resumeExperienceReceiptDraft(vault, { draftId: draft.id, actor: "human" }), /only a deferred/);
  });
});

describe("recordDecision and recordOutcome", () => {
  it("records a decision with revert info", async () => {
    await startProject(vault, { id: "project.dec", name: "x", goal: "g" });
    const d = await recordDecision(vault, {
      id: "decision.test1",
      projectId: "project.dec",
      action: "publish_skill",
      target: "skill.auth.v2",
      rationale: "Passed review.",
      evidenceLinkIds: [],
      autonomyMode: "execute",
      revertInstructions: "unpublish skill.auth.v2"
    });
    assert.equal(d.action, "publish_skill");
    assert.equal(d.revertible, true);
    assert.ok(d.revertInstructions);
  });

  it("records an outcome linked to the decision", async () => {
    await startProject(vault, { id: "project.out", name: "x", goal: "g" });
    const d = await recordDecision(vault, {
      id: "decision.out",
      projectId: "project.out",
      action: "publish",
      target: "skill.x",
      rationale: "r",
      evidenceLinkIds: [],
      autonomyMode: "execute"
    });
    const o = await recordOutcome(vault, {
      id: "outcome.test1",
      projectId: "project.out",
      decisionReceiptId: d.id,
      action: "publish",
      outcome: "success",
      metrics: { downloads: 5, rating: 4.5 }
    });
    assert.equal(o.decisionReceiptId, d.id);
    assert.equal(o.metrics.rating, 4.5);
  });
});

describe("buildProjectTimeline", () => {
  it("interleaves all 3.0 record types chronologically", async () => {
    await startProject(vault, { id: "project.tl", name: "x", goal: "g" });

    await addEvidenceLink(vault, {
      id: "ev.tl1", projectId: "project.tl",
      type: "code", title: "commit A", source: "git@1"
    });
    await recordDecision(vault, {
      id: "dec.tl1", projectId: "project.tl",
      action: "refactor", target: "auth.js",
      rationale: "clean up", evidenceLinkIds: [],
      autonomyMode: "draft"
    });
    await writeExperienceReceipt(vault, {
      id: "rec.tl1", projectId: "project.tl",
      phase: "refactoring", summary: "Refactored auth.",
      evidenceLinkIds: [], outcome: "success"
    });
    await recordOutcome(vault, {
      id: "out.tl1", projectId: "project.tl",
      action: "refactor", outcome: "success", metrics: { tests: 42 }
    });

    const timeline = await buildProjectTimeline(vault, "project.tl");
    assert.equal(timeline.counts.evidence, 1);
    assert.equal(timeline.counts.decisions, 1);
    assert.equal(timeline.counts.receipts, 1);
    assert.equal(timeline.counts.outcomes, 1);
    assert.equal(timeline.timeline.length, 4);

    // Every kind should be present
    const kinds = new Set(timeline.timeline.map((t) => t.kind));
    assert.ok(kinds.has("EvidenceLink"));
    assert.ok(kinds.has("DecisionReceipt"));
    assert.ok(kinds.has("ExperienceReceipt"));
    assert.ok(kinds.has("OutcomeRecord"));
  });

  it("returns empty timeline for project with no 3.0 records", async () => {
    await startProject(vault, { id: "project.empty", name: "x", goal: "g" });
    const timeline = await buildProjectTimeline(vault, "project.empty");
    assert.equal(timeline.timeline.length, 0);
    assert.equal(timeline.counts.evidence, 0);
  });
});

describe("full closed loop: project → evidence → receipt → decision → outcome", () => {
  it("runs the 3.0 main loop end to end", async () => {
    // 1. Start a project
    const project = await startProject(vault, {
      id: "project.closeloop",
      name: "Closed Loop Test",
      goal: "Verify the full 3.0 main loop",
      autonomyMode: "advise"
    });
    assert.equal(project.status, "planning");

    // 2. Add evidence
    const ev = await addEvidenceLink(vault, {
      id: "ev.loop",
      projectId: "project.closeloop",
      type: "test",
      title: "test results",
      source: "tests/results.json",
      uncertainty: 0.1
    });

    // 3. Write an experience receipt with the evidence
    const receipt = await writeExperienceReceipt(vault, {
      id: "receipt.loop",
      projectId: "project.closeloop",
      phase: "testing",
      summary: "All 371 tests pass after the 3.0 schema changes.",
      evidenceLinkIds: [ev.id],
      outcome: "success",
      uncertainty: 0.05,
      applicabilityBounds: ["node 22+", "single-user vault"]
    });
    assert.deepEqual(receipt.evidenceLinkIds, [ev.id]);

    // 4. Escalate autonomy and record a decision
    await updateProject(vault, "project.closeloop", {
      status: "active",
      autonomyMode: "execute"
    });
    const decision = await recordDecision(vault, {
      id: "decision.loop",
      projectId: "project.closeloop",
      action: "merge_to_main",
      target: "branch-3.0-schema",
      rationale: "All tests pass, schema is backward compatible.",
      receiptId: receipt.id,
      evidenceLinkIds: [ev.id],
      autonomyMode: "execute",
      humanReviewed: true,
      reviewedBy: "user.tester",
      revertInstructions: "git revert <commit>"
    });

    // 5. Record the outcome
    const outcome = await recordOutcome(vault, {
      id: "outcome.loop",
      projectId: "project.closeloop",
      decisionReceiptId: decision.id,
      action: "merge_to_main",
      outcome: "success",
      metrics: { tests: 371, failures: 0 }
    });

    // 6. Build the timeline — should see the full story
    const timeline = await buildProjectTimeline(vault, "project.closeloop");
    assert.equal(timeline.timeline.length, 4);

    // The project should now reference its evidence and receipts
    const finalProject = await getProject(vault, "project.closeloop");
    assert.deepEqual(finalProject.evidenceLinkIds, [ev.id]);
    assert.deepEqual(finalProject.experienceReceiptIds, [receipt.id]);
    assert.equal(finalProject.status, "active");
    assert.equal(finalProject.autonomyMode, "execute");
  });
});

describe("regression: input validation guardrails (Bug2/Bug3/Bug4)", () => {
  it("recordOutcome rejects invalid outcome", async () => {
    await startProject(vault, { id: "project.val1", name: "x", goal: "g" });
    await assert.rejects(
      () => recordOutcome(vault, {
        id: "o.bad", projectId: "project.val1",
        action: "x", outcome: "miracle", metrics: {}
      }),
      /outcome must be one of/
    );
  });

  it("writeExperienceReceipt rejects invalid outcome", async () => {
    await startProject(vault, { id: "project.val2", name: "x", goal: "g" });
    await assert.rejects(
      () => writeExperienceReceipt(vault, {
        id: "r.bad", projectId: "project.val2",
        phase: "x", summary: "s", evidenceLinkIds: [],
        outcome: "miracle"
      }),
      /outcome must be one of/
    );
  });

  it("addEvidenceLink rejects invalid type", async () => {
    await startProject(vault, { id: "project.val3", name: "x", goal: "g" });
    await assert.rejects(
      () => addEvidenceLink(vault, {
        id: "e.bad", projectId: "project.val3",
        type: "gossip", title: "t", source: "s"
      }),
      /type must be one of/
    );
  });

  it("addEvidenceLink rejects NaN uncertainty", async () => {
    await startProject(vault, { id: "project.val4", name: "x", goal: "g" });
    await assert.rejects(
      () => addEvidenceLink(vault, {
        id: "e.nan", projectId: "project.val4",
        type: "doc", title: "t", source: "s",
        uncertainty: NaN
      }),
      /uncertainty must be a number/
    );
  });

  it("addEvidenceLink rejects non-finite uncertainty (Infinity)", async () => {
    await startProject(vault, { id: "project.val5", name: "x", goal: "g" });
    await assert.rejects(
      () => addEvidenceLink(vault, {
        id: "e.inf", projectId: "project.val5",
        type: "doc", title: "t", source: "s",
        uncertainty: Infinity
      }),
      /uncertainty must be a number/
    );
  });

  it("addEvidenceLink accepts null uncertainty", async () => {
    await startProject(vault, { id: "project.val6", name: "x", goal: "g" });
    const link = await addEvidenceLink(vault, {
      id: "e.null", projectId: "project.val6",
      type: "doc", title: "t", source: "s",
      uncertainty: null
    });
    assert.equal(link.uncertainty, null);
  });

  it("addEvidenceLink accepts string uncertainty and normalizes to number", async () => {
    await startProject(vault, { id: "project.val7", name: "x", goal: "g" });
    const link = await addEvidenceLink(vault, {
      id: "e.str", projectId: "project.val7",
      type: "doc", title: "t", source: "s",
      uncertainty: "0.3"
    });
    assert.equal(link.uncertainty, 0.3);
    assert.equal(typeof link.uncertainty, "number");
  });

  it("updateProject rejects empty-string status (Bug4)", async () => {
    await startProject(vault, { id: "project.val8", name: "x", goal: "g" });
    await assert.rejects(
      () => updateProject(vault, "project.val8", { status: "" }),
      /status must be one of/
    );
  });

  it("updateProject rejects empty-string autonomyMode (Bug4)", async () => {
    await startProject(vault, { id: "project.val9", name: "x", goal: "g" });
    await assert.rejects(
      () => updateProject(vault, "project.val9", { autonomyMode: "" }),
      /autonomyMode must be one of/
    );
  });
});

describe("regression: stable timeline sorting (Bug1)", () => {
  it("timeline sort is stable when timestamps are equal", async () => {
    // Create two evidence links with identical capturedAt by writing directly
    await startProject(vault, { id: "project.sort1", name: "x", goal: "g" });
    const ts = "2026-07-18T12:00:00.000Z";
    await vault.save({
      id: "ev.sort1", kind: "EvidenceLink", projectId: "project.sort1",
      type: "doc", title: "first", source: "s", capturedAt: ts,
      createdAt: ts, updatedAt: ts, counterexamples: [], applicabilityBounds: [], tags: []
    });
    await vault.save({
      id: "ev.sort2", kind: "EvidenceLink", projectId: "project.sort1",
      type: "doc", title: "second", source: "s", capturedAt: ts,
      createdAt: ts, updatedAt: ts, counterexamples: [], applicabilityBounds: [], tags: []
    });
    const timeline = await buildProjectTimeline(vault, "project.sort1");
    // Both should be present — the old comparator could lose items when equal
    assert.equal(timeline.timeline.length, 2);
    assert.equal(timeline.counts.evidence, 2);
  });
});
