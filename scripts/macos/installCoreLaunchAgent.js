import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const label = "local.experienceos.core";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..", "..");
const launchAgentsDir = path.join(os.homedir(), "Library", "LaunchAgents");
const logsDir = path.join(os.homedir(), "Library", "Logs", "ExperienceOS");
const plistPath = path.join(launchAgentsDir, `${label}.plist`);
const uid = String(process.getuid());
const nodePath = process.execPath;
const serverPath = path.join(rootDir, "src", "webServer.js");
const workspaceDir = path.resolve(process.argv[2] || process.env.EOS_WORKSPACE_DIR || rootDir);
const projectConfigPath = path.join(workspaceDir, ".eos", "project.json");
const vaultDir = path.join(workspaceDir, ".eos", "vault");

if (!existsSync(projectConfigPath)) {
  console.error(`EOS Core requires a bootstrapped workspace: ${projectConfigPath} was not found`);
  process.exit(1);
}

function xml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

await mkdir(launchAgentsDir, { recursive: true });
await mkdir(logsDir, { recursive: true });
await writeFile(plistPath, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${label}</string>
  <key>ProgramArguments</key><array><string>${xml(nodePath)}</string><string>${xml(serverPath)}</string></array>
  <key>WorkingDirectory</key><string>${xml(rootDir)}</string>
  <key>EnvironmentVariables</key><dict>
    <key>EOS_HOST</key><string>127.0.0.1</string>
    <key>PORT</key><string>4173</string>
    <key>EOS_WORKSPACE_DIR</key><string>${xml(workspaceDir)}</string>
    <key>EOS_VAULT_DIR</key><string>${xml(vaultDir)}</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>${xml(path.join(logsDir, "core.log"))}</string>
  <key>StandardErrorPath</key><string>${xml(path.join(logsDir, "core.error.log"))}</string>
</dict></plist>
`);

const domainTarget = `gui/${uid}`;
spawnSync("launchctl", ["bootout", `${domainTarget}/${label}`], { stdio: "ignore" });
const bootstrap = spawnSync("launchctl", ["bootstrap", domainTarget, plistPath], { stdio: "inherit" });
if (bootstrap.status !== 0) process.exit(bootstrap.status ?? 1);
const kickstart = spawnSync("launchctl", ["kickstart", "-k", `${domainTarget}/${label}`], { stdio: "inherit" });
if (kickstart.status !== 0) process.exit(kickstart.status ?? 1);

console.log(`EOS Core is installed as a login service: ${label}`);
console.log(`Workspace: ${workspaceDir}`);
console.log(`Vault: ${vaultDir}`);
console.log(`Status: npm run macos:core-status`);
