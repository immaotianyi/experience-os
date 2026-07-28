/**
 * Create the local Experience OS home for an existing workspace.
 *
 * EOS never moves project files or scans content during bootstrap. It adds a
 * small, visible `.eos/` directory and initializes an isolated local Vault.
 */

import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GitVault } from "./gitVault.js";
import { startProject } from "./projectEngine.js";
import { safeIdSlug } from "./utils.js";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const relayScript = path.join(sourceRoot, "src", "eosRelayMcp.js");

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

export async function bootstrapWorkspace({ workspaceDir, name = null, goal = null }) {
  if (typeof workspaceDir !== "string" || !workspaceDir.trim()) {
    throw new Error("workspaceDir is required");
  }
  const workspace = path.resolve(workspaceDir);
  const eosDir = path.join(workspace, ".eos");
  const vaultDir = path.join(eosDir, "vault");
  const projectName = name?.trim() || path.basename(workspace);
  const manifestPath = path.join(eosDir, "project.json");
  let existingManifest = null;
  if (await exists(manifestPath)) {
    try {
      existingManifest = JSON.parse(await readFile(manifestPath, "utf8"));
    } catch (error) {
      throw new Error(`Cannot read .eos/project.json: file is corrupted or invalid JSON. Fix or remove it and re-run bootstrap. Details: ${error.message}`);
    }
  }
  const projectId = existingManifest?.projectId || `project.${safeIdSlug(projectName, "workspace")}`;
  const projectPath = path.join(vaultDir, "projects", `${projectId}.json`);

  await mkdir(eosDir, { recursive: true });
  const vault = new GitVault(vaultDir);
  await vault.init();

  let projectCreated = false;
  if (!(await exists(projectPath))) {
    await startProject(vault, {
      id: projectId,
      name: projectName,
      goal: goal?.trim() || "Capture and verify reusable experience from this workspace.",
      autonomyMode: "advise",
      tags: ["bootstrapped"]
    });
    projectCreated = true;
  }

  const manifest = {
    version: 1,
    projectId,
    workspace,
    vaultDir,
    createdAt: new Date().toISOString(),
    capture: { defaultConsent: false, storage: "local", policy: "strict_permit" }
  };
  const mcpConfig = {
    mcpServers: {
      "experience-os": {
        command: process.execPath,
        args: [relayScript],
        env: { EOS_VAULT_DIR: vaultDir, EOS_CAPTURE_POLICY: "strict_permit" }
      }
    }
  };
  const readme = `# Experience OS local workspace

This directory is EOS's visible local memory and governance boundary for this workspace.

- **Project ID:** \`${projectId}\`
- **Storage:** local Git-backed Vault in \`vault/\`
- **Default autonomy:** \`advise\`
- **Capture:** strict human permit required for MCP capture; EOS does not silently observe your applications.

## MCP connection

Use \`mcp.json\` as the server definition in an MCP-compatible client. The relay exposes:

- \`eos_capture_collaboration\` — capture one explicitly consented fragment
- \`eos_prepare_capture_permit\` — request a human review before strict capture
- \`eos_project_readiness\` — see what blocks promotion
- \`eos_verified_experience\` — retrieve approved experience assets
- \`eos_project_timeline\` — read the evidence-first timeline

The workspace's business files are untouched. You may delete \`.eos/\` to remove this local EOS installation.

## Local workbench

From the EOS source directory, run:

\`npm run workbench -- "${workspace}" 4180\`

This opens the same workbench against this workspace's local Vault only. It does not mix this project's records with EOS's default Vault.
`;

  await Promise.all([
    writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
    writeFile(path.join(eosDir, "mcp.json"), `${JSON.stringify(mcpConfig, null, 2)}\n`, "utf8"),
    writeFile(path.join(eosDir, "README.md"), readme, "utf8")
  ]);

  return { workspace, eosDir, vaultDir, projectId, projectCreated, mcpConfig };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [workspaceDir, name, goal] = process.argv.slice(2);
  bootstrapWorkspace({ workspaceDir, name, goal })
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => { console.error(`EOS bootstrap failed: ${error.message}`); process.exitCode = 1; });
}
