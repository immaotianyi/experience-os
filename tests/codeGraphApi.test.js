import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { GitVault } from "../src/gitVault.js";
import { startProject } from "../src/projectEngine.js";
import { ingestCodeGraphSnapshot } from "../src/eosCodeGraphAdapter.js";

function makeTestSnapshot() {
  return {
    nodes: [
      { id: "auth", type: "function", label: "handleAuth", complexity: 12 },
      { id: "db", type: "function", label: "queryDatabase", complexity: 6 },
      { id: "cache", type: "function", label: "getCache", complexity: 3 },
      { id: "api", type: "function", label: "apiHandler", complexity: 8 },
      { id: "log", type: "function", label: "logEvent", complexity: 2 },
      { id: "config", type: "function", label: "loadConfig", complexity: 1 },
      { id: "util", type: "function", label: "formatDate", complexity: 1 }
    ],
    edges: [
      { source: "api", target: "auth", kind: "call" },
      { source: "api", target: "db", kind: "call" },
      { source: "api", target: "cache", kind: "call" },
      { source: "auth", target: "db", kind: "call" },
      { source: "auth", target: "log", kind: "call" },
      { source: "db", target: "log", kind: "call" },
      { source: "cache", target: "log", kind: "call" },
      { source: "auth", target: "config", kind: "call" },
      { source: "db", target: "config", kind: "call" }
    ],
    metadata: { language: "javascript", parserVersion: "1.0", fileCount: 7 }
  };
}

describe("Code Graph API Integration", () => {
  let vaultDir;
  let vault;

  beforeEach(async () => {
    vaultDir = await mkdtemp(path.join(tmpdir(), "eos-codegraph-api-"));
    vault = new GitVault(vaultDir);
    await vault.init();
    await startProject(vault, {
      id: "project.api_test",
      name: "API Test",
      goal: "Test code graph API endpoints"
    });
  });

  afterEach(async () => {
    await rm(vaultDir, { recursive: true, force: true });
  });

  it("should ingest a snapshot via ingestCodeGraphSnapshot and query patterns back", async () => {
    const result = await ingestCodeGraphSnapshot(vault, {
      projectId: "project.api_test",
      snapshot: makeTestSnapshot(),
      sourceTool: "tree-sitter"
    });

    assert.ok(result.snapshotId);
    assert.ok(result.records.length > 0);
    assert.equal(result.summary.nodeCount, 7);
    assert.equal(result.summary.edgeCount, 9);
    assert.ok(result.summary.patternCount > 0);

    // Verify patterns are stored and queryable
    const { queryCodeGraphPatterns } = await import("../src/eosCodeGraphAdapter.js");
    const patterns = await queryCodeGraphPatterns(vault, {
      projectId: "project.api_test",
      limit: 50
    });
    assert.ok(patterns.length > 0);

    // Verify pattern types are valid
    const validTypes = ["hub", "hotspot", "cycle", "leaf", "bridge"];
    for (const p of patterns) {
      assert.ok(validTypes.includes(p.patternType), `invalid pattern type: ${p.patternType}`);
      assert.ok(p.label, "pattern should have a label");
      assert.ok(p.description, "pattern should have a description");
      assert.ok(Array.isArray(p.applicabilityBounds), "pattern should have applicabilityBounds");
    }

    // Verify filtering by patternType
    const hubs = await queryCodeGraphPatterns(vault, {
      projectId: "project.api_test",
      patternType: "hub"
    });
    for (const h of hubs) {
      assert.equal(h.patternType, "hub");
    }
  });

  it("should compute blast radius for a target node", async () => {
    const { computeBlastRadius, normalizeGraphSnapshot } = await import("../src/eosCodeGraphAdapter.js");
    const normalized = normalizeGraphSnapshot(makeTestSnapshot());
    const result = computeBlastRadius(normalized, "auth");

    assert.equal(result.targetId, "auth");
    assert.ok(["low", "medium", "high", "critical"].includes(result.riskLevel));
    assert.ok(Array.isArray(result.directDependents));
    assert.ok(Array.isArray(result.transitiveDependents));
    assert.ok(Array.isArray(result.affectedFiles));
    // auth is called by api, so api should be in directDependents
    assert.ok(result.directDependents.some((d) => d.id === "api"));
  });

  it("should return empty patterns for non-existent project", async () => {
    const { queryCodeGraphPatterns } = await import("../src/eosCodeGraphAdapter.js");
    const patterns = await queryCodeGraphPatterns(vault, {
      projectId: "project.nonexistent"
    });
    assert.equal(patterns.length, 0);
  });

  it("should return all patterns when using wildcard projectId", async () => {
    await ingestCodeGraphSnapshot(vault, {
      projectId: "project.api_test",
      snapshot: makeTestSnapshot()
    });
    const { queryCodeGraphPatterns } = await import("../src/eosCodeGraphAdapter.js");
    const patterns = await queryCodeGraphPatterns(vault, { projectId: "*" });
    assert.ok(patterns.length > 0);
  });

  it("should reject invalid snapshot with missing nodes", async () => {
    await assert.rejects(
      () => ingestCodeGraphSnapshot(vault, {
        projectId: "project.api_test",
        snapshot: { edges: [{ source: "a", target: "b", kind: "call" }] }
      }),
      /nodes/
    );
  });

  it("should reject ingest without projectId", async () => {
    await assert.rejects(
      () => ingestCodeGraphSnapshot(vault, {
        projectId: "",
        snapshot: makeTestSnapshot()
      }),
      /projectId/
    );
  });
});
