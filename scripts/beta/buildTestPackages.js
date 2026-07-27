import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = path.join(root, "dist", "beta");
const winZip = "/private/tmp/node-v24.14.0-win-x64.zip";
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
async function core(target) {
  await cp(path.join(root, "src"), path.join(target, "eos-core", "src"), { recursive: true });
  await cp(path.join(root, "apps", "web"), path.join(target, "eos-core", "apps", "web"), { recursive: true });
}
const guide = `# EOS Beta Tester Guide

1. Open **Start EOS**. It creates an isolated local workspace at Documents/EOS Beta Workspace and opens http://127.0.0.1:4173.
2. Create a small real project, add one explicitly consented evidence item, create and review an Experience Receipt, then record its outcome.
3. Use the feedback link supplied with your invitation. Report clarity and usefulness from 1-5, what helped, and what blocked you. Do not include chat transcripts, passwords, API keys, or personal data.

EOS does not silently inspect AI clients or other applications. Strict capture permits are on. To remove the trial, close EOS and delete Documents/EOS Beta Workspace.
`;
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
run("npm", ["run", "web:build"]);
run("npm", ["run", "macos:bundle"]);

const mac = path.join(out, "EOS-macOS-AppleSilicon-Beta");
await mkdir(path.join(mac, "runtime"), { recursive: true });
await core(mac);
await cp(path.join(root, "dist", "EOS.app"), path.join(mac, "EOS.app"), { recursive: true });
await cp(process.execPath, path.join(mac, "runtime", "node"));
await writeFile(path.join(mac, "Start EOS.command"), `#!/bin/zsh
ROOT="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE="$HOME/Documents/EOS Beta Workspace"
mkdir -p "$WORKSPACE"
"$ROOT/runtime/node" "$ROOT/eos-core/src/eosBootstrap.js" "$WORKSPACE" "EOS Beta Workspace"
open "http://127.0.0.1:4173"
EOS_VAULT_DIR="$WORKSPACE/.eos/vault" EOS_HOST=127.0.0.1 PORT=4173 "$ROOT/runtime/node" "$ROOT/eos-core/src/webServer.js"
`, { mode: 0o755 });
await writeFile(path.join(mac, "TESTER_GUIDE.md"), guide);
run("ditto", ["-c", "-k", "--keepParent", mac, path.join(out, "EOS-macOS-AppleSilicon-Beta.zip")]);

const win = path.join(out, "EOS-Windows-x64-Beta");
await mkdir(win, { recursive: true });
await core(win);
run("unzip", ["-q", winZip, "-d", path.join(out, "node-win")]);
await cp(path.join(out, "node-win", "node-v24.14.0-win-x64"), path.join(win, "runtime"), { recursive: true });
await rm(path.join(out, "node-win"), { recursive: true, force: true });
await writeFile(path.join(win, "Start EOS.cmd"), [
  "@echo off", "set \"ROOT=%~dp0\"", "set \"WORKSPACE=%USERPROFILE%\\Documents\\EOS Beta Workspace\"",
  "if not exist \"%WORKSPACE%\" mkdir \"%WORKSPACE%\"", "\"%ROOT%runtime\\node.exe\" \"%ROOT%eos-core\\src\\eosBootstrap.js\" \"%WORKSPACE%\" \"EOS Beta Workspace\"",
  "start \"\" \"http://127.0.0.1:4173\"", "set \"EOS_VAULT_DIR=%WORKSPACE%\\.eos\\vault\"", "set \"EOS_HOST=127.0.0.1\"", "set \"PORT=4173\"",
  "\"%ROOT%runtime\\node.exe\" \"%ROOT%eos-core\\src\\webServer.js\"", ""
].join("\r\n"));
await writeFile(path.join(win, "TESTER_GUIDE.md"), guide);
run("ditto", ["-c", "-k", "--keepParent", win, path.join(out, "EOS-Windows-x64-Beta.zip")]);
console.log(`Built Beta packages: ${out}`);
