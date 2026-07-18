/**
 * Test suite for mcpExporter.js — Skill → MCP Server export.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { exportSkillAsMcpServer, exportAllStableSkills } from "../src/mcpExporter.js";
import { createSkillCandidate } from "../src/domain.js";

let tempDir;

before(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "eos-mcp-test-"));
});

after(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

function makeStableSkill(overrides = {}) {
  const s = createSkillCandidate({
    id: "skill.mcp_test",
    projectId: "project.test",
    name: "MCP Test Skill",
    origin: "test",
    trigger: { intent: "test_intent", signals: ["sig1", "sig2"] },
    inputSchema: { type: "object", properties: { input: { type: "string" } } },
    outputSchema: { type: "object", properties: { result: { type: "string" } } },
    safetyLevel: "L1",
    fallback: "return error",
    humanConfirmationRequired: false,
    ...overrides
  });
  s.status = "stable";
  return s;
}

describe("exportSkillAsMcpServer", () => {
  it("exports a stable skill as MCP server", async () => {
    const skill = makeStableSkill();
    const result = await exportSkillAsMcpServer({ skill, outputDir: tempDir });

    assert.ok(result.serverDir);
    assert.ok(result.serverName.startsWith("eos-"));
    assert.equal(result.files.length, 4); // server.json, README.md, index.js, package.json

    // Verify server.json
    const manifest = JSON.parse(await readFile(path.join(result.serverDir, "server.json"), "utf8"));
    assert.equal(manifest.transport, "stdio");
    assert.ok(manifest.tools.length > 0);
    assert.equal(manifest.tools[0].name, "test_intent");
    assert.equal(manifest.tools[0].safety.level, "L1");
  });

  it("rejects non-stable skill", async () => {
    const skill = makeStableSkill();
    skill.status = "candidate";
    await assert.rejects(
      exportSkillAsMcpServer({ skill, outputDir: tempDir }),
      /stable/
    );
  });

  it("rejects non-Skill record", async () => {
    await assert.rejects(
      exportSkillAsMcpServer({ skill: { kind: "Project", id: "p1" }, outputDir: tempDir }),
      /Skill/
    );
  });

  it("generates readable README", async () => {
    const skill = makeStableSkill({ name: "Code Review Skill" });
    const result = await exportSkillAsMcpServer({ skill, outputDir: tempDir });
    const readme = await readFile(path.join(result.serverDir, "README.md"), "utf8");
    assert.ok(readme.includes("Code Review Skill"));
    assert.ok(readme.includes("Safety Level"));
    assert.ok(readme.includes("Input Schema"));
  });

  it("generates executable index.js with JSON-RPC handler", async () => {
    const skill = makeStableSkill();
    const result = await exportSkillAsMcpServer({ skill, outputDir: tempDir });
    const code = await readFile(path.join(result.serverDir, "index.js"), "utf8");
    assert.ok(code.includes("tools/list"));
    assert.ok(code.includes("tools/call"));
    assert.ok(code.includes("initialize"));
    assert.ok(code.includes("jsonrpc"));
  });

  it("supports SSE transport", async () => {
    const skill = makeStableSkill();
    const result = await exportSkillAsMcpServer({
      skill,
      outputDir: tempDir,
      options: { transport: "sse" }
    });
    const manifest = JSON.parse(await readFile(path.join(result.serverDir, "server.json"), "utf8"));
    assert.equal(manifest.transport, "sse");
    const code = await readFile(path.join(result.serverDir, "index.js"), "utf8");
    assert.ok(code.includes("text/event-stream"));
  });

  it("marks high-safety skills as destructive", async () => {
    const skill = makeStableSkill({ safetyLevel: "L3", humanConfirmationRequired: true });
    const result = await exportSkillAsMcpServer({ skill, outputDir: tempDir });
    const manifest = JSON.parse(await readFile(path.join(result.serverDir, "server.json"), "utf8"));
    assert.equal(manifest.tools[0].annotations.destructiveHint, true);
    assert.equal(manifest.tools[0].annotations.readOnlyHint, false);
  });

  it("generates package.json with correct name", async () => {
    const skill = makeStableSkill({ name: "My Cool Skill" });
    const result = await exportSkillAsMcpServer({ skill, outputDir: tempDir });
    const pkg = JSON.parse(await readFile(path.join(result.serverDir, "package.json"), "utf8"));
    assert.equal(pkg.name, "eos-my_cool_skill");
    assert.equal(pkg.type, "module");
    assert.equal(pkg.main, "index.js");
  });
});

describe("exportAllStableSkills", () => {
  it("exports only stable skills from a mixed list", async () => {
    const skills = [
      makeStableSkill({ id: "skill.stable1", name: "Stable One" }),
      makeStableSkill({ id: "skill.stable2", name: "Stable Two" }),
      makeStableSkill({ id: "skill.candidate1", name: "Candidate" })
    ];
    skills[2].status = "candidate";

    const results = await exportAllStableSkills({ skills, outputDir: tempDir });
    // exportAllStableSkills filters for stable only — candidate is excluded entirely
    assert.equal(results.length, 2);
    assert.equal(results.filter((r) => r.ok).length, 2);
    assert.equal(results.filter((r) => !r.ok).length, 0);
  });

  it("returns empty array for no stable skills", async () => {
    const results = await exportAllStableSkills({ skills: [], outputDir: tempDir });
    assert.equal(results.length, 0);
  });
});
