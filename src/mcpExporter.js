/**
 * MCP Exporter — exports a stable Skill as a self-contained MCP Server.
 *
 * Given a Skill record, generates:
 * - server.json: MCP server manifest with tool definitions
 * - README.md: human-readable documentation
 * - index.js: executable MCP server entry point (stdio transport)
 *
 * Mapping rules:
 * - Skill.trigger.intent → MCP tool name (slugified)
 * - Skill.inputSchema → MCP tool inputSchema
 * - Skill.outputSchema → MCP tool outputSchema (annotations)
 * - Skill.safetyLevel → execution policy (L1-L2 = auto, L3-L4 = requires confirmation)
 * - Skill.fallback → error handler description
 * - Skill.humanConfirmationRequired → MCP tool annotation readOnlyHint
 *
 * Only stable Skills can be exported. Candidate/rejected Skills are rejected.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { slug } from "./utils.js";

/**
 * Export a Skill as an MCP Server directory.
 *
 * @param {Object} params
 * @param {Object} params.skill - The Skill record to export
 * @param {string} params.outputDir - Base directory for exported servers
 * @param {Object} [params.options] - Export options
 * @param {string} [params.options.transport] - "stdio" (default) or "sse"
 * @param {string} [params.options.version] - Server version string
 * @returns {Promise<{ serverDir: string, files: string[], manifest: Object }>}
 */
export async function exportSkillAsMcpServer({ skill, outputDir, options = {} }) {
  if (!skill || skill.kind !== "Skill") {
    throw new Error("Only Skill records can be exported as MCP Servers");
  }
  if (skill.status !== "stable") {
    throw new Error(`Skill must be 'stable' to export (current: ${skill.status})`);
  }

  const transport = options.transport || "stdio";
  const version = options.version || "1.0.0";
  const serverName = `eos-${slug(skill.name)}`;
  const serverDir = path.join(outputDir, serverName);

  await mkdir(serverDir, { recursive: true });

  const toolName = slug(skill.trigger?.intent || skill.name);
  const requiresConfirmation = skill.humanConfirmationRequired || isHighSafetyLevel(skill.safetyLevel);

  const manifest = buildServerManifest({
    skill,
    serverName,
    toolName,
    transport,
    version,
    requiresConfirmation
  });

  const readme = buildReadme({ skill, serverName, toolName, transport, version });
  const entryPoint = buildEntryPoint({ skill, serverName, toolName, transport });

  const files = [];

  const manifestPath = path.join(serverDir, "server.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  files.push(manifestPath);

  const readmePath = path.join(serverDir, "README.md");
  await writeFile(readmePath, readme, "utf8");
  files.push(readmePath);

  const entryPath = path.join(serverDir, "index.js");
  await writeFile(entryPath, entryPoint, "utf8");
  files.push(entryPath);

  const pkgPath = path.join(serverDir, "package.json");
  await writeFile(pkgPath, JSON.stringify(buildPackageJson({ serverName, version }), null, 2) + "\n", "utf8");
  files.push(pkgPath);

  return { serverDir, files, manifest, serverName };
}

/**
 * Build the MCP server manifest (server.json).
 */
function buildServerManifest({ skill, serverName, toolName, transport, version, requiresConfirmation }) {
  return {
    name: serverName,
    version,
    description: `MCP Server generated from Experience OS Skill: ${skill.name}`,
    transport,
    tools: [
      {
        name: toolName,
        description: skill.trigger?.intent || skill.name,
        inputSchema: skill.inputSchema || { type: "object", properties: {} },
        outputSchema: skill.outputSchema || { type: "object", properties: {} },
        annotations: {
          readOnlyHint: !requiresConfirmation,
          destructiveHint: isHighSafetyLevel(skill.safetyLevel),
          idempotentHint: skill.safetyLevel === "L1",
          openWorldHint: false
        },
        safety: {
          level: skill.safetyLevel,
          fallback: skill.fallback,
          humanConfirmationRequired: skill.humanConfirmationRequired
        }
      }
    ],
    metadata: {
      sourceSkillId: skill.id,
      sourceProjectId: skill.projectId,
      skillLevel: skill.skillLevel,
      exportedAt: new Date().toISOString()
    }
  };
}

/**
 * Build the README.md content.
 */
function buildReadme({ skill, serverName, toolName, transport, version }) {
  const safetyDesc = skill.humanConfirmationRequired
    ? "requires human confirmation before execution"
    : "executes automatically without human confirmation";

  return `# ${serverName}

MCP Server generated from Experience OS Skill: **${skill.name}**.

## Tool: \`${toolName}\`

${skill.trigger?.intent || skill.name}

- **Safety Level:** ${skill.safetyLevel}
- **Confirmation:** ${safetyDesc}
- **Fallback:** ${skill.fallback || "none"}

## Input Schema

\`\`\`json
${JSON.stringify(skill.inputSchema || {}, null, 2)}
\`\`\`

## Output Schema

\`\`\`json
${JSON.stringify(skill.outputSchema || {}, null, 2)}
\`\`\`

## Transport

${transport}

## Version

${version}

## Source

- Skill ID: \`${skill.id}\`
- Project ID: \`${skill.projectId}\`
- Skill Level: ${skill.skillLevel}
- Exported at: ${new Date().toISOString()}

## Usage

\`\`\`bash
node index.js
\`\`\`

Connect from an MCP-compatible client (Claude, Cursor, etc.) by adding this server to your MCP configuration.
`;
}

/**
 * Build the executable entry point (index.js).
 * Generates a minimal stdio MCP server that responds to tool calls.
 */
function buildEntryPoint({ skill, serverName, toolName, transport }) {
  const inputSchema = JSON.stringify(skill.inputSchema || {});
  const fallback = (skill.fallback || "Return error message").replace(/`/g, "\\`");

  if (transport === "sse") {
    return `/**
 * ${serverName} — MCP Server (SSE transport)
 * Auto-generated from Experience OS Skill: ${skill.id}
 */

import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 4100);
const TOOL_NAME = "${toolName}";
const INPUT_SCHEMA = ${inputSchema};

const server = createServer((req, res) => {
  if (req.url === "/sse") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });
    res.write("event: ready\\n");
    res.write("data: " + JSON.stringify({ tools: [{ name: TOOL_NAME, inputSchema: INPUT_SCHEMA }] }) + "\\n\\n");
    req.on("close", () => res.end());
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log("MCP Server (SSE) listening on port " + PORT);
});
`;
  }

  return `/**
 * MCP Server (stdio transport)
 * Auto-generated from Experience OS Skill: ${skill.id}
 *
 * Implements a minimal JSON-RPC 2.0 server over stdio
 * that responds to tools/list and tools/call.
 */

import { stdin, stdout } from "node:process";

const TOOL_NAME = "${toolName}";
const TOOL_DESCRIPTION = ${JSON.stringify(skill.trigger?.intent || skill.name)};
const INPUT_SCHEMA = ${inputSchema};
const FALLBACK = ${JSON.stringify(skill.fallback || "Return error message")};
const SAFETY_LEVEL = ${JSON.stringify(skill.safetyLevel)};
const REQUIRES_CONFIRMATION = ${skill.humanConfirmationRequired};

function handleMessage(msg) {
  if (msg.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: msg.id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "eos-mcp-server", version: "1.0.0" }
      }
    };
  }

  if (msg.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id: msg.id,
      result: {
        tools: [{
          name: TOOL_NAME,
          description: TOOL_DESCRIPTION,
          inputSchema: INPUT_SCHEMA,
          annotations: {
            readOnlyHint: !REQUIRES_CONFIRMATION,
            destructiveHint: SAFETY_LEVEL === "L3" || SAFETY_LEVEL === "L4",
            idempotentHint: SAFETY_LEVEL === "L1",
            openWorldHint: false
          }
        }]
      }
    };
  }

  if (msg.method === "tools/call") {
    const toolName = msg.params?.name;
    if (toolName !== TOOL_NAME) {
      return {
        jsonrpc: "2.0",
        id: msg.id,
        error: { code: -32601, message: "Unknown tool: " + toolName }
      };
    }

    // Execute the skill logic
    // In production, this would call the actual Skill execution engine.
    // For now, we return a placeholder that includes the input for verification.
    const args = msg.params?.arguments || {};
    return {
      jsonrpc: "2.0",
      id: msg.id,
      result: {
        content: [{
          type: "text",
          text: JSON.stringify({
            tool: TOOL_NAME,
            receivedArgs: args,
            safetyLevel: SAFETY_LEVEL,
            requiresConfirmation: REQUIRES_CONFIRMATION,
            fallback: FALLBACK,
            note: "This is an auto-generated MCP server. Connect a real execution engine to run the Skill."
          }, null, 2)
        }]
      }
    };
  }

  return {
    jsonrpc: "2.0",
    id: msg.id,
    error: { code: -32601, message: "Method not found: " + msg.method }
  };
}

let buffer = "";

stdin.setEncoding("utf8");
stdin.on("data", (chunk) => {
  buffer += chunk;
  let newlineIdx;
  while ((newlineIdx = buffer.indexOf("\\n")) >= 0) {
    const line = buffer.slice(0, newlineIdx).trim();
    buffer = buffer.slice(newlineIdx + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      const reply = handleMessage(msg);
      stdout.write(JSON.stringify(reply) + "\\n");
    } catch (e) {
      stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error: " + e.message }
      }) + "\\n");
    }
  }
});
`;
}

/**
 * Build a minimal package.json for the exported server.
 */
function buildPackageJson({ serverName, version }) {
  return {
    name: serverName,
    version,
    type: "module",
    main: "index.js",
    scripts: {
      start: "node index.js"
    },
    keywords: ["mcp", "experience-os", "skill"],
    license: "MIT"
  };
}

/**
 * Check if a safety level requires extra caution.
 */
function isHighSafetyLevel(level) {
  return level === "L3" || level === "L4";
}

/**
 * Batch export all stable Skills as MCP Servers.
 *
 * @param {Object} params
 * @param {Array} params.skills - Array of Skill records
 * @param {string} params.outputDir - Base output directory
 * @param {Object} [params.options] - Export options
 * @returns {Promise<Array>} Array of export results
 */
export async function exportAllStableSkills({ skills, outputDir, options = {} }) {
  const stable = skills.filter((s) => s.status === "stable");
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
