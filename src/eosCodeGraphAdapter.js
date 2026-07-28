/**
 * Code Graph Adapter — connects EOS with code structure analysis.
 *
 * 方案C: 代码结构模式提取为 Skill
 *
 * This adapter bridges external code graph tools (AST parsers, call graph
 * analyzers, dependency mappers) into EOS's vault-backed record system.
 * It does NOT execute code or access network resources — it accepts
 * pre-parsed graph data and converts it into EOS-compatible records.
 *
 * Core responsibilities:
 *   1. Accept externally-parsed code graph snapshots (nodes + edges)
 *   2. Extract structural patterns (hotspots, hubs, fan-in/fan-out, cycles)
 *   3. Compute blast radius for a given change target
 *   4. Convert patterns into CodeGraphPattern vault records
 *   5. Provide queryable interface for reuse/self-iteration engines
 */

import { createCodeGraphPattern, nowIso } from "./domain.js";
import { safeIdSlug } from "./utils.js";
import { randomBytes } from "node:crypto";

/**
 * Validate and normalize a code graph snapshot.
 *
 * A snapshot is a frozen point-in-time view of a codebase's structure:
 *   - nodes: functions, classes, modules with their metadata
 *   - edges: call relationships, imports, inheritance
 *   - metadata: language, parser version, file count
 */
export function normalizeGraphSnapshot(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("graph snapshot must be an object");
  }
  const nodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  const edges = Array.isArray(raw.edges) ? raw.edges : [];
  const metadata = raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {};

  const nodeIds = new Set();
  for (const node of nodes) {
    if (!node.id || typeof node.id !== "string") {
      throw new Error("every graph node must have a string id");
    }
    if (nodeIds.has(node.id)) {
      throw new Error(`duplicate graph node id: ${node.id}`);
    }
    nodeIds.add(node.id);
    if (!node.type || typeof node.type !== "string") {
      throw new Error(`graph node ${node.id} must have a type (function|class|module|file)`);
    }
  }

  for (const edge of edges) {
    if (!edge.source || typeof edge.source !== "string") {
      throw new Error("every edge must have a string source node id");
    }
    if (!edge.target || typeof edge.target !== "string") {
      throw new Error("every edge must have a string target node id");
    }
    if (!edge.kind || typeof edge.kind !== "string") {
      throw new Error(`edge ${edge.source}→${edge.target} must have a kind (calls|imports|inherits|depends)`);
    }
    if (!nodeIds.has(edge.source)) {
      throw new Error(`edge source not found in nodes: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      throw new Error(`edge target not found in nodes: ${edge.target}`);
    }
  }

  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      label: typeof n.label === "string" ? n.label : n.id,
      filePath: typeof n.filePath === "string" ? n.filePath : null,
      loc: typeof n.loc === "number" ? n.loc : null,
      complexity: typeof n.complexity === "number" ? n.complexity : null
    })),
    edges: edges.map((e) => ({
      source: e.source,
      target: e.target,
      kind: e.kind,
      weight: typeof e.weight === "number" ? e.weight : 1
    })),
    metadata: {
      language: metadata.language || "unknown",
      parserVersion: metadata.parserVersion || "unknown",
      fileCount: typeof metadata.fileCount === "number" ? metadata.fileCount : nodes.length,
      capturedAt: metadata.capturedAt || nowIso()
    }
  };
}

/**
 * Build an adjacency map for fast lookup.
 * Returns { forward: Map<id, Set<target>>, reverse: Map<id, Set<source>> }
 */
function buildAdjacency(edges) {
  const forward = new Map();
  const reverse = new Map();
  for (const edge of edges) {
    if (!forward.has(edge.source)) forward.set(edge.source, new Set());
    forward.get(edge.source).add(edge.target);
    if (!reverse.has(edge.target)) reverse.set(edge.target, new Set());
    reverse.get(edge.target).add(edge.source);
  }
  return { forward, reverse };
}

/**
 * Compute fan-in and fan-out for every node.
 * High fan-out → potential coupling hotspot.
 * High fan-in → potential hub/dependency target.
 */
export function computeFanDegrees(snapshot) {
  const { forward, reverse } = buildAdjacency(snapshot.edges);
  return snapshot.nodes.map((node) => ({
    nodeId: node.id,
    label: node.label,
    type: node.type,
    fanOut: forward.get(node.id)?.size ?? 0,
    fanIn: reverse.get(node.id)?.size ?? 0,
    loc: node.loc,
    complexity: node.complexity
  }));
}

/**
 * Identify structural patterns worth extracting as Skills.
 *
 * Pattern types:
 *   - hub: high fan-in node that many modules depend on
 *   - hotspot: high fan-out + high complexity → fragile coupling
 *   - cycle: circular dependency chain
 *   - leaf: no outgoing edges → terminal utility/leaf logic
 *   - bridge: node connecting otherwise disconnected clusters
 */
export function extractStructuralPatterns(snapshot, options = {}) {
  const hubThreshold = options.hubThreshold ?? 5;
  const hotspotFanOutThreshold = options.hotspotFanOutThreshold ?? 4;
  const hotspotComplexityThreshold = options.hotspotComplexityThreshold ?? 8;
  const fanDegrees = computeFanDegrees(snapshot);
  const patterns = [];

  // Hubs: high fan-in, the center of gravity for many callers
  for (const degree of fanDegrees) {
    if (degree.fanIn >= hubThreshold) {
      patterns.push({
        patternType: "hub",
        nodeId: degree.nodeId,
        label: degree.label,
        metrics: { fanIn: degree.fanIn, fanOut: degree.fanOut },
        description: `${degree.label} 被 ${degree.fanIn} 个模块依赖，是核心枢纽节点`,
        applicabilityBounds: ["仅适用于该代码库的当前结构", "枢纽变更需评估全部调用方"],
        suggestedSkill: "hub_change_impact_assessment"
      });
    }
  }

  // Hotspots: high fan-out + high complexity → fragile coupling
  for (const degree of fanDegrees) {
    if (degree.fanOut >= hotspotFanOutThreshold && (degree.complexity ?? 0) >= hotspotComplexityThreshold) {
      patterns.push({
        patternType: "hotspot",
        nodeId: degree.nodeId,
        label: degree.label,
        metrics: { fanOut: degree.fanOut, complexity: degree.complexity },
        description: `${degree.label} 扇出 ${degree.fanOut} 且复杂度 ${degree.complexity}，是脆弱耦合点`,
        applicabilityBounds: ["修改前必须评估下游影响", "建议优先拆分或降复杂度"],
        suggestedSkill: "hotspot_refactor_guard"
      });
    }
  }

  // Cycles: circular dependency detection via DFS
  const cycles = detectCycles(snapshot);
  for (const cycle of cycles) {
    patterns.push({
      patternType: "cycle",
      nodeIds: cycle,
      label: cycle.join(" → ") + " → " + cycle[0],
      metrics: { cycleLength: cycle.length },
      description: `检测到循环依赖: ${cycle.join(" → ")}`,
      applicabilityBounds: ["循环依赖会阻碍独立编译和测试", "建议通过接口抽象或依赖注入打破环"],
      suggestedSkill: "cycle_break_strategy"
    });
  }

  // Leaves: terminal nodes with no outgoing edges
  for (const degree of fanDegrees) {
    if (degree.fanOut === 0 && degree.fanIn > 0) {
      patterns.push({
        patternType: "leaf",
        nodeId: degree.nodeId,
        label: degree.label,
        metrics: { fanIn: degree.fanIn, fanOut: 0 },
        description: `${degree.label} 是叶子节点（无下游调用），被 ${degree.fanIn} 处引用`,
        applicabilityBounds: ["叶子节点变更影响范围可控", "适合用于提取可复用原子 Skill"],
        suggestedSkill: "leaf_extract_to_atomic_skill"
      });
    }
  }

  // Bridges: nodes connecting two otherwise disconnected clusters
  const bridges = detectBridges(snapshot);
  for (const bridge of bridges) {
    patterns.push({
      patternType: "bridge",
      nodeId: bridge.nodeId,
      label: bridge.label,
      metrics: { clusterASize: bridge.clusterASize, clusterBSize: bridge.clusterBSize },
      description: `${bridge.label} 是连接两个独立子图的桥节点`,
      applicabilityBounds: ["桥节点是架构的关键路径", "移除或修改会切断模块间通信"],
      suggestedSkill: "bridge_protection_guard"
    });
  }

  return patterns;
}

/**
 * Detect circular dependencies using iterative DFS with color marking.
 * Returns an array of cycles, each cycle being an array of node ids.
 */
function detectCycles(snapshot) {
  // Filter self-referencing edges (A→A) — they are not real cycles
  const edges = snapshot.edges.filter((e) => e.source !== e.target);
  const { forward } = buildAdjacency(edges);
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();
  for (const node of snapshot.nodes) color.set(node.id, WHITE);

  const cycles = [];
  const maxCycles = 20; // safety limit

  function dfs(startNode) {
    if (cycles.length >= maxCycles) return;
    const stack = [{ nodeId: startNode, path: [startNode] }];
    const inStack = new Set([startNode]);

    while (stack.length > 0 && cycles.length < maxCycles) {
      const { nodeId, path } = stack[stack.length - 1];
      const neighbors = forward.get(nodeId);
      if (!neighbors) {
        stack.pop();
        inStack.delete(nodeId);
        color.set(nodeId, BLACK);
        continue;
      }

      let foundUnvisited = false;
      for (const next of neighbors) {
        if (inStack.has(next)) {
          // Found a cycle: extract from the path
          const cycleStart = path.indexOf(next);
          if (cycleStart >= 0 && cycleStart < path.length) {
            const cycle = path.slice(cycleStart);
            // Deduplicate cycles by normalizing rotation
            const normalized = normalizeCycle(cycle);
            if (!cycles.some((c) => normalizeCycle(c).join(",") === normalized.join(","))) {
              cycles.push(cycle);
            }
          }
          continue;
        }
        if (color.get(next) === WHITE) {
          stack.push({ nodeId: next, path: [...path, next] });
          inStack.add(next);
          color.set(next, GRAY);
          foundUnvisited = true;
          break;
        }
      }
      if (!foundUnvisited) {
        stack.pop();
        inStack.delete(nodeId);
        color.set(nodeId, BLACK);
      }
    }
  }

  for (const node of snapshot.nodes) {
    if (color.get(node.id) === WHITE) {
      color.set(node.id, GRAY);
      dfs(node.id);
    }
    if (cycles.length >= maxCycles) break;
  }

  return cycles;
}

function normalizeCycle(cycle) {
  if (cycle.length <= 1) return cycle;
  // Use lexicographic comparison — Math.min on strings returns NaN
  let minIdx = 0;
  for (let i = 1; i < cycle.length; i++) {
    if (cycle[i] < cycle[minIdx]) minIdx = i;
  }
  return [...cycle.slice(minIdx), ...cycle.slice(0, minIdx)];
}

/**
 * Detect bridge nodes — nodes whose removal would disconnect the graph.
 * Uses a simplified approach: find nodes that are the only connection
 * between two clusters (high betweenness approximation).
 */
function detectBridges(snapshot) {
  const { forward, reverse } = buildAdjacency(snapshot.edges);
  const bridges = [];

  for (const node of snapshot.nodes) {
    const fanIn = reverse.get(node.id)?.size ?? 0;
    const fanOut = forward.get(node.id)?.size ?? 0;
    // A bridge has both incoming and outgoing edges but is one of few connectors
    if (fanIn >= 2 && fanOut >= 2 && fanIn + fanOut <= 8) {
      // Check if this node connects distinct clusters
      const upstreamCluster = new Set(reverse.get(node.id));
      const downstreamCluster = new Set(forward.get(node.id));
      const overlap = [...upstreamCluster].filter((id) => downstreamCluster.has(id));
      if (overlap.length === 0) {
        bridges.push({
          nodeId: node.id,
          label: node.label,
          clusterASize: upstreamCluster.size,
          clusterBSize: downstreamCluster.size
        });
      }
    }
  }

  return bridges;
}

/**
 * Compute blast radius for a change target.
 *
 * Blast radius = the set of nodes transitively affected by changing `targetId`.
 * Uses forward BFS to find all downstream dependents.
 *
 * Returns:
 *   - directDependents: nodes that directly depend on targetId
 *   - transitiveDependents: all nodes transitively affected
 *   - affectedFiles: unique file paths touched
 *   - estimatedTestScope: rough count of test files likely affected
 */
export function computeBlastRadius(snapshot, targetId) {
  if (!targetId || typeof targetId !== "string") {
    throw new Error("targetId must be a non-empty string");
  }
  // Build a Map for O(1) node lookups instead of repeated find() calls
  const nodeMap = new Map(snapshot.nodes.map((n) => [n.id, n]));
  if (!nodeMap.has(targetId)) throw new Error(`target node not found: ${targetId}`);

  const { reverse } = buildAdjacency(snapshot.edges);

  // BFS through reverse edges to find all dependents
  const directDependents = [];
  const transitiveSet = new Set();
  const queue = [targetId];
  const visited = new Set([targetId]);

  while (queue.length > 0) {
    const current = queue.shift();
    const dependents = reverse.get(current);
    if (!dependents) continue;
    for (const dep of dependents) {
      if (visited.has(dep)) continue;
      visited.add(dep);
      if (current === targetId) directDependents.push(dep);
      transitiveSet.add(dep);
      queue.push(dep);
    }
  }

  const allAffected = new Set([targetId, ...transitiveSet]);
  const affectedFiles = new Set();
  for (const nodeId of allAffected) {
    const node = nodeMap.get(nodeId);
    if (node?.filePath) affectedFiles.add(node.filePath);
  }

  const estimatedTestScope = Math.min(affectedFiles.size * 2, 50);

  const targetNode = nodeMap.get(targetId);

  return {
    targetId,
    targetLabel: targetNode?.label ?? targetId,
    targetType: targetNode?.type ?? "unknown",
    directDependents: directDependents.map((id) => {
      const n = nodeMap.get(id);
      return { id, label: n?.label ?? id, type: n?.type ?? "unknown" };
    }),
    transitiveDependents: [...transitiveSet].map((id) => {
      const n = nodeMap.get(id);
      return { id, label: n?.label ?? id, type: n?.type ?? "unknown" };
    }),
    affectedFiles: [...affectedFiles],
    affectedFileCount: affectedFiles.size,
    affectedNodeCount: allAffected.size,
    estimatedTestScope,
    riskLevel: allAffected.size <= 3 ? "low" : allAffected.size <= 10 ? "medium" : allAffected.size <= 25 ? "high" : "critical"
  };
}

/**
 * Convert extracted structural patterns into EOS CodeGraphPattern records.
 *
 * Each pattern becomes a vault record that the self-iteration engine can
 * consume to generate Skills.
 */
export function patternsToRecords(patterns, projectId, sourceSnapshotId) {
  const ts = Date.now();
  return patterns.map((pattern, index) => {
    const random = randomBytes(4).toString("hex");
    return createCodeGraphPattern({
      id: `codegraph.${safeIdSlug(projectId)}.${pattern.patternType}.${ts}.${random}.${index}`,
      projectId,
      sourceSnapshotId,
      patternType: pattern.patternType,
      nodeId: pattern.nodeId || null,
      nodeIds: pattern.nodeIds || [],
      label: pattern.label,
      description: pattern.description,
      metrics: pattern.metrics,
      applicabilityBounds: pattern.applicabilityBounds || [],
      suggestedSkillType: pattern.suggestedSkill || null,
      capturedAt: nowIso()
    });
  });
}

/**
 * Ingest a code graph snapshot into the vault.
 *
 * This is the main entry point for external tools: they provide a raw graph
 * snapshot, and this function:
 *   1. Normalizes and validates the snapshot
 *   2. Extracts structural patterns
 *   3. Converts patterns to CodeGraphPattern records
 *   4. Saves them to the vault
 *
 * Returns the saved records and a summary.
 */
export async function ingestCodeGraphSnapshot(vault, { projectId, snapshot, sourceTool = "external", sourceRef = null }) {
  if (!projectId || typeof projectId !== "string") {
    throw new Error("projectId is required");
  }
  const normalized = normalizeGraphSnapshot(snapshot);
  const snapshotId = `graph_snapshot.${safeIdSlug(projectId)}.${Date.now()}`;

  const patterns = extractStructuralPatterns(normalized);
  const records = patternsToRecords(patterns, projectId, snapshotId);

  // Save all pattern records atomically — partial saves leave inconsistent state
  const saveAll = async () => {
    for (const record of records) {
      await vault.save(record);
    }
  };
  if (typeof vault.withTransaction === "function") {
    await vault.withTransaction(saveAll, { message: `[CodeGraphSnapshot] ingest: ${snapshotId}` });
  } else {
    await saveAll();
  }

  const summary = {
    snapshotId,
    projectId,
    sourceTool,
    sourceRef,
    nodeCount: normalized.nodes.length,
    edgeCount: normalized.edges.length,
    patternCount: patterns.length,
    patternBreakdown: patterns.reduce((acc, p) => {
      acc[p.patternType] = (acc[p.patternType] || 0) + 1;
      return acc;
    }, {}),
    capturedAt: nowIso()
  };

  return { snapshotId, records, summary, normalizedSnapshot: normalized };
}

/**
 * Query code graph patterns from the vault.
 * Supports filtering by patternType, projectId, or suggestedSkillType.
 */
export async function queryCodeGraphPatterns(vault, { projectId = null, patternType = null, limit = 50 } = {}) {
  const all = await vault.list("CodeGraphPattern");
  let filtered = all;
  if (projectId && projectId !== "*") filtered = filtered.filter((r) => r.projectId === projectId);
  if (patternType) filtered = filtered.filter((r) => r.patternType === patternType);
  return filtered
    .sort((a, b) => (b.capturedAt || "").localeCompare(a.capturedAt || ""))
    .slice(0, Math.min(limit, 500));
}

/**
 * Get blast radius for a node, optionally from a stored snapshot.
 *
 * If a snapshotId is provided, loads the associated patterns and reconstructs
 * the graph. Otherwise, accepts a raw snapshot for ad-hoc queries.
 */
export async function getBlastRadius(vault, { projectId, targetId, snapshot = null, snapshotId = null }) {
  if (snapshot) {
    const normalized = normalizeGraphSnapshot(snapshot);
    return computeBlastRadius(normalized, targetId);
  }

  // Try to reconstruct from stored patterns (less precise but vault-backed)
  if (snapshotId) {
    const patterns = await vault.list("CodeGraphPattern");
    const snapshotPatterns = patterns.filter(
      (p) => p.sourceSnapshotId === snapshotId && p.projectId === projectId
    );
    if (snapshotPatterns.length === 0) {
      throw new Error(`no code graph patterns found for snapshot: ${snapshotId}`);
    }
    // Without the raw graph, we can only report pattern-based impact
    return {
      targetId,
      snapshotId,
      relatedPatterns: snapshotPatterns.filter(
        (p) => p.nodeId === targetId || (p.nodeIds && p.nodeIds.includes(targetId))
      ),
      note: "Blast radius computed from stored patterns only. For full transitive analysis, provide a raw snapshot."
    };
  }

  throw new Error("either snapshot or snapshotId must be provided");
}
