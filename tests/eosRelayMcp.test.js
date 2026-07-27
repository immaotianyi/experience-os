import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { GitVault } from "../src/gitVault.js";
import { startProject } from "../src/projectEngine.js";
import { approveCapturePermitRequest } from "../src/capturePermitStore.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const relayScript = path.join(projectRoot, "src", "eosRelayMcp.js");

function startRelay(vaultDir, extraEnv = {}) {
  const child = spawn(process.execPath, [relayScript], {
    cwd: projectRoot,
    env: { ...process.env, EOS_VAULT_DIR: vaultDir, ...extraEnv },
    stdio: ["pipe", "pipe", "pipe"]
  });
  let buffer = "";
  const replies = [];
  const waiters = [];
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    let newline;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      const reply = JSON.parse(line);
      const waiter = waiters.shift();
      if (waiter) waiter(reply); else replies.push(reply);
    }
  });
  return {
    child,
    request(message) {
      return new Promise((resolve) => {
        if (replies.length) resolve(replies.shift()); else waiters.push(resolve);
        child.stdin.write(`${JSON.stringify(message)}\n`);
      });
    }
  };
}

describe("EOS Capture Relay MCP", () => {
  let vaultDir;
  let relay;

  beforeEach(async () => {
    vaultDir = await mkdtemp(path.join(tmpdir(), "eos-relay-mcp-"));
    const vault = new GitVault(vaultDir);
    await vault.init();
    await startProject(vault, { id: "project.mcp", name: "MCP test", goal: "Verify tool bridge" });
    relay = startRelay(vaultDir);
  });

  afterEach(async () => {
    relay?.child.kill();
    await rm(vaultDir, { recursive: true, force: true });
  });

  it("lists bounded relay tools and captures only consented content", async () => {
    const initialized = await relay.request({ jsonrpc: "2.0", id: 1, method: "initialize" });
    assert.equal(initialized.result.serverInfo.name, "experience-os-capture-relay");

    const listed = await relay.request({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    assert.equal(listed.result.tools.length, 7);
    assert.ok(listed.result.tools.some((tool) => tool.name === "eos_capture_collaboration"));
    assert.ok(listed.result.tools.some((tool) => tool.name === "eos_prepare_capture_permit"));
    assert.ok(listed.result.tools.some((tool) => tool.name === "eos_submit_receipt_draft"));

    const rejected = await relay.request({
      jsonrpc: "2.0", id: 3, method: "tools/call",
      params: { name: "eos_capture_collaboration", arguments: {
        projectId: "project.mcp", actor: "human", content: "do not save", sourceTool: "codex", consented: false
      } }
    });
    assert.equal(rejected.result.isError, true);

    const captured = await relay.request({
      jsonrpc: "2.0", id: 4, method: "tools/call",
      params: { name: "eos_capture_collaboration", arguments: {
        projectId: "project.mcp", actor: "human", content: "save this evidence", sourceTool: "codex", consented: true
      } }
    });
    const payload = JSON.parse(captured.result.content[0].text);
    assert.equal(payload.ok, true);
    assert.equal(payload.event.consented, true);
    assert.equal(payload.evidence.projectId, "project.mcp");
    assert.equal(payload.checkpoint.eventId, payload.event.id);
    assert.equal(payload.checkpoint.evidenceLinkId, payload.evidence.id);

    const timeline = await relay.request({
      jsonrpc: "2.0", id: 5, method: "tools/call",
      params: { name: "eos_project_timeline", arguments: { projectId: "project.mcp" } }
    });
    const timelinePayload = JSON.parse(timeline.result.content[0].text);
    assert.equal(timelinePayload.counts.events, 1);
    assert.equal(timelinePayload.counts.evidence, 1);
    assert.equal(timelinePayload.counts.checkpoints, 1);
  });

  it("accepts a current-agent receipt proposal without EOS model credentials", async () => {
    const captured = await relay.request({ jsonrpc: "2.0", id: 20, method: "tools/call", params: { name: "eos_capture_collaboration", arguments: {
      projectId: "project.mcp", actor: "human", content: "This consented context is already in the active agent session.", sourceTool: "codex", consented: true
    } } });
    const checkpointId = JSON.parse(captured.result.content[0].text).checkpoint.id;
    const submitted = await relay.request({ jsonrpc: "2.0", id: 21, method: "tools/call", params: { name: "eos_submit_receipt_draft", arguments: {
      id: "receipt_draft.mcp.agent", projectId: "project.mcp", checkpointIds: [checkpointId],
      proposal: { phase: "协作", summary: "A current agent can submit a reviewable candidate without an EOS API key.", outcome: "unknown", uncertainty: null, counterexamples: [], applicabilityBounds: ["MCP-capable active clients only"], lessonsLearned: ["Human review remains required"] },
      agent: { provider: "codex", model: "hosted-session", actor: "codex-agent", sourceTool: "codex" }
    } } });
    const payload = JSON.parse(submitted.result.content[0].text);
    assert.equal(payload.ok, true);
    assert.equal(payload.draft.status, "pending_review");
    assert.equal(payload.draft.generatedBy.mode, "agent_hosted");
    const stored = await new GitVault(vaultDir).load("ExperienceReceiptDraft", "receipt_draft.mcp.agent");
    assert.equal(stored.status, "pending_review");
  });

  it("requires a human-issued permit before strict external capture", async () => {
    relay.child.kill();
    const workspace = await mkdtemp(path.join(tmpdir(), "eos-relay-workspace-"));
    const strictVaultDir = path.join(workspace, ".eos", "vault");
    const strictVault = new GitVault(strictVaultDir);
    await strictVault.init();
    await startProject(strictVault, { id: "project.strict", name: "Strict", goal: "Verify permit boundary" });
    relay = startRelay(strictVaultDir, { EOS_CAPTURE_POLICY: "strict_permit" });

    const rejected = await relay.request({ jsonrpc: "2.0", id: 10, method: "tools/call", params: { name: "eos_capture_collaboration", arguments: {
      projectId: "project.strict", actor: "codex", content: "Save this externally proposed fragment.", sourceTool: "codex", consented: true
    } } });
    assert.equal(rejected.result.isError, true);
    assert.match(rejected.result.content[0].text, /human-issued permitId/);

    const staged = await relay.request({ jsonrpc: "2.0", id: 11, method: "tools/call", params: { name: "eos_prepare_capture_permit", arguments: {
      projectId: "project.strict", actor: "codex", content: "Save this externally proposed fragment.", sourceTool: "codex"
    } } });
    const request = JSON.parse(staged.result.content[0].text).request;
    await approveCapturePermitRequest(path.join(workspace, ".eos"), { id: request.id, projectId: "project.strict", approvedBy: "human" });

    const captured = await relay.request({ jsonrpc: "2.0", id: 12, method: "tools/call", params: { name: "eos_capture_collaboration", arguments: {
      projectId: "project.strict", actor: "codex", content: "Save this externally proposed fragment.", sourceTool: "codex", consented: true, permitId: request.id
    } } });
    const strictPayload = JSON.parse(captured.result.content[0].text);
    assert.equal(strictPayload.ok, true);
    assert.equal(strictPayload.event.capturePermitId, request.id);
    assert.equal(strictPayload.evidence.capturePermitId, request.id);
    assert.equal(strictPayload.checkpoint.capturePermitId, request.id);

    const status = await relay.request({ jsonrpc: "2.0", id: 13, method: "tools/call", params: { name: "eos_capture_permit_status", arguments: { projectId: "project.strict", permitId: request.id } } });
    assert.equal(JSON.parse(status.result.content[0].text).status, "consumed");
    await rm(workspace, { recursive: true, force: true });
  });
});
