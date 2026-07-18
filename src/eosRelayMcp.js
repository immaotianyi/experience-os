/**
 * EOS Capture Relay MCP Server.
 *
 * This is the cross-tool bridge for Experience OS. Any MCP-capable client can
 * submit a consented collaboration fragment and read only verified experience
 * assets. It deliberately cannot create approvals or promote assets.
 */

import { stdin, stdout, stderr } from "node:process";
import { GitVault } from "./gitVault.js";
import { resolveVaultDir } from "./vaultPath.js";
import {
  captureWorkCheckpoint,
  buildProjectTimeline,
  getProjectReadiness
} from "./projectEngine.js";

// GitVault may announce initialization. MCP stdout must contain JSON-RPC only.
console.log = (...args) => stderr.write(`[EOS Relay] ${args.join(" ")}\n`);

const vault = new GitVault(resolveVaultDir("real"));
await vault.init();

const TOOLS = [
  {
    name: "eos_capture_collaboration",
    description: "Store one user-consented collaboration fragment as a replayable EOS work checkpoint with its source event and evidence link.",
    inputSchema: {
      type: "object",
      required: ["projectId", "actor", "content", "sourceTool", "consented"],
      properties: {
        projectId: { type: "string" },
        actor: { type: "string", description: "Usually human or the calling agent name." },
        content: { type: "string", description: "A bounded fragment the user explicitly chose to retain." },
        sourceTool: { type: "string", description: "codex, cursor, claude-code, terminal, or another source." },
        sourceRef: { type: ["string", "null"] },
        title: { type: "string", description: "Optional human-readable title for this work boundary." },
        notes: { type: "string", description: "Optional context, uncertainty, or follow-up notes." },
        consented: { type: "boolean", description: "Must be true; EOS rejects implicit capture." }
      }
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  {
    name: "eos_project_readiness",
    description: "Explain which Experience Receipts in a project are eligible for reusable-experience promotion and what is still missing.",
    inputSchema: {
      type: "object",
      required: ["projectId"],
      properties: { projectId: { type: "string" } }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "eos_verified_experience",
    description: "List approved ExperienceAssets for a project, including their receipt, reviewed decision, and successful outcome references.",
    inputSchema: {
      type: "object",
      required: ["projectId"],
      properties: { projectId: { type: "string" }, limit: { type: "number", minimum: 1, maximum: 100 } }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "eos_project_timeline",
    description: "Read the evidence-first project timeline without modifying it.",
    inputSchema: {
      type: "object",
      required: ["projectId"],
      properties: { projectId: { type: "string" } }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }
];

function textResult(value, isError = false) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], ...(isError ? { isError: true } : {}) };
}

function generatedId(prefix) {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
}

async function callTool(name, args = {}) {
  if (name === "eos_capture_collaboration") {
    const title = typeof args.title === "string" && args.title.trim()
      ? args.title.trim()
      : String(args.content || "").trim().slice(0, 80) || "Consented collaboration checkpoint";
    const captured = await captureWorkCheckpoint(vault, {
      id: generatedId("checkpoint"),
      eventId: generatedId("event"),
      evidenceId: generatedId("evidence"),
      projectId: args.projectId,
      actor: args.actor,
      content: args.content,
      sourceTool: args.sourceTool,
      sourceRef: args.sourceRef ?? null,
      title,
      notes: typeof args.notes === "string" ? args.notes : "",
      consented: args.consented
    });
    return textResult({ ok: true, ...captured, message: "Captured locally with explicit consent as a work checkpoint." });
  }
  if (name === "eos_project_readiness") {
    return textResult(await getProjectReadiness(vault, args.projectId));
  }
  if (name === "eos_verified_experience") {
    const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 100);
    const assets = (await vault.list("ExperienceAsset"))
      .filter((asset) => asset.projectId === args.projectId && asset.status === "approved")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit);
    return textResult({ projectId: args.projectId, count: assets.length, assets });
  }
  if (name === "eos_project_timeline") {
    return textResult(await buildProjectTimeline(vault, args.projectId));
  }
  throw new Error(`Unknown tool: ${name}`);
}

async function handleMessage(message) {
  if (message.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: message.id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "experience-os-capture-relay", version: "3.0.0" }
      }
    };
  }
  if (message.method === "notifications/initialized") return null;
  if (message.method === "tools/list") return { jsonrpc: "2.0", id: message.id, result: { tools: TOOLS } };
  if (message.method === "tools/call") {
    try {
      return { jsonrpc: "2.0", id: message.id, result: await callTool(message.params?.name, message.params?.arguments) };
    } catch (error) {
      return { jsonrpc: "2.0", id: message.id, result: textResult({ error: error.message }, true) };
    }
  }
  return { jsonrpc: "2.0", id: message.id, error: { code: -32601, message: `Method not found: ${message.method}` } };
}

let buffer = "";
stdin.setEncoding("utf8");
stdin.on("data", async (chunk) => {
  buffer += chunk;
  let newline;
  while ((newline = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (!line) continue;
    try {
      const reply = await handleMessage(JSON.parse(line));
      if (reply) stdout.write(`${JSON.stringify(reply)}\n`);
    } catch (error) {
      stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: error.message } })}\n`);
    }
  }
});
