import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile, appendFile } from "node:fs/promises";
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

async function fixture() {
  const workspaceDir = await mkdtemp(path.join(tmpdir(), "eos-watcher-"));
  tempDirs.push(workspaceDir);
  const config = await bootstrapWorkspace({ workspaceDir, name: "Watcher test" });
  const vault = new GitVault(config.vaultDir);
  const project = (await vault.list("Project"))[0];
  const consent = await approveHostObservationConsent(vault, {
    projectId: project.id,
    host: "trae",
    approvedBy: "test-user",
    metadataOnlyAcknowledged: true
  });

  const secretRoot = await mkdtemp(path.join(tmpdir(), "eos-watcher-secrets-"));
  tempDirs.push(secretRoot);
  const workspaceHash = createHash("sha256").update(path.resolve(workspaceDir)).digest("hex").slice(0, 24);
  const tokenDir = path.join(secretRoot, workspaceHash);
  await mkdir(tokenDir, { recursive: true });
  await writeFile(path.join(tokenDir, "trae.token"), consent.captureToken, { encoding: "utf8", mode: 0o600 });

  const watchDir = await mkdtemp(path.join(tmpdir(), "eos-watcher-roots-"));
  tempDirs.push(watchDir);
  const walFile = path.join(watchDir, "database.db-wal");
  await writeFile(walFile, "seed", "utf8");

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
    roots: { trae: [walFile] },
    now: () => clock
  });
  return { watcher, vault, walFile, getRecorded: () => recorded, advance: (ms) => { clock += ms; } };
}

describe("EOS unified session-log watcher", () => {
  it("derives session lifecycle from native log fingerprints without reading content", async () => {
    const { watcher, vault, walFile, getRecorded, advance } = await fixture();

    await watcher.tick();
    assert.deepEqual(getRecorded(), []);

    await appendFile(walFile, "turn-1", "utf8");
    await watcher.tick();
    assert.deepEqual(getRecorded(), ["SessionStart"]);

    advance(30_000);
    await appendFile(walFile, "more", "utf8");
    await watcher.tick();
    assert.deepEqual(getRecorded(), ["SessionStart"]);

    advance(35_000);
    await appendFile(walFile, "more", "utf8");
    await watcher.tick();
    assert.deepEqual(getRecorded(), ["SessionStart", "PostToolUse"]);

    advance(45_000);
    await watcher.tick();
    assert.deepEqual(getRecorded(), ["SessionStart", "PostToolUse", "SessionEnd"]);

    advance(10_000);
    await appendFile(walFile, "new-burst", "utf8");
    await watcher.tick();
    assert.deepEqual(getRecorded(), ["SessionStart", "PostToolUse", "SessionEnd", "SessionStart"]);

    const observations = await vault.list("HostObservation");
    assert.ok(observations.length >= 4);
    for (const observation of observations) {
      assert.match(observation.sessionHash, /^sha256:[a-f0-9]{64}$/);
      assert.equal(observation.host, "trae");
    }
    const starts = observations.filter((item) => item.eventName === "SessionStart");
    assert.equal(starts.length, 2);
    assert.notEqual(starts[0].sessionHash, starts[1].sessionHash);
  });

  it("stays silent when the host never becomes active", async () => {
    const { watcher, getRecorded, advance } = await fixture();
    await watcher.tick();
    advance(10 * 60_000);
    await watcher.tick();
    assert.deepEqual(getRecorded(), []);
  });

  it("does not emit when no credential exists for the host", async () => {
    const workspaceDir = await mkdtemp(path.join(tmpdir(), "eos-watcher-nocred-"));
    tempDirs.push(workspaceDir);
    const config = await bootstrapWorkspace({ workspaceDir, name: "No cred" });
    const watchDir = await mkdtemp(path.join(tmpdir(), "eos-watcher-roots-"));
    tempDirs.push(watchDir);
    const walFile = path.join(watchDir, "database.db-wal");
    await writeFile(walFile, "seed", "utf8");
    const recorded = [];
    const watcher = createSessionLogWatcher({
      vaultDir: config.vaultDir,
      listConsents: async () => [],
      record: async (payload) => {
        recorded.push(payload.observation.eventName);
      },
      secretRoot: path.join(workspaceDir, "secrets"),
      roots: { trae: [walFile] },
      now: () => 1_700_000_000_000
    });
    await watcher.tick();
    await appendFile(walFile, "activity", "utf8");
    await watcher.tick();
    assert.deepEqual(recorded, []);
  });
});
