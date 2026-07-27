/**
 * Start the EOS workbench for one explicitly bootstrapped local workspace.
 *
 * A workbench is intentionally bound to exactly one .eos/vault. This keeps
 * cross-tool experiments isolated instead of turning the UI into an arbitrary
 * filesystem browser or mixing records from different projects.
 */

import { access, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webServerScript = path.join(sourceRoot, "src", "webServer.js");

function parsePort(value) {
  if (value === undefined) return 4180;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("port must be an integer between 1024 and 65535");
  }
  return port;
}

export async function resolveWorkspaceWorkbench({ workspaceDir, port } = {}) {
  if (typeof workspaceDir !== "string" || !workspaceDir.trim()) {
    throw new Error("workspaceDir is required; run: npm run workbench -- <workspace> [port]");
  }

  const workspace = path.resolve(workspaceDir);
  const eosDir = path.join(workspace, ".eos");
  const manifestPath = path.join(eosDir, "project.json");
  const expectedVaultDir = path.join(eosDir, "vault");
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("EOS workspace not found; run npm run bootstrap first");
    }
    throw new Error(`Cannot read .eos/project.json: ${error.message}`);
  }

  if (!manifest?.projectId || typeof manifest.projectId !== "string") {
    throw new Error("EOS workspace manifest is missing projectId");
  }
  if (manifest.vaultDir && path.resolve(workspace, manifest.vaultDir) !== expectedVaultDir) {
    throw new Error("EOS workspace manifest points outside its local .eos/vault boundary");
  }
  try {
    await access(expectedVaultDir);
  } catch {
    throw new Error("EOS workspace vault is missing; run npm run bootstrap again");
  }

  return {
    workspace,
    vaultDir: expectedVaultDir,
    projectId: manifest.projectId,
    port: parsePort(port)
  };
}

export async function startWorkspaceWorkbench(options) {
  const config = await resolveWorkspaceWorkbench(options);
  const child = spawn(process.execPath, [webServerScript], {
    cwd: sourceRoot,
    env: { ...process.env, EOS_VAULT_DIR: config.vaultDir, PORT: String(config.port) },
    stdio: "inherit"
  });
  return { ...config, child };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [workspaceDir, port] = process.argv.slice(2);
  startWorkspaceWorkbench({ workspaceDir, port })
    .then(({ workspace, projectId, port: resolvedPort }) => {
      console.log(`EOS workspace workbench: http://localhost:${resolvedPort}`);
      console.log(`Workspace: ${workspace}`);
      console.log(`Project: ${projectId}`);
    })
    .catch((error) => {
      console.error(`EOS workbench failed: ${error.message}`);
      process.exitCode = 1;
    });
}
