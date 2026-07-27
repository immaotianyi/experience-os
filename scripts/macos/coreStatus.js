import os from "node:os";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const label = "local.experienceos.core";
const uid = String(process.getuid());
const plistPath = path.join(os.homedir(), "Library", "LaunchAgents", `${label}.plist`);
const result = spawnSync("launchctl", ["print", `gui/${uid}/${label}`], { encoding: "utf8" });

console.log(JSON.stringify({
  label,
  plistPath,
  plistInstalled: existsSync(plistPath),
  loaded: result.status === 0,
  launchctl: result.status === 0 ? "loaded" : "not_loaded"
}, null, 2));
