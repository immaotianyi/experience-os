import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { GitVault } from "../src/gitVault.js";
import { startProject } from "../src/projectEngine.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const relayScript = path.join(projectRoot, "src", "eosRelayMcp.js");

function startRelay(vaultDir) {
  const child = spawn(process.execPath, [relayScript], {
    cwd: projectRoot,
    env: { ...process.env, EOS_VAULT_DIR: vaultDir },
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
    assert.equal(listed.result.tools.length, 4);
    assert.ok(listed.result.tools.some((tool) => tool.name === "eos_capture_collaboration"));

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
});
