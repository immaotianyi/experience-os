/**
 * Test suite for vault.js — save, load, list, search, corrupt file handling.
 * Uses a temporary directory for isolation.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { Vault } from "../src/vault.js";
import { createProject, createSkillCandidate, createWallHit } from "../src/domain.js";

let tempDir;

before(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "eos-test-"));
});

after(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("Vault", () => {
  it("init creates all collection directories", async () => {
    const v = new Vault(tempDir);
    await v.init();
    // Saving to each collection should not throw
    const p = createProject({ id: "project.test1", name: "T", goal: "G" });
    await v.save(p);
  });

  it("save and load round-trips a record", async () => {
    const v = new Vault(tempDir);
    await v.init();
    const p = createProject({ id: "project.roundtrip", name: "RT", goal: "G" });
    await v.save(p);
    const loaded = await v.load("Project", p.id);
    assert.equal(loaded.id, p.id);
    assert.equal(loaded.name, "RT");
  });

  it("list returns all records of a kind", async () => {
    const v = new Vault(tempDir);
    await v.init();
    const p1 = createProject({ id: "project.list1", name: "L1", goal: "G" });
    const p2 = createProject({ id: "project.list2", name: "L2", goal: "G" });
    await v.save(p1);
    await v.save(p2);
    const list = await v.list("Project");
    const ids = list.map((r) => r.id);
    assert.ok(ids.includes("project.list1"));
    assert.ok(ids.includes("project.list2"));
  });

  it("list handles missing directory gracefully", async () => {
    const v = new Vault(path.join(tempDir, "nonexistent"));
    const list = await v.list("Project");
    assert.deepEqual(list, []);
  });

  it("list with collectSkipped isolates corrupt files", async () => {
    const v = new Vault(tempDir);
    await v.init();
    // Write a corrupt JSON file directly
    const corruptPath = path.join(tempDir, "projects", "corrupt.json");
    await writeFile(corruptPath, "{ broken json", "utf8");

    const result = await v.list("Project", { collectSkipped: true });
    assert.ok(result.skipped.some((s) => s.file.includes("corrupt")));
    assert.ok(result.records.length > 0);
  });

  it("search matches by query terms", async () => {
    const v = new Vault(tempDir);
    await v.init();
    const s = createSkillCandidate({
      id: "skill.searchtest.unique",
      projectId: "p1", name: "SearchableSkill", origin: "test",
      trigger: { intent: "search_test", signals: ["s"] },
      inputSchema: {}, outputSchema: {},
      safetyLevel: "L1", fallback: "f", humanConfirmationRequired: true
    });
    await v.save(s);

    const results = await v.search({ query: "SearchableSkill", limit: 5 });
    assert.ok(results.some((r) => r.record.id === s.id));
  });

  it("search returns empty for no matches", async () => {
    const v = new Vault(tempDir);
    const results = await v.search({ query: "zzznomatchzzz12345", limit: 5 });
    assert.equal(results.length, 0);
  });

  it("fileFor throws for unknown kind", () => {
    const v = new Vault(tempDir);
    assert.throws(() => v.fileFor({ kind: "Unknown", id: "x" }), /Unsupported/);
  });

  it("load throws for unknown kind", async () => {
    const v = new Vault(tempDir);
    await assert.rejects(() => v.load("Unknown", "x"), /Unsupported/);
  });
});

describe("Vault with multiple kinds", () => {
  it("listAll aggregates all collections", async () => {
    const v = new Vault(tempDir);
    await v.init();

    const p = createProject({ id: "project.multi", name: "M", goal: "G" });
    const w = createWallHit({
      id: "wallhit.multi1", projectId: "project.multi",
      wallType: "schema_missing", stage: "S", message: "m",
      blockedBy: [], suggestedFixes: []
    });
    await v.save(p);
    await v.save(w);

    const all = await v.listAll();
    const ids = all.map((r) => r.id);
    assert.ok(ids.includes("project.multi"));
    assert.ok(ids.includes("wallhit.multi1"));
  });
});
