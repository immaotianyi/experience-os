import { cp, chmod, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..", "..");
const packageDir = path.join(rootDir, "apps", "macos", "EOSMenuBar");
const appDir = path.join(rootDir, "dist", "EOS.app");
const macOSDir = path.join(appDir, "Contents", "MacOS");
const executableName = "EOSMenuBar";

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
await mkdir(path.join(appDir, "Contents", "Resources"), { recursive: true });
await cp(executable, path.join(macOSDir, executableName));
await chmod(path.join(macOSDir, executableName), 0o755);
await writeFile(path.join(appDir, "Contents", "Info.plist"), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleDisplayName</key><string>EOS</string>
  <key>CFBundleExecutable</key><string>${executableName}</string>
  <key>CFBundleIdentifier</key><string>local.experienceos.menubar</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleName</key><string>EOS</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>0.1.0-alpha</string>
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
const sign = spawnSync("codesign", ["--sign", "-", "--force", "--deep", appDir], {
  cwd: rootDir,
  stdio: "pipe"
});
if (sign.status !== 0) {
  console.warn(`Warning: ad-hoc code signing failed (may require manual signing): ${sign.stderr?.toString().trim()}`);
} else {
  console.log("Ad-hoc code signing complete.");
}

console.log(`Built local macOS app: ${appDir}`);
console.log(`Open it with: open ${JSON.stringify(appDir)}`);
