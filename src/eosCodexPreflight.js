/**
 * Read-only Codex integration preflight for an EOS workspace.
 *
 * It never changes ~/.codex. Instead it validates the workspace boundary,
 * detects the local Codex CLI and reports the exact opt-in MCP command.
 */

import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveWorkspaceWorkbench } from "./eosWorkbench.js";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const relayScript = path.join(sourceRoot, "src", "eosRelayMcp.js");

function run(command, args) {
  return new Promise((resolve) => {
    const opts = { encoding: "utf8", timeout: 10_000 };
    // Windows: .cmd files need shell execution
    if (isWindows() && command.endsWith(".cmd")) {
      execFile(command, args, { ...opts, shell: true }, (error, stdout, stderr) => {
        resolve({ ok: !error, stdout: String(stdout || ""), stderr: String(stderr || ""), error: error?.message || null });
      });
    } else {
      execFile(command, args, opts, (error, stdout, stderr) => {
        resolve({ ok: !error, stdout: String(stdout || ""), stderr: String(stderr || ""), error: error?.message || null });
      });
    }
  });
}

function shellQuote(value) {
  // Safe single-quote for shell: wrap in single quotes, escape internal single quotes
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function isWindows() {
  return process.platform === "win32";
}

function codexBinary() {
  return isWindows() ? "codex.cmd" : "codex";
}

export function codexInstallCommand({ vaultDir, nodePath = process.execPath }) {
  return `codex mcp add experience-os --env EOS_VAULT_DIR=${shellQuote(vaultDir)} --env EOS_CAPTURE_POLICY=strict_permit -- ${shellQuote(nodePath)} ${shellQuote(relayScript)}`;
}

export function codexSwitchCommand({ vaultDir, nodePath = process.execPath }) {
  return `codex mcp remove experience-os 2>/dev/null; ${codexInstallCommand({ vaultDir, nodePath })}`;
}

function readRegisteredVault(server) {
  const value = server?.transport?.env?.EOS_VAULT_DIR;
  return typeof value === "string" && value.trim() ? path.resolve(value) : null;
}

export async function checkCodexIntegration({ workspaceDir } = {}) {
  const workspace = await resolveWorkspaceWorkbench({ workspaceDir });
  const codex = codexBinary();
  const version = await run(codex, ["--version"]);
  const registeredServer = version.ok ? await run(codex, ["mcp", "get", "experience-os", "--json"]) : null;
  let registeredConfig = null;
  if (registeredServer?.ok) {
    try { registeredConfig = JSON.parse(registeredServer.stdout); } catch { registeredConfig = null; }
  }
  const boundVaultDir = readRegisteredVault(registeredConfig);
  const registered = Boolean(registeredConfig);
  const activeForWorkspace = boundVaultDir === workspace.vaultDir;
  const status = !version.ok
    ? "codex_not_found"
    : !registered
      ? "ready_to_install"
      : activeForWorkspace
        ? "active_for_workspace"
        : "registered_for_other_workspace";
  return {
    workspace: workspace.workspace,
    projectId: workspace.projectId,
    vaultDir: workspace.vaultDir,
    codex: {
      detected: version.ok,
      version: version.ok ? version.stdout.trim() : null,
      eosRelayRegistered: registered,
      status,
      boundVaultDir,
      activeForWorkspace
    },
    relay: {
      command: process.execPath,
      args: [relayScript],
      env: { EOS_VAULT_DIR: workspace.vaultDir, EOS_CAPTURE_POLICY: "strict_permit" }
    },
    installCommand: codexInstallCommand({ vaultDir: workspace.vaultDir }),
    switchCommand: registered && !activeForWorkspace
      ? codexSwitchCommand({ vaultDir: workspace.vaultDir })
      : null
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [workspaceDir] = process.argv.slice(2);
  checkCodexIntegration({ workspaceDir })
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => { console.error(`EOS Codex preflight failed: ${error.message}`); process.exitCode = 1; });
}
