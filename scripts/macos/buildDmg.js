import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { cp, mkdir, rm, stat, symlink, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EOS_VERSION } from "../../src/version.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const distDir = path.join(rootDir, "dist");
const appDir = path.join(distDir, "EOS.app");
const architecture = process.arch === "arm64" ? "arm64" : process.arch;
const baseName = `EOS-${EOS_VERSION}-macOS-${architecture}`;
const dmgPath = path.join(distDir, `${baseName}.dmg`);
const stageDir = path.join(distDir, ".dmg-stage");
const mountDir = path.join(distDir, ".dmg-mount");

function run(command, args, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit"
  });
  if (result.error || result.status !== 0) {
    const detail = result.stderr?.trim() || result.error?.message || `exit ${result.status}`;
    throw new Error(`${command} failed: ${detail}`);
  }
  return result.stdout || "";
}

async function sha256(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

run("npm", ["run", "web:build"]);
run(process.execPath, [path.join(rootDir, "scripts", "macos", "buildAppBundle.js")]);

await rm(stageDir, { recursive: true, force: true });
await rm(mountDir, { recursive: true, force: true });
await rm(dmgPath, { force: true });
await mkdir(stageDir, { recursive: true });
await cp(appDir, path.join(stageDir, "EOS.app"), { recursive: true });
await symlink("/Applications", path.join(stageDir, "Applications"));
await writeFile(path.join(stageDir, "安装与隐私说明.txt"), `Experience OS ${EOS_VERSION} macOS ${architecture}

安装
1. 将 EOS.app 拖入 Applications。
2. 首次打开时，如 macOS 提示来源未验证，请在“系统设置 > 隐私与安全性”中确认打开。
3. EOS 会在本机 127.0.0.1:4173 启动内置 Core，并直接显示应用内工作台。
4. 关闭完整工作台后，EOS 仍在菜单栏 Agent 雷达和屏幕边缘三灯悬浮窗运行；点击悬浮窗即可查看待办或重新打开工作台，不需要浏览器。
5. 菜单栏三灯显示全局状态，展开后可分别查看 Codex、Claude Code、Cursor、TRAE、VS Code 等已安装宿主；只有具备实时事件证据的宿主才会显示工作中。

数据
- 默认工作区：~/Library/Application Support/ExperienceOS/Workspace
- Core 日志：~/Library/Application Support/ExperienceOS/Logs/core.log
- EOS 默认使用 strict_permit；不会静默保存聊天正文。
- 项目级 Hook 必须在工作台内经过许可和差异两次确认。
- 应用内工作台只允许本机 EOS 地址；外部链接会交给默认浏览器。

卸载
1. 从 EOS 菜单栏弹层退出应用。
2. 删除 Applications/EOS.app。
3. 如需同时删除本地 EOS 数据，再删除 ~/Library/Application Support/ExperienceOS。

签名说明
本包使用临时 ad-hoc 签名，尚未使用 Apple Developer ID 签名或公证，仅用于受邀测试。
`);

run("hdiutil", [
  "create",
  "-volname", "Experience OS",
  "-srcfolder", stageDir,
  "-ov",
  "-format", "UDZO",
  dmgPath
]);
run("codesign", ["--sign", "-", "--force", dmgPath]);
run("codesign", ["--verify", "--verbose=2", dmgPath]);

await mkdir(mountDir, { recursive: true });
let attached = false;
try {
  run("hdiutil", ["attach", dmgPath, "-nobrowse", "-readonly", "-mountpoint", mountDir], { capture: true });
  attached = true;
  const mountedApp = path.join(mountDir, "EOS.app");
  run("codesign", ["--verify", "--deep", "--strict", "--verbose=2", mountedApp]);
  for (const required of [
    "Contents/MacOS/EOSMenuBar",
    "Contents/Resources/runtime/node",
    "Contents/Resources/EOS.icns",
    "Contents/Resources/EOSLogo.png",
    "Contents/Resources/eos-core/package.json",
    "Contents/Resources/eos-core/src/webServer.js",
    "Contents/Resources/eos-core/apps/web/index.html"
  ]) {
    const metadata = await stat(path.join(mountedApp, required));
    if (!metadata.isFile()) throw new Error(`Mounted DMG is missing required file: ${required}`);
  }
} finally {
  if (attached) run("hdiutil", ["detach", mountDir]);
  await rm(mountDir, { recursive: true, force: true });
  await rm(stageDir, { recursive: true, force: true });
}

const digest = await sha256(dmgPath);
await writeFile(path.join(distDir, `${baseName}.sha256.txt`), `${digest}  ${path.basename(dmgPath)}\n`);
console.log(JSON.stringify({
  ok: true,
  version: EOS_VERSION,
  architecture,
  signature: "ad-hoc",
  notarized: false,
  dmgPath,
  bytes: (await stat(dmgPath)).size,
  sha256: digest
}, null, 2));
