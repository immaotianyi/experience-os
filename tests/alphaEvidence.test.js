import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { bootstrapWorkspace } from "../src/eosBootstrap.js";
import { GitVault } from "../src/gitVault.js";
import { captureWorkCheckpoint, proposeExperienceReceiptDraft, submitAgentExperienceReceiptDraft } from "../src/projectEngine.js";
import { MockLLMAdapter } from "../src/llmAdapter.js";
import { collectAlphaEvidence } from "../src/alphaEvidence.js";

let workspace;

afterEach(async () => {
  if (workspace) await rm(workspace, { recursive: true, force: true });
  workspace = null;
});

describe("collectAlphaEvidence", () => {
  it("reports observed data while keeping rehearsal separate from live evidence", async () => {
    workspace = await mkdtemp(path.join(tmpdir(), "eos-alpha-"));
    const bootstrapped = await bootstrapWorkspace({ workspaceDir: workspace, name: "Alpha test", goal: "Verify evidence reporting" });
    const vault = new GitVault(bootstrapped.vaultDir);
    await captureWorkCheckpoint(vault, {
      id: "checkpoint.alpha", eventId: "event.alpha", evidenceId: "evidence.alpha",
      projectId: bootstrapped.projectId, title: "Consent capture", content: "A locally consented test fragment.",
      sourceTool: "test", consented: true, capturePermitId: "permit.alpha"
    });
    await proposeExperienceReceiptDraft(vault, new MockLLMAdapter(), {
      id: "draft.alpha", projectId: bootstrapped.projectId, checkpointIds: ["checkpoint.alpha"]
    });

    const report = await collectAlphaEvidence({ workspaceDir: workspace });
    assert.equal(report.capture.workCheckpoints, 1);
    assert.equal(report.capture.strictPermitBackedCheckpoints, 1);
    assert.equal(report.modelDrafts.rehearsal, 1);
    assert.equal(report.modelDrafts.live, 0);
    assert.equal(report.reuseTrials.total, 0);
    assert.equal(report.valueClaimAllowed, false);
    assert.ok(report.missingEvidence.some((item) => item.includes("真实 AI 草案")));
  });

  it("counts an agent-hosted Codex-style draft as real AI evidence without relabeling it as direct API", async () => {
    workspace = await mkdtemp(path.join(tmpdir(), "eos-agent-alpha-"));
    const bootstrapped = await bootstrapWorkspace({ workspaceDir: workspace, name: "Agent-hosted Alpha" });
    const vault = new GitVault(bootstrapped.vaultDir);
    await captureWorkCheckpoint(vault, {
      id: "checkpoint.agent", eventId: "event.agent", evidenceId: "evidence.agent",
      projectId: bootstrapped.projectId, title: "Consented agent test", content: "A user-consented test fragment.",
      sourceTool: "codex", consented: true
    });
    await submitAgentExperienceReceiptDraft(vault, {
      id: "draft.agent", projectId: bootstrapped.projectId, checkpointIds: ["checkpoint.agent"],
      proposal: { summary: "An active agent submitted a bounded draft." },
      agent: { provider: "OpenAI", model: "Codex", actor: "codex", sourceTool: "codex" }
    });

    const report = await collectAlphaEvidence({ workspaceDir: workspace });
    assert.equal(report.modelDrafts.live, 0);
    assert.equal(report.modelDrafts.agentHosted, 1);
    assert.equal(report.modelDrafts.rehearsal, 0);
    assert.ok(!report.missingEvidence.some((item) => item.includes("真实 AI 草案")));
  });
});
