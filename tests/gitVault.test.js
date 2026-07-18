/**
 * Test suite for gitVault.js — Git integration, history, revert.
 * Uses a temporary directory for isolation.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { GitVault } from "../src/gitVault.js";
import { createProject, createWallHit, createSkillCandidate, SKILL_LEVELS } from "../src/domain.js";

let tempDir;

before(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "eos-git-test-"));
});

after(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("GitVault", () => {
  it("initializes git repository on first init", async () => {
    const v = new GitVault(tempDir);
    await v.init();
    const stats = v.stats();
    assert.equal(stats.enabled, true);
    assert.ok(stats.totalCommits >= 1);
  });

  it("auto-commits on save", async () => {
    const v = new GitVault(tempDir);
    await v.init();
    const before = v.stats().totalCommits;

    const p = createProject({ id: "project.git_test_auto", name: "Auto", goal: "G" });
    await v.save(p);

    const after = v.stats().totalCommits;
    assert.ok(after > before, `commits should increase: ${before} -> ${after}`);
  });

  it("history returns commits for a saved record", async () => {
    const v = new GitVault(tempDir);
    await v.init();

    const w = createWallHit({
      id: "wallhit.git_history_test",
      projectId: "project.git_test_auto",
      wallType: "schema_missing",
      stage: "PRODUCTION_VALIDATING",
      message: "test history",
      blockedBy: [],
      suggestedFixes: []
    });
    await v.save(w);

    const history = v.history(w.id);
    assert.ok(history.length > 0);
    assert.ok(history[0].hash);
    assert.ok(history[0].message.includes("WallHit"));
    assert.ok(history[0].date);
    assert.ok(history[0].author);
  });

  it("loadAtCommit retrieves record at specific commit", async () => {
    const v = new GitVault(tempDir);
    await v.init();

    const w = createWallHit({
      id: "wallhit.git_loadcommit_test",
      projectId: "project.git_test_auto",
      wallType: "trigger_unstable",
      stage: "PRODUCTION_VALIDATING",
      message: "original message",
      blockedBy: [],
      suggestedFixes: []
    });
    await v.save(w);

    const history = v.history(w.id);
    assert.ok(history.length > 0);

    const record = await v.loadAtCommit(w.id, history[0].hash);
    assert.equal(record.id, w.id);
    assert.equal(record.message, "original message");
  });

  it("revert restores old content", async () => {
    const v = new GitVault(tempDir);
    await v.init();

    // Create and save
    const w = createWallHit({
      id: "wallhit.git_revert_test",
      projectId: "project.git_test_auto",
      wallType: "fallback_missing",
      stage: "PRODUCTION_VALIDATING",
      message: "before revert",
      blockedBy: [],
      suggestedFixes: []
    });
    await v.save(w);

    const history = v.history(w.id);
    const originalHash = history[0].hash;

    // Modify and save
    w.message = "after revert";
    w.updatedAt = new Date().toISOString();
    await v.save(w);

    // Verify modified
    const modified = await v.load("WallHit", w.id);
    assert.equal(modified.message, "after revert");

    // Revert
    const reverted = await v.revert(w.id, originalHash);
    assert.equal(reverted.message, "before revert");

    // Verify reverted in storage
    const final = await v.load("WallHit", w.id);
    assert.equal(final.message, "before revert");
  });

  it("history returns empty for non-existent record", async () => {
    const v = new GitVault(tempDir);
    await v.init();
    const history = v.history("nonexistent.record.12345");
    assert.deepEqual(history, []);
  });

  it("stats reports dirty status correctly", async () => {
    const v = new GitVault(tempDir);
    await v.init();
    const stats = v.stats();
    assert.equal(stats.dirty, false); // Should be clean after commits
  });

  it("save and load round-trips through GitVault", async () => {
    const v = new GitVault(tempDir);
    await v.init();

    const s = createSkillCandidate({
      id: "skill.git_roundtrip_test",
      projectId: "project.git_test_auto",
      name: "Roundtrip Skill",
      origin: "test",
      trigger: { intent: "test", signals: ["s"] },
      inputSchema: { type: "object" },
      outputSchema: { type: "object" },
      safetyLevel: "L1",
      fallback: "f",
      humanConfirmationRequired: true
    });
    await v.save(s);

    const loaded = await v.load("Skill", s.id);
    assert.equal(loaded.id, s.id);
    assert.equal(loaded.name, "Roundtrip Skill");
  });

  it("list works through GitVault", async () => {
    const v = new GitVault(tempDir);
    await v.init();

    const list = await v.list("Project");
    assert.ok(list.some((p) => p.id === "project.git_test_auto"));
  });

  it("search works through GitVault", async () => {
    const v = new GitVault(tempDir);
    await v.init();

    const results = await v.search({ query: "Auto", limit: 5 });
    assert.ok(results.some((r) => r.record.id === "project.git_test_auto"));
  });

  it("serializes parallel writes from separate GitVault instances", async () => {
    const first = new GitVault(tempDir);
    const second = new GitVault(tempDir);
    await first.init();
    await second.init();

    const left = createProject({ id: "project.parallel_left", name: "Left", goal: "g" });
    const right = createProject({ id: "project.parallel_right", name: "Right", goal: "g" });
    await Promise.all([first.save(left), second.save(right)]);

    assert.equal((await first.load("Project", left.id)).name, "Left");
    assert.equal((await second.load("Project", right.id)).name, "Right");
    assert.equal(first.stats().dirty, false);
  });
});
