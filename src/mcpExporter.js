/**
 * Export a reviewed instruction Skill as a self-contained MCP server.
 *
 * The generated server exposes a real Prompt, a read-only Resource, and one
 * read-only Tool (`read_instructions`) that returns the reviewed instruction
 * text without executing anything. Supported transports: stdio and SSE.
 */

import { randomUUID } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { compilePortableSkill, portableSkillSlug } from "./skillCompiler.js";

const SUPPORTED_TRANSPORTS = new Set(["stdio", "sse"]);
const READ_ONLY_TOOL_NAME = "read_instructions";

export async function exportSkillAsMcpServer({ skill, outputDir, options = {} }) {
  const transport = options.transport || "stdio";
  if (!SUPPORTED_TRANSPORTS.has(transport)) {
    throw new Error(`Unsupported MCP transport: ${transport} (supported: ${[...SUPPORTED_TRANSPORTS].join(", ")})`);
  }

  const compiled = compilePortableSkill(skill, {
    target: "generic-mcp",
    targetCapabilities: options.targetCapabilities
  });
  const version = options.version || skill.version || "0.1.0";
  const serverName = `eos-${portableSkillSlug(skill.name)}`;
  const promptName = compiled.artifact.descriptor.prompt.name;
  const resourceUri = compiled.artifact.descriptor.resource.uri;
  const serverDir = path.join(outputDir, serverName);

  await mkdir(serverDir, { recursive: true });

  const manifest = buildServerManifest({
    skill,
    compiled,
    serverName,
    promptName,
    resourceUri,
    transport,
    version
  });
  const readme = buildReadme({ skill, serverName, promptName, resourceUri, transport, version });
  const entryPoint = buildEntryPoint({ skill, serverName, promptName, resourceUri, version, transport });
  const files = [];

  for (const [name, content] of [
    ["server.json", `${JSON.stringify(manifest, null, 2)}\n`],
    ["README.md", readme],
    ["index.js", entryPoint],
    ["package.json", `${JSON.stringify(buildPackageJson({ serverName, version, transport }), null, 2)}\n`]
  ]) {
    const filePath = path.join(serverDir, name);
    await writeAtomically(filePath, content);
    files.push(filePath);
  }

  return { serverDir, files, manifest, serverName, compiled };
}

function readOnlyToolDescriptor(skill) {
  return {
    name: READ_ONLY_TOOL_NAME,
    description: `${skill.trigger?.intent || skill.name} — returns the reviewed instruction text. Read-only: performs no side effects.`,
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  };
}

function buildServerManifest({ skill, compiled, serverName, promptName, resourceUri, transport, version }) {
  return {
    name: serverName,
    version,
    description: `Instruction MCP Server generated from Experience OS Skill: ${skill.name}`,
    transport,
    mode: "instruction",
    capabilities: {
      prompts: true,
      resources: true,
      tools: true
    },
    prompts: [{
      name: promptName,
      description: skill.trigger?.intent || skill.name
    }],
    resources: [{
      uri: resourceUri,
      name: skill.name,
      mimeType: "text/markdown"
    }],
    tools: [readOnlyToolDescriptor(skill)],
    safety: {
      level: skill.safetyLevel,
      fallback: skill.fallback,
      humanConfirmationRequired: skill.humanConfirmationRequired
    },
    metadata: {
      sourceSkillId: skill.id,
      sourceSkillVersion: skill.version,
      sourceHash: compiled.sourceHash,
      sourceProjectId: skill.projectId,
      evidenceLinkIds: skill.evidenceLinkIds ?? [],
      skillLevel: skill.skillLevel,
      exportedAt: new Date().toISOString()
    },
    ...(transport === "sse"
      ? { transportOptions: { endpointPath: "/sse", messagePath: "/messages", bindHost: "127.0.0.1", portEnv: ["EOS_MCP_PORT", "PORT"] } }
      : {})
  };
}

function buildReadme({ skill, serverName, promptName, resourceUri, transport, version }) {
  const transportSection = transport === "sse"
    ? `## Transport

HTTP + SSE (MCP 2024-11-05). Binds \`127.0.0.1\` only; the port comes from \`EOS_MCP_PORT\` (or \`PORT\`) and defaults to an ephemeral free port announced as JSON on stdout.

\`\`\`bash
node index.js
# stdout: {"transport":"sse","host":"127.0.0.1","port":5371,"endpoint":"/sse"}
\`\`\`

Connect an MCP client to \`http://127.0.0.1:<port>/sse\`. The server first sends
an \`endpoint\` event carrying the message POST path for that session.`
    : `## Transport

stdio (newline-delimited JSON-RPC).

\`\`\`bash
node index.js
\`\``;

  return `# ${serverName}

MCP instruction server generated from the reviewed Experience OS Skill **${skill.name}**.

This package exposes a Prompt, a read-only Resource, and one read-only Tool
\`${READ_ONLY_TOOL_NAME}\` that returns the reviewed instruction text. The tool
performs no actions — the host remains responsible for applying the returned
instructions within its own permission boundary.

## Prompt

- Name: \`${promptName}\`
- Intent: ${skill.trigger?.intent || skill.name}

## Resource

- URI: \`${resourceUri}\`
- MIME type: \`text/markdown\`

## Tool

- Name: \`${READ_ONLY_TOOL_NAME}\` — read-only, no arguments, idempotent

## Safety

- Level: ${skill.safetyLevel}
- Human confirmation: ${skill.humanConfirmationRequired ? "required" : "not required"}
- Fallback: ${skill.fallback || "none"}

${transportSection}

## Version

${version}

## Source

- Skill ID: \`${skill.id}\`
- Skill version: ${skill.version}
- Project ID: ${skill.projectId}
- Skill level: ${skill.skillLevel}
`;
}

function buildEntryPoint({ skill, serverName, promptName, resourceUri, version, transport }) {
  const header = `/**
 * MCP instruction server generated from Experience OS Skill: ${skill.id}
 * Transport: ${transport}
 */

const SERVER_NAME = ${JSON.stringify(serverName)};
const SERVER_VERSION = ${JSON.stringify(version)};
const PROMPT_NAME = ${JSON.stringify(promptName)};
const RESOURCE_URI = ${JSON.stringify(resourceUri)};
const SKILL_NAME = ${JSON.stringify(skill.name)};
const DESCRIPTION = ${JSON.stringify(skill.trigger?.intent || skill.name)};
const INSTRUCTIONS = ${JSON.stringify(skill.instructions)};
const TOOL_NAME = ${JSON.stringify(READ_ONLY_TOOL_NAME)};
const TOOL_DESCRIPTOR = ${JSON.stringify(readOnlyToolDescriptor(skill))};

function success(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function failure(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function handleMessage(message) {
  if (message.method === "notifications/initialized") return null;
  if (message.method === "initialize") {
    return success(message.id, {
      protocolVersion: "2024-11-05",
      capabilities: { prompts: {}, resources: {}, tools: {} },
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }
    });
  }
  if (message.method === "prompts/list") {
    return success(message.id, {
      prompts: [{ name: PROMPT_NAME, description: DESCRIPTION, arguments: [] }]
    });
  }
  if (message.method === "prompts/get") {
    if (message.params?.name !== PROMPT_NAME) {
      return failure(message.id, -32602, "Unknown prompt: " + message.params?.name);
    }
    return success(message.id, {
      description: DESCRIPTION,
      messages: [{ role: "user", content: { type: "text", text: INSTRUCTIONS } }]
    });
  }
  if (message.method === "resources/list") {
    return success(message.id, {
      resources: [{ uri: RESOURCE_URI, name: SKILL_NAME, description: DESCRIPTION, mimeType: "text/markdown" }]
    });
  }
  if (message.method === "resources/read") {
    if (message.params?.uri !== RESOURCE_URI) {
      return failure(message.id, -32602, "Unknown resource: " + message.params?.uri);
    }
    return success(message.id, {
      contents: [{ uri: RESOURCE_URI, mimeType: "text/markdown", text: INSTRUCTIONS }]
    });
  }
  if (message.method === "tools/list") {
    return success(message.id, { tools: [TOOL_DESCRIPTOR] });
  }
  if (message.method === "tools/call") {
    if (message.params?.name !== TOOL_NAME) {
      return failure(message.id, -32602, "Unknown tool: " + message.params?.name);
    }
    const args = message.params?.arguments ?? {};
    if (typeof args !== "object" || Array.isArray(args) || Object.keys(args).length > 0) {
      return failure(message.id, -32602, TOOL_NAME + " takes no arguments");
    }
    return success(message.id, {
      content: [{ type: "text", text: INSTRUCTIONS }],
      isError: false
    });
  }
  return failure(message.id, -32601, "Method not found: " + message.method);
}
`;

  if (transport === "stdio") {
    return `${header}
import { stdin, stdout } from "node:process";

let buffer = "";
stdin.setEncoding("utf8");
stdin.on("data", (chunk) => {
  buffer += chunk;
  let newlineIndex;
  while ((newlineIndex = buffer.indexOf("\\n")) >= 0) {
    const line = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);
    if (!line) continue;
    try {
      const reply = handleMessage(JSON.parse(line));
      if (reply) stdout.write(JSON.stringify(reply) + "\\n");
    } catch (error) {
      stdout.write(JSON.stringify(failure(null, -32700, "Parse error: " + error.message)) + "\\n");
    }
  }
});
`;
  }

  return `${header}
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const sessions = new Map();

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");

  if (req.method === "GET" && url.pathname === "/sse") {
    const sessionId = randomUUID();
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });
    sessions.set(sessionId, res);
    res.write("event: endpoint\\ndata: /messages?sessionId=" + sessionId + "\\n\\n");
    const ping = setInterval(() => {
      try { res.write(": ping\\n\\n"); } catch {}
    }, 25000);
    req.on("close", () => {
      clearInterval(ping);
      sessions.delete(sessionId);
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/messages") {
    const sessionId = url.searchParams.get("sessionId");
    const stream = sessions.get(sessionId);
    if (!stream) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("unknown session");
      return;
    }
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1000000) req.destroy();
    });
    req.on("end", () => {
      let message;
      try {
        message = JSON.parse(body);
      } catch (error) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("invalid json: " + error.message);
        return;
      }
      try {
        const reply = handleMessage(message);
        if (reply) stream.write("data: " + JSON.stringify(reply) + "\\n\\n");
        res.writeHead(202, { "Content-Type": "text/plain" });
        res.end("accepted");
      } catch (error) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("handler error: " + error.message);
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("not found");
});

const port = Number(process.env.EOS_MCP_PORT || process.env.PORT || 0);
server.listen(port, "127.0.0.1", () => {
  const address = server.address();
  process.stdout.write(JSON.stringify({
    transport: "sse",
    host: "127.0.0.1",
    port: address.port,
    endpoint: "/sse"
  }) + "\\n");
});
`;
}

function buildPackageJson({ serverName, version, transport }) {
  return {
    name: serverName,
    version,
    type: "module",
    main: "index.js",
    scripts: { start: "node index.js" },
    keywords: ["mcp", "experience-os", "skill", "prompt", "resource", "read-only-tool", transport],
    license: "MIT"
  };
}

async function writeAtomically(filePath, content) {
  const tempPath = `${filePath}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(tempPath, content, "utf8");
  await rename(tempPath, filePath);
}

export async function exportAllStableSkills({ skills, outputDir, options = {} }) {
  const stable = skills.filter((skill) => skill.status === "stable");
  const results = [];
  for (const skill of stable) {
    try {
      const result = await exportSkillAsMcpServer({ skill, outputDir, options });
      results.push({ ok: true, skillId: skill.id, ...result });
    } catch (error) {
      results.push({ ok: false, skillId: skill.id, error: error.message });
    }
  }
  return results;
}
