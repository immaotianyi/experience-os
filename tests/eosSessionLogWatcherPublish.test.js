import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile, appendFile, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { GitVault } from "../src/gitVault.js";
import { bootstrapWorkspace } from "../src/eosBootstrap.js";
import { approveHostObservationConsent, recordHostObservation } from "../src/hostObservationEngine.js";
import { createSessionLogWatcher } from "../src/eosSessionLogWatcher.js";

let tempDirs = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

async function fixture({ host = "trae" } = {}) {
  const workspaceDir = await mkdtemp(path.join(tmpdir(), "eos-publish-"));
  tempDirs.push(workspaceDir);
  const config = await bootstrapWorkspace({ workspaceDir, name: "Publish test" });
  const vault = new GitVault(config.vaultDir);
  const project = (await vault.list("Project"))[0];
  const consent = await approveHostObservationConsent(vault, {
    projectId: project.id,
    host,
    approvedBy: "test-user",
    metadataOnlyAcknowledged: true
  });

  const secretRoot = await mkdtemp(path.join(tmpdir(), "eos-publish-secrets-"));
  tempDirs.push(secretRoot);
  const workspaceHash = createHash("sha256").update(path.resolve(workspaceDir)).digest("hex").slice(0, 24);
  const tokenDir = path.join(secretRoot, workspaceHash);
  await mkdir(tokenDir, { recursive: true });
  await writeFile(path.join(tokenDir, `${host}.token`), consent.captureToken, { encoding: "utf8", mode: 0o600 });

  const watchDir = await mkdtemp(path.join(tmpdir(), "eos-publish-roots-"));
  tempDirs.push(watchDir);
  const walFile = path.join(watchDir, "database.db-wal");
  await writeFile(walFile, "seed", "utf8");

  const stateDir = await mkdtemp(path.join(tmpdir(), "eos-publish-state-"));
  tempDirs.push(stateDir);

  let clock = 1_700_000_000_000;
  const recorded = [];
  const watcher = createSessionLogWatcher({
    vaultDir: config.vaultDir,
    listConsents: async () => vault.list("HostObservationConsent"),
    record: async (payload) => {
      const result = await recordHostObservation(vault, payload);
      recorded.push(result.eventName);
      return result;
    },
    secretRoot,
    roots: { [host]: [walFile] },
    agentbarStateDir: stateDir,
    now: () => clock
  });
  return {
    watcher,
    stateDir,
    walFile,
    getRecorded: () => recorded,
    advance: (ms) => { clock += ms; },
    seconds: () => Math.floor(clock / 1000)
  };
}

async function listStateFiles(stateDir) {
  return (await readdir(stateDir)).filter((name) => name.endsWith(".json"));
}

describe("EOS session-log watcher · AgentBar protocol publishing", () => {
  it("publishes hookless-host sessions to state.d and removes them on session end", async () => {
    const { watcher, stateDir, walFile, getRecorded, advance, seconds } = await fixture();

    await watcher.tick();
    assert.deepEqual(getRecorded(), []);
    assert.deepEqual(await listStateFiles(stateDir), []);

    await appendFile(walFile, "turn-1", "utf8");
    await watcher.tick();
    assert.deepEqual(getRecorded(), ["SessionStart"]);

    const files = await listStateFiles(stateDir);
    assert.equal(files.length, 1);
    const published = JSON.parse(await readFile(path.join(stateDir, files[0]), "utf8"));
    assert.equal(published.agent, "trae");
    assert.equal(published.state, "tool");
    assert.equal(published.started, true);
    assert.equal(published.pid, process.pid);
    assert.equal(published.ts, seconds());
    assert.match(published.sessionId, /^watch\./);
    assert.equal(`${published.sessionId}.json`, files[0]);

    advance(61_000);
    await appendFile(walFile, "more", "utf8");
    await watcher.tick();
    assert.deepEqual(getRecorded(), ["SessionStart", "PostToolUse"]);
    const refreshed = JSON.parse(await readFile(path.join(stateDir, files[0]), "utf8"));
    assert.equal(refreshed.ts, seconds());

    advance(46_000);
    await watcher.tick();
    assert.deepEqual(getRecorded(), ["SessionStart", "PostToolUse", "SessionEnd"]);
    assert.deepEqual(await listStateFiles(stateDir), []);
  });

  it("does not publish hosts outside the hookless allowlist", async () => {
    const { watcher, stateDir, walFile, getRecorded } = await fixture({ host: "claude" });

    await watcher.tick();
    await appendFile(walFile, "turn-1", "utf8");
    await watcher.tick();
    assert.deepEqual(getRecorded(), ["SessionStart"]);
    assert.deepEqual(await listStateFiles(stateDir), []);
  });

  it("cleans up published files on stop()", async () => {
    const { watcher, stateDir, walFile } = await fixture();

    await watcher.tick();
    await appendFile(walFile, "turn-1", "utf8");
    await watcher.tick();
    assert.equal((await listStateFiles(stateDir)).length, 1);

    await watcher.stop();
    assert.deepEqual(await listStateFiles(stateDir), []);
  });

  it("sweeps orphan publishes left by dead processes on start()", async () => {
    const { watcher, stateDir, walFile } = await fixture();

    await writeFile(path.join(stateDir, "watch.9999999999999.json"), JSON.stringify({
      agent: "trae",
      state: "tool",
      label: "EOS session-log watcher",
      pid: 999999999,
      started: true,
      ts: 1
    }), "utf8");
    await writeFile(path.join(stateDir, "foreign.json"), JSON.stringify({
      agent: "codex",
      label: "someone else",
      pid: 999999999
    }), "utf8");

    await watcher.tick();
    await appendFile(walFile, "turn-1", "utf8");
    await watcher.tick();
    await watcher.start();
    await watcher.stop();

    const remaining = await listStateFiles(stateDir);
    assert.ok(remaining.includes("foreign.json"), "non-EOS files must be preserved");
    assert.ok(!remaining.some((name) => name.startsWith("watch.")), "orphan watch files must be swept");
  });
});
