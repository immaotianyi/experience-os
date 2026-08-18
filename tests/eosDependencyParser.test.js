/**
 * Test suite for eosDependencyParser.js — JS/TS import graph → CodeGraph snapshot.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";

import {
  parseProjectDependencies,
  resolveProjectRoot
} from "../src/eosDependencyParser.js";
import {
  normalizeGraphSnapshot,
  extractStructuralPatterns,
  computeFanDegrees,
  computeBlastRadius,
  ingestCodeGraphSnapshot
} from "../src/eosCodeGraphAdapter.js";

let tempDir;
let projectDir;

before(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "eos-depparser-"));
  projectDir = path.join(tempDir, "proj");
  await mkdir(path.join(projectDir, "src"), { recursive: true });
  await mkdir(path.join(projectDir, "nested"), { recursive: true });
  await mkdir(path.join(projectDir, "node_modules", "x"), { recursive: true });
  await mkdir(path.join(projectDir, "dist"), { recursive: true });

  await writeFile(path.join(projectDir, "package.json"), JSON.stringify({ name: "demo", type: "module" }));

  await writeFile(path.join(projectDir, "src", "a.ts"), [
    'import { b } from "./b";',
    'import React from "react";',
    'import fs from "node:fs";',
    'import { missing } from "./missing";',
    "// import { ghost } from \"./ghost\";",
    "/* const legacy = require(\"./ghost2\"); */",
    "if (b && React) { console.log(fs, missing); }"
  ].join("\n"));

  await writeFile(path.join(projectDir, "src", "b.ts"), 'import { c } from "./c";\nexport const b = 1;\n');
  await writeFile(path.join(projectDir, "src", "c.ts"), 'import { a } from "./a";\nexport const c = 2;\n');
  await writeFile(path.join(projectDir, "src", "hub.ts"), 'export const hub = () => 42;\n');

  for (let i = 1; i <= 5; i++) {
    await writeFile(path.join(projectDir, "src", `u${i}.js`), `import { hub } from "./hub";\nexport const u${i} = ${i};\n`);
  }

  await writeFile(path.join(projectDir, "src", "legacy.cjs"), 'const u1 = require("./u1");\nmodule.exports = { u1 };\n');
  await writeFile(path.join(projectDir, "src", "dyn.mjs"), 'const hub = await import("./hub");\nexport default hub;\n');
  await writeFile(path.join(projectDir, "nested", "deep.ts"), 'import { b } from "../src/b";\nexport const deep = true;\n');
  await writeFile(path.join(projectDir, "src", "types.d.ts"), 'declare module "demo";\n');
  await writeFile(path.join(projectDir, "node_modules", "x", "index.js"), 'import { a } from "../../src/a";\n');
  await writeFile(path.join(projectDir, "dist", "out.js"), 'import { hub } from "../src/hub";\n');
});

after(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("resolveProjectRoot", () => {
  it("resolves relative paths against baseDir", () => {
    const resolved = resolveProjectRoot("proj", { baseDir: tempDir });
    assert.equal(resolved, projectDir);
  });

  it("accepts absolute paths inside home or tmp trees", () => {
    assert.equal(resolveProjectRoot(projectDir), projectDir);
  });

  it("rejects paths outside home/tmp trees", () => {
    assert.throws(() => resolveProjectRoot("/etc"), /home or temp/);
    assert.throws(() => resolveProjectRoot("../../../../..", { baseDir: tempDir }), /home or temp/);
  });

  it("rejects the home/tmp/filesystem roots themselves", () => {
    assert.throws(() => resolveProjectRoot(homedir()), /project subdirectory/);
    assert.throws(() => resolveProjectRoot(""), /rootDir is required/);
  });
});

describe("parseProjectDependencies", () => {
  it("builds a normalizable snapshot with file and external module nodes", async () => {
    const snapshot = await parseProjectDependencies(projectDir);
    const normalized = normalizeGraphSnapshot(snapshot);

    const ids = normalized.nodes.map((n) => n.id);
    assert.ok(ids.includes("src/a.ts"));
    assert.ok(ids.includes("src/legacy.cjs"));
    assert.ok(ids.includes("src/dyn.mjs"));
    assert.ok(ids.includes("nested/deep.ts"));
    assert.ok(ids.includes("pkg:react"));
    assert.equal(ids.includes("pkg:node:fs"), false, "node builtins stay excluded by default");
    assert.equal(ids.includes("src/types.d.ts"), false, "type declaration files are skipped");
    assert.equal(ids.some((id) => id.startsWith("node_modules/")), false, "node_modules stays ignored");
    assert.equal(ids.some((id) => id.startsWith("dist/")), false, "dist stays ignored");
    assert.equal(ids.some((id) => id.endsWith("ghost")), false, "commented-out imports stay ignored");

    const aNode = normalized.nodes.find((n) => n.id === "src/a.ts");
    assert.equal(aNode.type, "file");
    assert.equal(aNode.filePath, "src/a.ts");
    assert.ok(aNode.loc >= 7);
    assert.ok(aNode.complexity >= 2, "branch keywords raise the complexity proxy");

    const react = normalized.nodes.find((n) => n.id === "pkg:react");
    assert.equal(react.type, "module");
  });

  it("records import edges with correct resolution", async () => {
    const snapshot = await parseProjectDependencies(projectDir);
    const normalized = normalizeGraphSnapshot(snapshot);
    const hasEdge = (source, target) =>
      normalized.edges.some((e) => e.source === source && e.target === target && e.kind === "imports");

    assert.ok(hasEdge("src/a.ts", "src/b.ts"));
    assert.ok(hasEdge("src/a.ts", "pkg:react"));
    assert.ok(hasEdge("nested/deep.ts", "src/b.ts"), "relative specifier climbs directories");
    assert.ok(hasEdge("src/legacy.cjs", "src/u1.js"), "require() is extracted");
    assert.ok(hasEdge("src/dyn.mjs", "src/hub.ts"), "dynamic import resolves across extensions");
    assert.equal(hasEdge("src/a.ts", "src/missing"), false, "unresolved specifiers never become edges");
  });

  it("reports unresolved and builtin specifier statistics", async () => {
    const snapshot = await parseProjectDependencies(projectDir);
    assert.equal(snapshot.metadata.stats.unresolvedSpecifiers >= 1, true);
    assert.equal(snapshot.metadata.stats.nodeBuiltinSpecifiers >= 1, true);
    assert.equal(snapshot.metadata.fileCount >= 11, true);
    assert.match(snapshot.metadata.parserVersion, /eos-dependency-parser/);
  });

  it("can include node builtins and drop externals on demand", async () => {
    const withBuiltins = await parseProjectDependencies(projectDir, { includeNodeBuiltins: true });
    assert.ok(withBuiltins.nodes.some((n) => n.id === "node:fs"));

    const lean = await parseProjectDependencies(projectDir, { includeExternal: false });
    assert.equal(lean.nodes.some((n) => n.id.startsWith("pkg:")), false);
    assert.equal(lean.edges.some((e) => e.target.startsWith("pkg:")), false);
  });
});

describe("parse → CodeGraph pipeline", () => {
  it("extracts the a→b→c cycle and the hub pattern from a parsed project", async () => {
    const snapshot = await parseProjectDependencies(projectDir);
    const normalized = normalizeGraphSnapshot(snapshot);
    const patterns = extractStructuralPatterns(normalized);

    const cycles = patterns.filter((p) => p.patternType === "cycle");
    assert.equal(cycles.length >= 1, true);
    const cycleNodes = cycles[0].nodeIds.map(String);
    assert.ok(cycleNodes.includes("src/a.ts"));
    assert.ok(cycleNodes.includes("src/b.ts"));
    assert.ok(cycleNodes.includes("src/c.ts"));

    const hubPatterns = patterns.filter((p) => p.patternType === "hub" && p.nodeId === "src/hub.ts");
    assert.equal(hubPatterns.length, 1, "hub.ts crosses the default fan-in threshold");
  });

  it("computes fan degrees and blast radius on the parsed graph", async () => {
    const snapshot = await parseProjectDependencies(projectDir);
    const normalized = normalizeGraphSnapshot(snapshot);

    const hubDegree = computeFanDegrees(normalized).find((d) => d.nodeId === "src/hub.ts");
    assert.equal(hubDegree.fanOut, 0);
    assert.equal(hubDegree.fanIn, 6, "five u*.js importers plus dyn.mjs");

    const radius = computeBlastRadius(normalized, "src/hub.ts");
    assert.equal(radius.directDependents.length, 6);
    assert.equal(radius.affectedFileCount, 8, "hub + 5 importers + dyn.mjs + legacy.cjs via u1");
    assert.equal(radius.transitiveDependents.length, 7);
    assert.ok(["low", "medium"].includes(radius.riskLevel));
  });

  it("feeds ingestCodeGraphSnapshot so patterns land in the vault", async () => {
    const snapshot = await parseProjectDependencies(projectDir);
    const saved = [];
    const fakeVault = {
      save: async (record) => { saved.push(record); },
      withTransaction: undefined
    };

    const result = await ingestCodeGraphSnapshot(fakeVault, {
      projectId: "project.parser_test",
      snapshot,
      sourceTool: "eos-dependency-parser",
      sourceRef: projectDir
    });

    assert.ok(result.snapshotId.startsWith("graph_snapshot."));
    assert.equal(saved.length, result.records.length);
    assert.ok(saved.length >= 2, "at least the cycle and hub patterns");
    assert.ok(saved.every((r) => r.kind === "CodeGraphPattern"));
    assert.equal(result.summary.patternBreakdown.cycle >= 1, true);
    assert.equal(result.summary.patternBreakdown.hub >= 1, true);
  });
});
