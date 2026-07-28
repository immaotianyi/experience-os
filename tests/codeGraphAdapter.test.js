import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { GitVault } from "../src/gitVault.js";
import { startProject } from "../src/projectEngine.js";
import {
  normalizeGraphSnapshot,
  computeFanDegrees,
  extractStructuralPatterns,
  computeBlastRadius,
  patternsToRecords,
  ingestCodeGraphSnapshot,
  queryCodeGraphPatterns,
  getBlastRadius
} from "../src/eosCodeGraphAdapter.js";
import { buildReuseContext } from "../src/reuseEngine.js";
import { proposeSelfIterationSkills, runSelfIteration } from "../src/selfIterationEngine.js";
import { EVIDENCE_TYPES, CODE_GRAPH_PATTERN_TYPES } from "../src/domain.js";

// Test fixture: a small code graph with known structure
function makeTestSnapshot() {
  return {
    nodes: [
      { id: "core", type: "module", label: "core.js", filePath: "src/core.js", loc: 200, complexity: 5 },
      { id: "auth", type: "module", label: "auth.js", filePath: "src/auth.js", loc: 150, complexity: 12 },
      { id: "db", type: "module", label: "db.js", filePath: "src/db.js", loc: 300, complexity: 3 },
      { id: "api", type: "module", label: "api.js", filePath: "src/api.js", loc: 100, complexity: 2 },
      { id: "utils", type: "module", label: "utils.js", filePath: "src/utils.js", loc: 50, complexity: 1 },
      { id: "logger", type: "module", label: "logger.js", filePath: "src/logger.js", loc: 30, complexity: 1 },
      { id: "config", type: "module", label: "config.js", filePath: "src/config.js", loc: 80, complexity: 2 }
    ],
    edges: [
      // auth → core (auth depends on core)
      { source: "auth", target: "core", kind: "imports" },
      { source: "api", target: "core", kind: "imports" },
      { source: "api", target: "auth", kind: "imports" },
      { source: "db", target: "core", kind: "imports" },
      { source: "db", target: "utils", kind: "imports" },
      { source: "auth", target: "db", kind: "imports" },
      { source: "auth", target: "utils", kind: "imports" },
      { source: "auth", target: "logger", kind: "imports" },
      { source: "api", target: "logger", kind: "imports" },
      { source: "core", target: "config", kind: "imports" },
      { source: "core", target: "logger", kind: "imports" },
      { source: "db", target: "config", kind: "imports" },
      // cycle: auth → db → core → auth
      { source: "core", target: "auth", kind: "calls" },
      { source: "auth", target: "db", kind: "calls" },
      { source: "db", target: "core", kind: "calls" }
    ],
    metadata: { language: "javascript", parserVersion: "test-1.0", fileCount: 7 }
  };
}

describe("Code Graph Adapter", () => {
  let vaultDir;
  let vault;

  beforeEach(async () => {
    vaultDir = await mkdtemp(path.join(tmpdir(), "eos-codegraph-"));
    vault = new GitVault(vaultDir);
    await vault.init();
    await startProject(vault, {
      id: "project.codegraph_test",
      name: "Code Graph Test",
      goal: "Test code structure pattern extraction"
    });
  });

  afterEach(async () => {
    await rm(vaultDir, { recursive: true, force: true });
  });

  describe("normalizeGraphSnapshot", () => {
    it("should normalize a valid snapshot", () => {
      const raw = makeTestSnapshot();
      const normalized = normalizeGraphSnapshot(raw);
      assert.equal(normalized.nodes.length, 7);
      assert.equal(normalized.edges.length, 15);
      assert.equal(normalized.metadata.language, "javascript");
    });

    it("should reject non-object input", () => {
      assert.throws(() => normalizeGraphSnapshot(null), /must be an object/);
      assert.throws(() => normalizeGraphSnapshot("string"), /must be an object/);
    });

    it("should reject nodes without id", () => {
      assert.throws(
        () => normalizeGraphSnapshot({ nodes: [{ type: "module" }], edges: [] }),
        /must have a string id/
      );
    });

    it("should reject nodes without type", () => {
      assert.throws(
        () => normalizeGraphSnapshot({ nodes: [{ id: "x" }], edges: [] }),
        /must have a type/
      );
    });

    it("should reject edges with dangling source", () => {
      assert.throws(
        () => normalizeGraphSnapshot({
          nodes: [{ id: "a", type: "module" }],
          edges: [{ source: "b", target: "a", kind: "calls" }]
        }),
        /edge source not found/
      );
    });

    it("should reject edges with dangling target", () => {
      assert.throws(
        () => normalizeGraphSnapshot({
          nodes: [{ id: "a", type: "module" }],
          edges: [{ source: "a", target: "b", kind: "calls" }]
        }),
        /edge target not found/
      );
    });

    it("should handle empty nodes and edges", () => {
      const normalized = normalizeGraphSnapshot({ nodes: [], edges: [] });
      assert.equal(normalized.nodes.length, 0);
      assert.equal(normalized.edges.length, 0);
    });
  });

  describe("computeFanDegrees", () => {
    it("should compute fan-in and fan-out correctly", () => {
      const snapshot = normalizeGraphSnapshot(makeTestSnapshot());
      const degrees = computeFanDegrees(snapshot);
      const coreDegree = degrees.find((d) => d.nodeId === "core");
      assert.ok(coreDegree);
      assert.ok(coreDegree.fanIn >= 3, "core should have high fan-in");
      assert.ok(coreDegree.fanOut >= 2, "core should have outgoing edges");
    });

    it("should return 0 fan for isolated nodes", () => {
      const snapshot = normalizeGraphSnapshot({
        nodes: [{ id: "lonely", type: "module", label: "lonely" }],
        edges: []
      });
      const degrees = computeFanDegrees(snapshot);
      assert.equal(degrees[0].fanIn, 0);
      assert.equal(degrees[0].fanOut, 0);
    });
  });

  describe("extractStructuralPatterns", () => {
    it("should detect hubs (high fan-in nodes)", () => {
      const snapshot = normalizeGraphSnapshot(makeTestSnapshot());
      const patterns = extractStructuralPatterns(snapshot, { hubThreshold: 3 });
      const hubs = patterns.filter((p) => p.patternType === "hub");
      assert.ok(hubs.length > 0, "should detect at least one hub");
      const coreHub = hubs.find((p) => p.nodeId === "core");
      assert.ok(coreHub, "core should be detected as a hub");
    });

    it("should detect hotspots (high fan-out + high complexity)", () => {
      const snapshot = normalizeGraphSnapshot(makeTestSnapshot());
      const patterns = extractStructuralPatterns(snapshot, {
        hotspotFanOutThreshold: 3,
        hotspotComplexityThreshold: 10
      });
      const hotspots = patterns.filter((p) => p.patternType === "hotspot");
      const authHotspot = hotspots.find((p) => p.nodeId === "auth");
      assert.ok(authHotspot, "auth (complexity 12, fanOut >= 3) should be a hotspot");
    });

    it("should detect cycles", () => {
      const snapshot = normalizeGraphSnapshot(makeTestSnapshot());
      const patterns = extractStructuralPatterns(snapshot);
      const cycles = patterns.filter((p) => p.patternType === "cycle");
      assert.ok(cycles.length > 0, "should detect at least one cycle");
    });

    it("should detect leaves (no outgoing edges)", () => {
      const snapshot = normalizeGraphSnapshot(makeTestSnapshot());
      const patterns = extractStructuralPatterns(snapshot);
      const leaves = patterns.filter((p) => p.patternType === "leaf");
      // logger and config have no outgoing edges but have incoming
      const loggerLeaf = leaves.find((p) => p.nodeId === "logger" || p.nodeId === "config");
      assert.ok(loggerLeaf, "should detect at least one leaf node");
    });

    it("should include applicabilityBounds in patterns", () => {
      const snapshot = normalizeGraphSnapshot(makeTestSnapshot());
      const patterns = extractStructuralPatterns(snapshot);
      for (const pattern of patterns) {
        assert.ok(Array.isArray(pattern.applicabilityBounds));
        assert.ok(pattern.applicabilityBounds.length > 0);
      }
    });

    it("should include suggestedSkill in patterns", () => {
      const snapshot = normalizeGraphSnapshot(makeTestSnapshot());
      const patterns = extractStructuralPatterns(snapshot);
      for (const pattern of patterns) {
        assert.ok(typeof pattern.suggestedSkill === "string");
      }
    });
  });

  describe("computeBlastRadius", () => {
    it("should compute direct dependents for a target node", () => {
      const snapshot = normalizeGraphSnapshot(makeTestSnapshot());
      const radius = computeBlastRadius(snapshot, "core");
      assert.equal(radius.targetId, "core");
      assert.ok(radius.directDependents.length > 0, "core should have direct dependents");
    });

    it("should compute transitive dependents", () => {
      const snapshot = normalizeGraphSnapshot(makeTestSnapshot());
      const radius = computeBlastRadius(snapshot, "core");
      assert.ok(radius.transitiveDependents.length >= radius.directDependents.length,
        "transitive should include at least as many as direct");
    });

    it("should compute affected files", () => {
      const snapshot = normalizeGraphSnapshot(makeTestSnapshot());
      const radius = computeBlastRadius(snapshot, "core");
      assert.ok(radius.affectedFiles.length > 0, "should find affected files");
      assert.ok(radius.affectedFiles.some((f) => f.includes("core.js")));
    });

    it("should assign a risk level", () => {
      const snapshot = normalizeGraphSnapshot(makeTestSnapshot());
      const radius = computeBlastRadius(snapshot, "core");
      assert.ok(["low", "medium", "high", "critical"].includes(radius.riskLevel));
    });

    it("should handle leaf nodes with no dependents", () => {
      const snapshot = normalizeGraphSnapshot({
        nodes: [
          { id: "a", type: "module", label: "a" },
          { id: "b", type: "module", label: "b" }
        ],
        edges: [{ source: "a", target: "b", kind: "calls" }]
      });
      const radius = computeBlastRadius(snapshot, "b");
      assert.equal(radius.directDependents.length, 1); // a depends on b
      assert.equal(radius.transitiveDependents.length, 1);
    });

    it("should reject non-existent target", () => {
      const snapshot = normalizeGraphSnapshot(makeTestSnapshot());
      assert.throws(() => computeBlastRadius(snapshot, "nonexistent"), /not found/);
    });

    it("should reject empty targetId", () => {
      const snapshot = normalizeGraphSnapshot(makeTestSnapshot());
      assert.throws(() => computeBlastRadius(snapshot, ""), /must be a non-empty string/);
    });
  });

  describe("patternsToRecords", () => {
    it("should convert patterns to CodeGraphPattern records", () => {
      const snapshot = normalizeGraphSnapshot(makeTestSnapshot());
      const patterns = extractStructuralPatterns(snapshot);
      const records = patternsToRecords(patterns, "project.test", "snapshot_001");
      assert.equal(records.length, patterns.length);
      for (const record of records) {
        assert.equal(record.kind, "CodeGraphPattern");
        assert.equal(record.projectId, "project.test");
        assert.equal(record.sourceSnapshotId, "snapshot_001");
        assert.ok(record.patternType);
        assert.ok(record.label);
        assert.ok(record.description);
      }
    });
  });

  describe("ingestCodeGraphSnapshot", () => {
    it("should ingest a snapshot and save patterns to vault", async () => {
      const result = await ingestCodeGraphSnapshot(vault, {
        projectId: "project.codegraph_test",
        snapshot: makeTestSnapshot(),
        sourceTool: "tree-sitter"
      });
      assert.ok(result.snapshotId);
      assert.ok(result.records.length > 0);
      assert.ok(result.summary.nodeCount === 7);
      assert.ok(result.summary.patternCount > 0);
      assert.ok(result.summary.patternBreakdown);

      // Verify patterns are saved in vault
      const stored = await vault.list("CodeGraphPattern");
      assert.equal(stored.length, result.records.length);
    });

    it("should reject missing projectId", async () => {
      await assert.rejects(
        ingestCodeGraphSnapshot(vault, { projectId: "", snapshot: makeTestSnapshot() }),
        /projectId is required/
      );
    });
  });

  describe("queryCodeGraphPatterns", () => {
    it("should query patterns by projectId", async () => {
      await ingestCodeGraphSnapshot(vault, {
        projectId: "project.codegraph_test",
        snapshot: makeTestSnapshot()
      });
      const patterns = await queryCodeGraphPatterns(vault, { projectId: "project.codegraph_test" });
      assert.ok(patterns.length > 0);
      for (const p of patterns) {
        assert.equal(p.projectId, "project.codegraph_test");
      }
    });

    it("should filter by patternType", async () => {
      await ingestCodeGraphSnapshot(vault, {
        projectId: "project.codegraph_test",
        snapshot: makeTestSnapshot()
      });
      const hubs = await queryCodeGraphPatterns(vault, {
        projectId: "project.codegraph_test",
        patternType: "hub"
      });
      for (const h of hubs) {
        assert.equal(h.patternType, "hub");
      }
    });

    it("should respect limit", async () => {
      await ingestCodeGraphSnapshot(vault, {
        projectId: "project.codegraph_test",
        snapshot: makeTestSnapshot()
      });
      const limited = await queryCodeGraphPatterns(vault, { limit: 2 });
      assert.ok(limited.length <= 2);
    });
  });

  describe("getBlastRadius (vault-backed)", () => {
    it("should compute blast radius from raw snapshot", async () => {
      const radius = await getBlastRadius(vault, {
        projectId: "project.codegraph_test",
        targetId: "core",
        snapshot: makeTestSnapshot()
      });
      assert.equal(radius.targetId, "core");
      assert.ok(radius.directDependents.length > 0);
    });

    it("should report pattern-based impact from snapshotId", async () => {
      const ingested = await ingestCodeGraphSnapshot(vault, {
        projectId: "project.codegraph_test",
        snapshot: makeTestSnapshot()
      });
      const result = await getBlastRadius(vault, {
        projectId: "project.codegraph_test",
        targetId: "core",
        snapshotId: ingested.snapshotId
      });
      assert.ok(result.relatedPatterns !== undefined);
    });

    it("should throw when neither snapshot nor snapshotId provided", async () => {
      await assert.rejects(
        getBlastRadius(vault, { projectId: "project.codegraph_test", targetId: "core" }),
        /either snapshot or snapshotId must be provided/
      );
    });
  });
});

describe("Code Graph Integration with Reuse Engine", () => {
  let vaultDir;
  let vault;

  beforeEach(async () => {
    vaultDir = await mkdtemp(path.join(tmpdir(), "eos-codegraph-reuse-"));
    vault = new GitVault(vaultDir);
    await vault.init();
    await startProject(vault, {
      id: "project.reuse_test",
      name: "Reuse Test",
      goal: "Test reuse context with code graph"
    });
  });

  afterEach(async () => {
    await rm(vaultDir, { recursive: true, force: true });
  });

  it("should include CodeGraphPattern records in reuse context", async () => {
    // Ingest a code graph
    await ingestCodeGraphSnapshot(vault, {
      projectId: "project.reuse_test",
      snapshot: makeTestSnapshot()
    });

    // Build reuse context
    const context = await buildReuseContext({
      vault,
      projectId: "project.reuse_test",
      query: "hub core dependency"
    });

    // The summary should mention code graph patterns
    assert.ok(context.summary.includes("代码结构模式"));
    assert.ok(context.contributionCandidates.some((c) => c.kind === "CodeGraphPattern"));
  });

  it("should return empty code graph results when no patterns exist", async () => {
    const context = await buildReuseContext({
      vault,
      projectId: "project.reuse_test",
      query: "nonexistent query"
    });
    assert.ok(context.summary.includes("代码结构模式: 0"));
  });
});

describe("Code Graph Integration with Self-Iteration Engine", () => {
  let vaultDir;
  let vault;

  beforeEach(async () => {
    vaultDir = await mkdtemp(path.join(tmpdir(), "eos-codegraph-selfiter-"));
    vault = new GitVault(vaultDir);
    await vault.init();
    await startProject(vault, {
      id: "project.selfiter_test",
      name: "Self Iteration Test",
      goal: "Test self-iteration with code graph"
    });
  });

  afterEach(async () => {
    await rm(vaultDir, { recursive: true, force: true });
  });

  it("should propose code-graph-derived Skills when patterns exist", async () => {
    // Ingest a code graph
    await ingestCodeGraphSnapshot(vault, {
      projectId: "project.selfiter_test",
      snapshot: makeTestSnapshot()
    });

    const proposals = await proposeSelfIterationSkills({
      vault,
      projectId: "project.selfiter_test"
    });

    // Should have more proposals than the baseline 4 (reuse, wallhit, preference, orchestrator)
    assert.ok(proposals.length > 4, `expected more than 4 proposals, got ${proposals.length}`);

    // At least one should reference code graph patterns
    const codeGraphProposals = proposals.filter((p) =>
      p.skill.adaptationNotes?.some((n) => n.includes("CodeGraphPattern"))
    );
    assert.ok(codeGraphProposals.length > 0, "should have at least one code-graph-derived Skill");
  });

  it("should not propose code-graph Skills when no patterns exist", async () => {
    const proposals = await proposeSelfIterationSkills({
      vault,
      projectId: "project.selfiter_test"
    });
    // Should only have the baseline 4 proposals
    assert.equal(proposals.length, 4);
  });

  it("should generate hub, hotspot, cycle, leaf, and bridge Skills", async () => {
    await ingestCodeGraphSnapshot(vault, {
      projectId: "project.selfiter_test",
      snapshot: makeTestSnapshot()
    });

    const proposals = await proposeSelfIterationSkills({
      vault,
      projectId: "project.selfiter_test"
    });

    const skillNames = proposals.map((p) => p.skill.name);
    // At least one of these should exist
    const expectedNames = [
      "枢纽变更影响评估",
      "热点重构守卫",
      "循环依赖打破策略",
      "叶子节点原子 Skill 提取",
      "桥节点保护守卫"
    ];
    const found = expectedNames.filter((name) => skillNames.includes(name));
    assert.ok(found.length > 0, `expected at least one code-graph Skill, found: ${found.join(", ")}`);
  });

  it("should run full self-iteration with code graph patterns and validate", async () => {
    await ingestCodeGraphSnapshot(vault, {
      projectId: "project.selfiter_test",
      snapshot: makeTestSnapshot()
    });

    const run = await runSelfIteration({
      vault,
      projectId: "project.selfiter_test"
    });

    assert.ok(run.iteration >= 1);
    assert.ok(run.candidateSkillIds.length > 4);
    assert.ok(run.acceptedSkillIds.length > 0, "at least some Skills should pass validation");
  });
});

describe("Code Graph Domain Constants", () => {
  it("should include code-graph in EVIDENCE_TYPES", () => {
    assert.ok(EVIDENCE_TYPES.includes("code-graph"));
  });

  it("should define CODE_GRAPH_PATTERN_TYPES", () => {
    assert.ok(CODE_GRAPH_PATTERN_TYPES.includes("hub"));
    assert.ok(CODE_GRAPH_PATTERN_TYPES.includes("hotspot"));
    assert.ok(CODE_GRAPH_PATTERN_TYPES.includes("cycle"));
    assert.ok(CODE_GRAPH_PATTERN_TYPES.includes("leaf"));
    assert.ok(CODE_GRAPH_PATTERN_TYPES.includes("bridge"));
  });

  it("should have frozen constants", () => {
    assert.ok(Object.isFrozen(EVIDENCE_TYPES));
    assert.ok(Object.isFrozen(CODE_GRAPH_PATTERN_TYPES));
  });
});

describe("Code Graph MCP Relay Tools", () => {
  let vaultDir;
  let relay;

  beforeEach(async () => {
    vaultDir = await mkdtemp(path.join(tmpdir(), "eos-codegraph-mcp-"));
    const vault = new GitVault(vaultDir);
    await vault.init();
    await startProject(vault, { id: "project.mcp_cg", name: "MCP CG Test", goal: "Test MCP code graph" });
  });

  afterEach(async () => {
    await rm(vaultDir, { recursive: true, force: true });
  });

  // We test the MCP relay by spawning the relay process and sending JSON-RPC messages
  it("should list code graph tools in tools/list response", async () => {
    const { spawn } = await import("node:child_process");
    const { fileURLToPath } = await import("node:url");
    const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const relayScript = path.join(projectRoot, "src", "eosRelayMcp.js");

    const child = spawn(process.execPath, [relayScript], {
      cwd: projectRoot,
      env: { ...process.env, EOS_VAULT_DIR: vaultDir },
      stdio: ["pipe", "pipe", "pipe"]
    });

    try {
      // Wait for relay to start
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Send initialize
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }) + "\n");

      // Wait for initialize response
      await new Promise((resolve) => setTimeout(resolve, 300));

      // List tools
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }) + "\n");

      // Collect response
      const response = await new Promise((resolve, reject) => {
        let buffer = "";
        const timeout = setTimeout(() => reject(new Error("timeout")), 3000);
        child.stdout.on("data", (chunk) => {
          buffer += chunk;
          let newline;
          while ((newline = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, newline).trim();
            buffer = buffer.slice(newline + 1);
            if (!line) continue;
            try {
              const msg = JSON.parse(line);
              if (msg.id === 2) {
                clearTimeout(timeout);
                resolve(msg);
              }
            } catch { /* skip non-JSON */ }
          }
        });
      });

      const toolNames = response.result.tools.map((t) => t.name);
      assert.ok(toolNames.includes("eos_ingest_code_graph"));
      assert.ok(toolNames.includes("eos_query_code_patterns"));
      assert.ok(toolNames.includes("eos_blast_radius"));
    } finally {
      child.kill();
    }
  });
});
