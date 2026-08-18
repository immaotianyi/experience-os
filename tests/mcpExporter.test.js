/**
 * Test suite for mcpExporter.js — Skill → MCP Server export (stdio + SSE).
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import http from "node:http";

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
    instructions: "Inspect the input and return a concise, evidence-backed result.",
    evidenceLinkIds: ["evidence.mcp.1"],
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
    assert.equal(manifest.mode, "instruction");
    assert.equal(manifest.capabilities.tools, true);
    assert.equal(manifest.tools.length, 1);
    assert.equal(manifest.tools[0].name, "read_instructions");
    assert.equal(manifest.tools[0].annotations.readOnlyHint, true);
    assert.equal(manifest.prompts[0].name, "mcp-test-skill");
    assert.equal(manifest.resources[0].uri, "skill://mcp-test-skill");
    assert.equal(manifest.safety.level, "L1");
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

  it("generates readable README documenting prompt, resource, and the read-only tool", async () => {
    const skill = makeStableSkill({ name: "Code Review Skill" });
    const result = await exportSkillAsMcpServer({ skill, outputDir: tempDir });
    const readme = await readFile(path.join(result.serverDir, "README.md"), "utf8");
    assert.ok(readme.includes("Code Review Skill"));
    assert.ok(readme.includes("exposes a Prompt, a read-only Resource, and one read-only Tool"));
    assert.ok(readme.includes("read_instructions"));
    assert.ok(readme.includes("stdio"));
  });

  it("serves the reviewed instructions through prompt, resource, and read-only tool over stdio", async () => {
    const result = await exportSkillAsMcpServer({ skill: makeStableSkill(), outputDir: tempDir });
    const replies = await exchangeWithServer(path.join(result.serverDir, "index.js"), [
      { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
      { jsonrpc: "2.0", id: 2, method: "prompts/list", params: {} },
      { jsonrpc: "2.0", id: 3, method: "prompts/get", params: { name: "mcp-test-skill" } },
      { jsonrpc: "2.0", id: 4, method: "resources/read", params: { uri: "skill://mcp-test-skill" } },
      { jsonrpc: "2.0", id: 5, method: "tools/list", params: {} },
      { jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "read_instructions", arguments: {} } },
      { jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "no_such_tool", arguments: {} } },
      { jsonrpc: "2.0", id: 8, method: "tools/call", params: { name: "read_instructions", arguments: { rogue: true } } }
    ]);
    assert.deepEqual(replies.map((reply) => reply.id), [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.equal(replies[2].result.messages[0].content.text.includes("evidence-backed"), true);
    assert.equal(replies[3].result.contents[0].text.includes("evidence-backed"), true);
    assert.equal(replies[4].result.tools.length, 1);
    assert.equal(replies[4].result.tools[0].name, "read_instructions");
    assert.equal(replies[4].result.tools[0].annotations.readOnlyHint, true);
    assert.equal(replies[5].result.content[0].text.includes("evidence-backed"), true);
    assert.equal(replies[5].result.isError, false);
    assert.equal(replies[6].error.code, -32602);
    assert.equal(replies[7].error.code, -32602);
  });

  it("keeps high-safety policy visible on the read-only tool", async () => {
    const skill = makeStableSkill({ safetyLevel: "L3", humanConfirmationRequired: true });
    const result = await exportSkillAsMcpServer({ skill, outputDir: tempDir });
    const manifest = JSON.parse(await readFile(path.join(result.serverDir, "server.json"), "utf8"));
    assert.equal(manifest.tools.length, 1);
    assert.equal(manifest.safety.level, "L3");
    assert.equal(manifest.safety.humanConfirmationRequired, true);
  });

  it("rejects a stable specification that has no real instructions", async () => {
    await assert.rejects(
      exportSkillAsMcpServer({ skill: makeStableSkill({ instructions: null }), outputDir: tempDir }),
      /instructions_missing/
    );
  });

  it("rejects an unsupported transport instead of faking support", async () => {
    const skill = makeStableSkill();
    await assert.rejects(
      exportSkillAsMcpServer({ skill, outputDir: tempDir, options: { transport: "websocket" } }),
      /Unsupported MCP transport/
    );
  });

  it("generates package.json with correct name", async () => {
    const result = await exportSkillAsMcpServer({ skill: makeStableSkill({ name: "My Cool Skill" }), outputDir: tempDir });
    const pkg = JSON.parse(await readFile(path.join(result.serverDir, "package.json"), "utf8"));
    assert.equal(pkg.name, "eos-my-cool-skill");
    assert.equal(pkg.type, "module");
    assert.equal(pkg.main, "index.js");
  });
});

describe("exportSkillAsMcpServer (SSE transport)", () => {
  it("manifest declares sse transport with loopback bind options", async () => {
    const result = await exportSkillAsMcpServer({
      skill: makeStableSkill({ name: "SSE Skill" }),
      outputDir: tempDir,
      options: { transport: "sse" }
    });
    const manifest = JSON.parse(await readFile(path.join(result.serverDir, "server.json"), "utf8"));
    assert.equal(manifest.transport, "sse");
    assert.equal(manifest.capabilities.tools, true);
    assert.equal(manifest.transportOptions.bindHost, "127.0.0.1");
    assert.equal(manifest.transportOptions.endpointPath, "/sse");
    const readme = await readFile(path.join(result.serverDir, "README.md"), "utf8");
    assert.ok(readme.includes("SSE"));
  });

  it("serves initialize, tools/list and tools/call over HTTP+SSE", async () => {
    const result = await exportSkillAsMcpServer({
      skill: makeStableSkill({ name: "SSE Live Skill" }),
      outputDir: tempDir,
      options: { transport: "sse" }
    });
    const session = await startSseServer(path.join(result.serverDir, "index.js"));
    try {
      const replies = await sseExchange(session.port, [
        { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
        { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
        { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "read_instructions", arguments: {} } },
        { jsonrpc: "2.0", id: 4, method: "prompts/get", params: { name: "sse-live-skill" } }
      ]);
      assert.deepEqual(replies.map((r) => r.id), [1, 2, 3, 4]);
      assert.equal(replies[0].result.capabilities.tools !== undefined, true);
      assert.equal(replies[1].result.tools[0].name, "read_instructions");
      assert.equal(replies[2].result.content[0].text.includes("evidence-backed"), true);
      assert.equal(replies[3].result.messages[0].content.text.includes("evidence-backed"), true);
    } finally {
      session.kill();
    }
  });

  it("rejects POSTs carrying an unknown session id", async () => {
    const result = await exportSkillAsMcpServer({
      skill: makeStableSkill({ name: "SSE Reject Skill" }),
      outputDir: tempDir,
      options: { transport: "sse" }
    });
    const session = await startSseServer(path.join(result.serverDir, "index.js"));
    try {
      const status = await new Promise((resolve, reject) => {
        const req = http.request(
          { host: "127.0.0.1", port: session.port, path: "/messages?sessionId=nope", method: "POST", headers: { "Content-Type": "application/json" } },
          (res) => { res.resume(); res.on("end", () => resolve(res.statusCode)); }
        );
        req.on("error", reject);
        req.end("{}");
      });
      assert.equal(status, 404);
    } finally {
      session.kill();
    }
  });
});

function exchangeWithServer(entryPath, messages) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entryPath], { stdio: ["pipe", "pipe", "pipe"] });
    const replies = [];
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`MCP server timed out: ${stderr}`));
    }, 3_000);

    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      let newlineIndex;
      while ((newlineIndex = stdout.indexOf("\n")) >= 0) {
        const line = stdout.slice(0, newlineIndex).trim();
        stdout = stdout.slice(newlineIndex + 1);
        if (line) replies.push(JSON.parse(line));
      }
      if (replies.length === messages.length) {
        clearTimeout(timer);
        child.kill();
        resolve(replies);
      }
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.stdin.write(`${messages.map((message) => JSON.stringify(message)).join("\n")}\n`);
  });
}

function startSseServer(entryPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entryPath], { stdio: ["pipe", "pipe", "inherit"] });
    let stdout = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`SSE server timed out: ${stdout}`));
    }, 5_000);
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      const line = stdout.trim().split("\n").pop();
      try {
        const ready = JSON.parse(line);
        if (ready.transport === "sse" && ready.port) {
          clearTimeout(timer);
          resolve({ port: ready.port, kill: () => child.kill() });
        }
      } catch { /* wait for the full ready line */ }
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function sseExchange(port, messages) {
  return new Promise((resolve, reject) => {
    const replies = [];
    let buffer = "";
    let posted = 0;
    let messageEndpoint = null;
    const req = http.get({ host: "127.0.0.1", port, path: "/sse" }, (res) => {
      res.setEncoding("utf8");
      const timer = setTimeout(() => {
        req.destroy();
        reject(new Error(`SSE exchange timed out after ${replies.length}/${messages.length} replies`));
      }, 5_000);

      const postNext = () => {
        if (posted >= messages.length || !messageEndpoint) return;
        const message = messages[posted++];
        const payload = JSON.stringify(message);
        const post = http.request(
          { host: "127.0.0.1", port, path: messageEndpoint, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } },
          (postRes) => { postRes.resume(); }
        );
        post.on("error", (error) => { clearTimeout(timer); req.destroy(); reject(error); });
        post.end(payload);
      };

      res.on("data", (chunk) => {
        buffer += chunk;
        let boundary;
        while ((boundary = buffer.indexOf("\n\n")) >= 0) {
          const frame = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          if (frame.includes("event: endpoint")) {
            const dataLine = frame.split("\n").find((l) => l.startsWith("data: "));
            messageEndpoint = dataLine.slice("data: ".length).trim();
            postNext();
            continue;
          }
          const dataLine = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          replies.push(JSON.parse(dataLine.slice("data: ".length)));
          if (replies.length === messages.length) {
            clearTimeout(timer);
            req.destroy();
            resolve(replies);
            return;
          }
          postNext();
        }
      });
      res.on("error", (error) => { clearTimeout(timer); reject(error); });
    });
    req.on("error", (error) => reject(error));
  });
}

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
