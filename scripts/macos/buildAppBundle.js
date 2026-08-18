import os from "node:os";
import { cp, chmod, mkdir, rm, writeFile , stat , glob } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { EOS_VERSION } from "../../src/version.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..", "..");
const packageDir = path.join(rootDir, "apps", "macos", "EOSMenuBar");
const appDir = path.join(rootDir, "dist", "EOS.app");
const macOSDir = path.join(appDir, "Contents", "MacOS");
const executableName = "EOSMenuBar";
const resourcesDir = path.join(appDir, "Contents", "Resources");
const bundledCoreDir = path.join(resourcesDir, "eos-core");
const runtimeDir = path.join(resourcesDir, "runtime");
const brandLogo = path.join(rootDir, "assets", "brand", "eos-logo-primary.png");
const iconsetDir = path.join(rootDir, "dist", ".EOS.iconset");
const shortVersion = EOS_VERSION.match(/^\d+\.\d+\.\d+/)?.[0] || "0.0.0";

function runRequired(command, args, description) {
  const result = spawnSync(command, args, { cwd: rootDir, stdio: "pipe" });
  if (result.error || result.status !== 0) {
    const detail = result.stderr?.toString().trim() || result.error?.message || `exit ${result.status}`;
    throw new Error(`${description}: ${detail}`);
  }
}

const build = spawnSync("swift", ["build", "--configuration", "release", "--package-path", packageDir], {
  cwd: rootDir,
  stdio: "inherit"
});

if (build.error) {
  console.error(`Build failed: swift not found or unavailable: ${build.error.message}`);
  console.error("Install Swift from https://www.swift.org/install/ or Xcode from the App Store.");
  process.exit(1);
}

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const executable = path.join(packageDir, ".build", "release", executableName);
await rm(appDir, { recursive: true, force: true });
await mkdir(macOSDir, { recursive: true });
await mkdir(resourcesDir, { recursive: true });
await cp(executable, path.join(macOSDir, executableName));
await chmod(path.join(macOSDir, executableName), 0o755);
await mkdir(path.join(bundledCoreDir, "apps"), { recursive: true });
await mkdir(runtimeDir, { recursive: true });
await cp(path.join(rootDir, "src"), path.join(bundledCoreDir, "src"), { recursive: true });
await cp(path.join(rootDir, "apps", "web"), path.join(bundledCoreDir, "apps", "web"), { recursive: true });
await writeFile(path.join(bundledCoreDir, "package.json"), `${JSON.stringify({
  name: "experience-os-bundled-core",
  version: EOS_VERSION,
  private: true,
  type: "module"
}, null, 2)}\n`);
// Bundled runtime must be a real Node binary (>=10MB); the TRAE toolchain ships
// a ~68KB launcher shim at process.execPath that cannot run standalone.
const runtimeCandidates = [
  process.env.EOS_NODE_RUNTIME,
  process.execPath,
  "/usr/local/bin/node",
  "/opt/homebrew/bin/node",
  ...(await Array.fromAsync(glob(path.join(os.homedir(), ".nvm/versions/node/*/bin/node"))))
].filter(Boolean);
let nodeRuntime = null;
for (const candidate of runtimeCandidates) {
  try {
    if ((await stat(candidate)).size >= 10 * 1024 * 1024) { nodeRuntime = candidate; break; }
  } catch { /* try next */ }
}
if (!nodeRuntime) {
  const which = spawnSync("zsh", ["-lc", "which -a node"], { encoding: "utf8" });
  for (const line of (which.stdout || "").split("\n")) {
    const candidate = line.trim();
    if (!candidate) continue;
    try {
      if ((await stat(candidate)).size >= 10 * 1024 * 1024) { nodeRuntime = candidate; break; }
    } catch { /* try next */ }
  }
}
if (!nodeRuntime) throw new Error("No standalone Node runtime (>=10MB) found; set EOS_NODE_RUNTIME");
console.log(`Bundled Node runtime: ${nodeRuntime}`);
await cp(nodeRuntime, path.join(runtimeDir, "node"));
await chmod(path.join(runtimeDir, "node"), 0o755);
await cp(brandLogo, path.join(resourcesDir, "EOSLogo.png"));
await rm(iconsetDir, { recursive: true, force: true });
await mkdir(iconsetDir, { recursive: true });
for (const [filename, pixels] of [
  ["icon_16x16.png", 16],
  ["icon_16x16@2x.png", 32],
  ["icon_32x32.png", 32],
  ["icon_32x32@2x.png", 64],
  ["icon_128x128.png", 128],
  ["icon_128x128@2x.png", 256],
  ["icon_256x256.png", 256],
  ["icon_256x256@2x.png", 512],
  ["icon_512x512.png", 512],
  ["icon_512x512@2x.png", 1024]
]) {
  runRequired("sips", ["-z", String(pixels), String(pixels), brandLogo, "--out", path.join(iconsetDir, filename)], "App icon resize failed");
}
runRequired("iconutil", ["-c", "icns", iconsetDir, "-o", path.join(resourcesDir, "EOS.icns")], "App icon generation failed");
await rm(iconsetDir, { recursive: true, force: true });
await writeFile(path.join(appDir, "Contents", "Info.plist"), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleDisplayName</key><string>EOS</string>
  <key>CFBundleExecutable</key><string>${executableName}</string>
  <key>CFBundleIdentifier</key><string>local.experienceos.menubar</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleIconFile</key><string>EOS.icns</string>
  <key>CFBundleName</key><string>EOS</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>${shortVersion}</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>CFBundleDevelopmentRegion</key><string>zh-CN</string>
  <key>LSMinimumSystemVersion</key><string>14.0</string>
  <key>LSUIElement</key><false/>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSAppTransportSecurity</key><dict>
    <key>NSAllowsLocalNetworking</key><true/>
  </dict>
  <key>NSHumanReadableCopyright</key><string>Experience OS</string>
</dict></plist>
`);
await writeFile(path.join(appDir, "Contents", "PkgInfo"), "APPL????");

// Ad-hoc code signing for local testing
for (const nestedExecutable of [path.join(runtimeDir, "node"), path.join(macOSDir, executableName)]) {
  const nestedSign = spawnSync("codesign", ["--sign", "-", "--force", nestedExecutable], {
    cwd: rootDir,
    stdio: "pipe"
  });
  if (nestedSign.status !== 0) {
    console.error(`Ad-hoc signing failed for ${nestedExecutable}: ${nestedSign.stderr?.toString().trim()}`);
    process.exit(nestedSign.status ?? 1);
  }
}
const sign = spawnSync("codesign", ["--sign", "-", "--force", appDir], {
  cwd: rootDir,
  stdio: "pipe"
});
if (sign.status !== 0) {
  console.error(`Ad-hoc app signing failed: ${sign.stderr?.toString().trim()}`);
  process.exit(sign.status ?? 1);
} else {
  console.log("Ad-hoc code signing complete.");
}

const verify = spawnSync("codesign", ["--verify", "--deep", "--strict", "--verbose=2", appDir], {
  cwd: rootDir,
  stdio: "pipe"
});
if (verify.status !== 0) {
  console.error(`Code signature verification failed: ${verify.stderr?.toString().trim()}`);
  process.exit(verify.status ?? 1);
}

console.log(`Built local macOS app: ${appDir}`);
console.log(`Bundled Core version: ${EOS_VERSION}`);
console.log(`Open it with: open ${JSON.stringify(appDir)}`);
