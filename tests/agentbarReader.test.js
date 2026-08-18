import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { GitVault } from "../src/gitVault.js";
import { bootstrapWorkspace } from "../src/eosBootstrap.js";
import { approveHostObservationConsent, recordHostObservation } from "../src/hostObservationEngine.js";
import { createAgentbarReader } from "../src/agentbarReader.js";

let tempDirs = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

async function fixture({ host = "claude", skipHosts = [] } = {}) {
  const workspaceDir = await mkdtemp(path.join(tmpdir(), "eos-agentbar-"));
  tempDirs.push(workspaceDir);
  const config = await bootstrapWorkspace({ workspaceDir, name: "Agentbar reader test" });
  const vault = new GitVault(config.vaultDir);
  const project = (await vault.list("Project"))[0];
  const consent = await approveHostObservationConsent(vault, {
    projectId: project.id,
    host,
    approvedBy: "test-user",
    metadataOnlyAcknowledged: true
  });

  const secretRoot = await mkdtemp(path.join(tmpdir(), "eos-agentbar-secrets-"));
  tempDirs.push(secretRoot);
  const workspaceHash = createHash("sha256").update(path.resolve(workspaceDir)).digest("hex").slice(0, 24);
  const tokenDir = path.join(secretRoot, workspaceHash);
  await mkdir(tokenDir, { recursive: true });
  await writeFile(path.join(tokenDir, `${host}.token`), consent.captureToken, { encoding: "utf8", mode: 0o600 });

  const stateDir = await mkdtemp(path.join(tmpdir(), "eos-agentbar-state-"));
  tempDirs.push(stateDir);

  let clock = 1_700_000_000_000;
  const recorded = [];
  const reader = createAgentbarReader({
    stateDir,
    skipHosts,
    vaultDir: config.vaultDir,
    listConsents: async () => vault.list("HostObservationConsent"),
    record: async (payload) => {
      const result = await recordHostObservation(vault, payload);
      recorded.push(result.eventName);
      return result;
    },
    secretRoot,
    now: () => clock
  });
  return {
    reader,
    stateDir,
    getRecorded: () => recorded,
    advance: (ms) => { clock += ms; },
    seconds: () => Math.floor(clock / 1000)
  };
}

async function writeState(stateDir, sessionId, body) {
  await writeFile(path.join(stateDir, `${sessionId}.json`), JSON.stringify(body), "utf8");
}

describe("EOS AgentBar protocol reader", () => {
  it("maps protocol state transitions to consented observations", async () => {
    const { reader, stateDir, getRecorded, advance, seconds } = await fixture();

    await reader.tick();
    assert.deepEqual(getRecorded(), []);

    await writeState(stateDir, "sess-1", {
      agent: "claude", state: "tool", ts: seconds(), pid: process.pid, started: true
    });
    await reader.tick();
    assert.deepEqual(getRecorded(), ["SessionStart"]);

    advance(3_000);
    await writeState(stateDir, "sess-1", {
      agent: "claude", state: "tool", ts: seconds(), pid: process.pid, started: true
    });
    await reader.tick();
    assert.deepEqual(getRecorded(), ["SessionStart", "PostToolUse"]);

    advance(3_000);
    await writeState(stateDir, "sess-1", {
      agent: "claude", state: "permission", ts: seconds(), pid: process.pid, started: true
    });
    await reader.tick();
    assert.deepEqual(getRecorded(), ["SessionStart", "PostToolUse", "PermissionRequest"]);

    advance(3_000);
    await writeState(stateDir, "sess-1", {
      agent: "claude", state: "done", ts: seconds(), pid: process.pid, started: true
    });
    await reader.tick();
    assert.deepEqual(getRecorded(), ["SessionStart", "PostToolUse", "PermissionRequest", "Stop"]);

    await rm(path.join(stateDir, "sess-1.json"), { force: true });
    await reader.tick();
    assert.deepEqual(
      getRecorded(),
      ["SessionStart", "PostToolUse", "PermissionRequest", "Stop", "SessionEnd"]
    );
  });

  it("emits the terminal state on first sight of an already-waiting session", async () => {
    const { reader, stateDir, getRecorded, seconds } = await fixture();
    await writeState(stateDir, "sess-2", {
      agent: "claude", state: "question", ts: seconds(), pid: process.pid, started: true
    });
    await reader.tick();
    assert.deepEqual(getRecorded(), ["SessionStart", "PermissionRequest"]);
  });

  it("prunes sessions by pid liveness and 24h age per protocol rules", async () => {
    const { reader, stateDir, getRecorded, advance, seconds } = await fixture();
    const deadPid = 4_194_304;

    await writeState(stateDir, "dead-first", {
      agent: "claude", state: "tool", ts: seconds(), pid: deadPid, started: true
    });
    await reader.tick();
    assert.deepEqual(getRecorded(), []);

    await writeState(stateDir, "stale-first", {
      agent: "claude", state: "tool", ts: seconds() - 25 * 3600, pid: process.pid, started: true
    });
    await reader.tick();
    assert.deepEqual(getRecorded(), []);

    await writeState(stateDir, "live", {
      agent: "claude", state: "tool", ts: seconds(), pid: process.pid, started: true
    });
    await reader.tick();
    assert.deepEqual(getRecorded(), ["SessionStart"]);

    advance(1_000);
    await writeState(stateDir, "live", {
      agent: "claude", state: "tool", ts: seconds(), pid: deadPid, started: true
    });
    await reader.tick();
    assert.deepEqual(getRecorded(), ["SessionStart", "SessionEnd"]);
  });

  it("marks a tracked session ended when its timestamp goes stale", async () => {
    const { reader, stateDir, getRecorded, advance, seconds } = await fixture();
    await writeState(stateDir, "sess-3", {
      agent: "claude", state: "tool", ts: seconds(), pid: process.pid, started: true
    });
    await reader.tick();
    assert.deepEqual(getRecorded(), ["SessionStart"]);

    advance(25 * 3600 * 1000);
    await writeState(stateDir, "sess-3", {
      agent: "claude", state: "tool", ts: seconds() - 25 * 3600, pid: process.pid, started: true
    });
    await reader.tick();
    assert.deepEqual(getRecorded(), ["SessionStart", "SessionEnd"]);
  });

  it("gates unstarted sessions, unknown agents, skipped hosts, and corrupt files", async () => {
    const { reader, stateDir, getRecorded, seconds } = await fixture({ skipHosts: ["claude"] });

    await writeState(stateDir, "not-started", {
      agent: "claude", state: "tool", ts: seconds(), pid: process.pid, started: false
    });
    await writeState(stateDir, "unknown-agent", {
      agent: "gemini", state: "tool", ts: seconds(), pid: process.pid, started: true
    });
    await writeState(stateDir, "skipped-host", {
      agent: "claude", state: "tool", ts: seconds(), pid: process.pid, started: true
    });
    await writeFile(path.join(stateDir, "corrupt.json"), "{not json", "utf8");
    await writeFile(path.join(stateDir, "bad name.json"), "{}", "utf8");

    await reader.tick();
    assert.deepEqual(getRecorded(), []);
  });

  it("ends a tracked session after consecutive corrupt reads", async () => {
    const { reader, stateDir, getRecorded, seconds } = await fixture();
    await writeState(stateDir, "flaky", {
      agent: "claude", state: "tool", ts: seconds(), pid: process.pid, started: true
    });
    await reader.tick();
    assert.deepEqual(getRecorded(), ["SessionStart"]);

    await writeFile(path.join(stateDir, "flaky.json"), "{corrupt", "utf8");
    await reader.tick();
    assert.deepEqual(getRecorded(), ["SessionStart"]);

    await reader.tick();
    assert.deepEqual(getRecorded(), ["SessionStart", "SessionEnd"]);
  });

  it("stays silent without an active consent", async () => {
    const { stateDir } = await fixture();
    const workspaceDir = await mkdtemp(path.join(tmpdir(), "eos-agentbar-nconsent-"));
    tempDirs.push(workspaceDir);
    const config = await bootstrapWorkspace({ workspaceDir, name: "No consent" });
    const vault = new GitVault(config.vaultDir);
    const silent = createAgentbarReader({
      stateDir,
      vaultDir: config.vaultDir,
      listConsents: async () => vault.list("HostObservationConsent"),
      record: async () => {
        throw new Error("record must not be called without consent");
      },
      secretRoot: "/nonexistent-eos-secrets",
      now: () => 1_700_000_000_000
    });
    await writeState(stateDir, "sess-4", {
      agent: "claude", state: "tool", ts: 1_700_000_000, pid: process.pid, started: true
    });
    await silent.tick();
  });

  it("ignores a missing state directory without errors", async () => {
    const workspaceDir = await mkdtemp(path.join(tmpdir(), "eos-agentbar-missing-"));
    tempDirs.push(workspaceDir);
    const config = await bootstrapWorkspace({ workspaceDir, name: "Missing dir" });
    const vault = new GitVault(config.vaultDir);
    const reader = createAgentbarReader({
      stateDir: path.join(workspaceDir, "does-not-exist", "state.d"),
      vaultDir: config.vaultDir,
      listConsents: async () => vault.list("HostObservationConsent"),
      record: async () => {
        throw new Error("record must not be called");
      },
      now: () => 1_700_000_000_000
    });
    await reader.tick();
    await reader.tick();
  });
});
