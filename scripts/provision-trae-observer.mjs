/**
 * Provision MCP relay self-observation for one workspace + host (default trae).
 *
 * 1. Approves a metadata-only HostObservationConsent inside the workspace Vault.
 * 2. Writes the capture token to the 0600 secrets file the relay reads.
 * 3. Prints the MCP registration fragment to paste into the host's UI.
 *
 * Usage:
 *   node scripts/provision-trae-observer.mjs --workspace <projectRoot> [--host trae]
 */

import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile, chmod } from "node:fs/promises";
import { GitVault } from "../src/gitVault.js";
import { approveHostObservationConsent } from "../src/hostObservationEngine.js";
import { MCP_RELAY_HOSTS, mcpRelayTokenPath } from "../src/hostHookPlan.js";

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const workspaceDir = path.resolve(argValue("--workspace") || process.cwd());
const host = (argValue("--host") || "trae").toLowerCase();
if (!MCP_RELAY_HOSTS.has(host)) {
  console.error(`unsupported host: ${host} (expected one of ${[...MCP_RELAY_HOSTS].join(", ")})`);
  process.exit(1);
}

const vaultDir = path.join(workspaceDir, ".eos", "vault");
const vault = new GitVault(vaultDir);
await vault.init();

let projectId = argValue("--project-id");
if (!projectId) {
  const projects = (await vault.list("Project")).sort((a, b) =>
    String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))
  );
  if (projects.length === 0) {
    console.error(`no Project found in ${vaultDir}; connect the workspace first via /api/workspaces/connect`);
    process.exit(1);
  }
  if (projects.length > 1) {
    console.error(`multiple Projects in Vault; pass one explicitly via --project-id: ${projects.map((p) => p.id).join(", ")}`);
    process.exit(1);
  }
  projectId = projects[0].id;
}

const consent = await approveHostObservationConsent(vault, {
  projectId,
  host,
  approvedBy: os.userInfo().username,
  metadataOnlyAcknowledged: true
});

const tokenPath = mcpRelayTokenPath(host, workspaceDir);
await mkdir(path.dirname(tokenPath), { recursive: true });
await writeFile(tokenPath, `${consent.captureToken}\n`, { mode: 0o600 });
await chmod(tokenPath, 0o600);

const relayPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "eosRelayMcp.js");
const registration = {
  mcpServers: {
    "experience-os": {
      command: process.execPath,
      args: [relayPath],
      env: {
        EOS_VAULT_DIR: vaultDir,
        EOS_CAPTURE_POLICY: "strict_permit",
        EOS_RELAY_HOST: host
      }
    }
  }
};

console.log(`host:          ${host}`);
console.log(`workspace:     ${workspaceDir}`);
console.log(`projectId:     ${projectId}`);
console.log(`consentId:     ${consent.id}`);
console.log(`token file:    ${tokenPath} (0600)`);
console.log("\nPaste this into the host's MCP management UI:");
console.log(JSON.stringify(registration, null, 2));
