import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { GitVault } from "../src/gitVault.js";
import { startProject } from "../src/projectEngine.js";
import { approveHostObservationConsent, buildMcpRelayObservation } from "../src/hostObservationEngine.js";
import { mcpRelayTokenPath } from "../src/hostHookPlan.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const relayScript = path.join(projectRoot, "src", "eosRelayMcp.js");

function startCaptureServer() {
  const bodies = [];
  const server = http.createServer((request, response) => {
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; });
    request.on("end", () => {
      bodies.push(JSON.parse(raw));
      response.writeHead(201, { "content-type": "application/json" });
      response.end("{}");
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, bodies, port: server.address().port }));
  });
}

function startObservedRelay({ vaultDir, secretRoot, endpoint }) {
  const child = spawn(process.execPath, [relayScript], {
    cwd: projectRoot,
    env: {
      ...process.env,
      EOS_VAULT_DIR: vaultDir,
      EOS_RELAY_HOST: "trae",
      EOS_HOOK_ENDPOINT: endpoint,
      EOS_SECRET_ROOT: secretRoot
    },
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
    },
    exit: () => new Promise((resolve) => {
      child.stdin.end();
      child.on("exit", resolve);
    })
  };
}

async function waitFor(predicate, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

describe("buildMcpRelayObservation", () => {
  const base = { sessionId: "mcp.123.abc", hashSalt: "salt" };

  it("maps the relay lifecycle onto allowlisted observations", () => {
    const start = buildMcpRelayObservation("trae", "SessionStart", base);
    assert.equal(start.host, "trae");
    assert.equal(start.eventName, "SessionStart");
    assert.equal(start.eventCategory, "session");
    assert.equal(start.outcome, "unknown");
    assert.ok(start.sessionHash.startsWith("sha256:"));

    const done = buildMcpRelayObservation("trae", "PostToolUse", { ...base, turnId: "42", toolName: "eos_project_timeline" });
    assert.equal(done.eventCategory, "tool");
    assert.equal(done.outcome, "success");
    assert.equal(done.toolName, "eos_project_timeline");
    assert.ok(done.turnHash.startsWith("sha256:"));
    assert.equal(done.sessionHash, start.sessionHash);

    const failed = buildMcpRelayObservation("cursor", "PostToolUseFailure", base);
    assert.equal(failed.outcome, "failure");
  });

  it("rejects hook-only hosts and unverified events", () => {
    assert.throws(() => buildMcpRelayObservation("codex", "SessionStart", base), /not verified/);
    assert.throws(() => buildMcpRelayObservation("trae", "UserPromptSubmit", base), /Unsupported MCP relay event/);
  });
});

describe("mcpRelayTokenPath", () => {
  it("keeps MCP relay hosts separate from hook hosts", () => {
    const token = mcpRelayTokenPath("trae", "/tmp/demo", "/tmp/secrets");
    assert.match(token, /^\/tmp\/secrets\/[0-9a-f]{24}\/trae\.token$/);
    assert.throws(() => mcpRelayTokenPath("codex", "/tmp/demo", "/tmp/secrets"), /not verified/);
  });
});

describe("relay self-observation (TRAE)", () => {
  let workspaceDir;
  let vaultDir;
  let secretRoot;
  let capture;
  let consent;

  beforeEach(async () => {
    workspaceDir = await mkdtemp(path.join(tmpdir(), "eos-relay-obs-"));
    vaultDir = path.join(workspaceDir, ".eos", "vault");
    secretRoot = path.join(workspaceDir, "secrets");
    await mkdir(vaultDir, { recursive: true });

    const vault = new GitVault(vaultDir);
    await vault.init();
    await startProject(vault, { id: "project.trae", name: "TRAE watch", goal: "Verify relay observation" });
    consent = await approveHostObservationConsent(vault, {
      projectId: "project.trae",
      host: "trae",
      approvedBy: "test",
      metadataOnlyAcknowledged: true
    });
    const tokenPath = mcpRelayTokenPath("trae", workspaceDir, secretRoot);
    await mkdir(path.dirname(tokenPath), { recursive: true });
    await writeFile(tokenPath, `${consent.captureToken}\n`, { mode: 0o600 });
    await chmod(tokenPath, 0o600);

    capture = await startCaptureServer();
  });

  afterEach(async () => {
    await new Promise((resolve) => capture.server.close(resolve));
    await rm(workspaceDir, { recursive: true, force: true });
  });

  it("reports SessionStart, tool activity, and SessionEnd with consent and token", async () => {
    const relay = startObservedRelay({
      vaultDir,
      secretRoot,
      endpoint: `http://127.0.0.1:${capture.port}`
    });

    const initialized = await relay.request({ jsonrpc: "2.0", id: 1, method: "initialize" });
    assert.equal(initialized.result.serverInfo.name, "experience-os-capture-relay");
    await waitFor(() => capture.bodies.some((body) => body.observation?.eventName === "SessionStart"));

    const called = await relay.request({
      jsonrpc: "2.0", id: 2, method: "tools/call",
      params: { name: "eos_project_timeline", arguments: { projectId: "project.trae" } }
    });
    assert.equal(called.result.isError, undefined);
    await waitFor(() => capture.bodies.some((body) => body.observation?.eventName === "PostToolUse"));

    await relay.exit();
    await waitFor(() => capture.bodies.some((body) => body.observation?.eventName === "SessionEnd"));

    const events = capture.bodies.map((body) => body.observation);
    const names = events.map((event) => event.eventName);
    assert.deepEqual(names.slice(0, 4), [
      "SessionStart", "PreToolUse", "PostToolUse", "SessionEnd"
    ]);
    // SessionEnd is retransmitted once on purpose; extras must be identical retries.
    for (const extra of names.slice(4)) assert.equal(extra, "SessionEnd");
    for (const body of capture.bodies) {
      assert.equal(body.consentId, consent.id);
      assert.equal(body.captureToken, consent.captureToken);
    }
    for (const event of events) {
      assert.equal(event.host, "trae");
      assert.equal(event.sessionHash, events[0].sessionHash);
    }
    assert.equal(events[1].toolName, "eos_project_timeline");
    assert.equal(events[1].turnHash, events[2].turnHash);
    assert.equal(events[3].toolName, null);
  });

  it("stays silent when EOS_RELAY_HOST is absent (hook hosts keep their stream)", async () => {
    const child = spawn(process.execPath, [relayScript], {
      cwd: projectRoot,
      env: { ...process.env, EOS_VAULT_DIR: vaultDir, EOS_HOOK_ENDPOINT: `http://127.0.0.1:${capture.port}` },
      stdio: ["pipe", "pipe", "pipe"]
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" })}\n`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    child.kill();
    assert.equal(capture.bodies.length, 0);
  });
});
