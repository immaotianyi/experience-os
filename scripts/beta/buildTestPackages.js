import { createHash } from "node:crypto";
import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = path.join(root, "dist", "beta");
const winZip = process.env.EOS_WINDOWS_NODE_ZIP || "/private/tmp/node-v24.14.0-win-x64.zip";
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
async function sha256(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}
async function core(target) {
  await cp(path.join(root, "src"), path.join(target, "eos-core", "src"), { recursive: true });
  await cp(path.join(root, "apps", "web"), path.join(target, "eos-core", "apps", "web"), { recursive: true });
}
function guide(platform) {
  const startup = platform === "macOS"
    ? `1. 解压 ZIP，不要直接在压缩包预览中运行。
2. 双击 **Start EOS.command**。
3. 如果 macOS 阻止运行：按住 Control 点击该文件，选择“打开”，再次确认“打开”。
4. 终端窗口必须保持开启。工作台会在服务就绪后打开：
   http://127.0.0.1:4173
5. 可选：双击 **EOS.app**，在菜单栏显示三灯状态。`
    : `1. 解压 ZIP，不要直接在压缩包内运行。
2. 双击 **Start EOS.cmd**。
3. 如果 Windows SmartScreen 阻止运行：选择“更多信息”→“仍要运行”。
4. 命令窗口必须保持开启。工作台会在服务就绪后打开：
   http://127.0.0.1:4173`;

  return `# EOS ${platform} Beta 测试手册

## 这次测试要完成什么

请用一个不含敏感信息的小型真实任务，完整走一轮：

创建项目 → 保存一个明确同意的工作节点 → 确认经验收据 → 人工审查 → 记录真实结果 → 查看升级资格 → 提交反馈。

## 启动

${startup}

首次启动会创建独立工作区：

\`Documents/EOS Beta Workspace\`

它不会修改你的其他项目，也不会静默读取 Codex、IDE、终端或浏览器内容。

## 前五分钟

1. 在“项目”页面创建一个项目，自治等级保持默认 \`advise\`。
2. 完成一小段真实工作后，填写“保存一个工作节点”。
3. 只填写你愿意保存在本机的内容，并勾选明确同意。
4. 如果已连接真实模型或 Codex MCP，让 AI 提出经验收据草案；否则使用“高级路径”手动写一条收据。
5. 检查收据是否忠实，再记录人工审查和实际结果。
6. 只有证据、审查和成功结果全部存在时，才尝试升级为经验资产。

## 提交反馈

1. 在左侧导航打开“Beta 反馈”。
2. 选择测试阶段，填写有用程度、清晰程度、是否愿意继续使用。
3. 勾选提交同意后发送。
4. 本地测试包会把反馈保存在你的 EOS Vault。点击“下载反馈文件”，再通过邀请消息中约定的渠道交给测试组织者。
5. 联系方式完全可选；未勾选联系同意时不会保存联系方式。

请不要提交：

- 聊天全文或私人代码；
- 密码、API Key、Token；
- 身份证件、付款信息或其他个人敏感信息。

测试组织者同时提供了 \`SHA256SUMS.txt\` 时，可以用它核对下载的 ZIP 是否完整。

## 停止与再次启动

- 停止：关闭运行 EOS 的终端或命令窗口。
- 再次启动：重新运行 **Start EOS**，原有 Beta 工作区会继续使用。
- 如果浏览器先显示连接失败，等待两秒后刷新；启动脚本会先检查已有服务，避免重复启动。

## 移除测试数据

1. 先关闭 EOS 的终端或命令窗口。
2. 删除 \`Documents/EOS Beta Workspace\`。
3. ${platform === "macOS" ? "如启动了 EOS.app，也请从菜单栏退出后删除测试包。" : "删除已解压的 EOS Beta 文件夹。"}

删除工作区会同时删除其中的本地测试记录，请先下载需要提交的反馈文件。
`;
}
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
if /usr/bin/curl -fsS --max-time 2 "http://127.0.0.1:4173/api/health" >/dev/null 2>&1; then
  open "http://127.0.0.1:4173"
  exit 0
fi
(sleep 1; open "http://127.0.0.1:4173") &
EOS_VAULT_DIR="$WORKSPACE/.eos/vault" EOS_HOST=127.0.0.1 PORT=4173 "$ROOT/runtime/node" "$ROOT/eos-core/src/webServer.js"
`, { mode: 0o755 });
await writeFile(path.join(mac, "TESTER_GUIDE.md"), guide("macOS"));
const macArchive = path.join(out, "EOS-macOS-AppleSilicon-Beta.zip");
run("ditto", ["-c", "-k", "--norsrc", "--noextattr", "--noqtn", "--noacl", "--keepParent", mac, macArchive]);

const win = path.join(out, "EOS-Windows-x64-Beta");
await mkdir(win, { recursive: true });
await core(win);
try {
  await access(winZip);
} catch {
  throw new Error(`Windows Node runtime archive not found: ${winZip}. Set EOS_WINDOWS_NODE_ZIP to an official node-v*-win-x64.zip archive.`);
}
const windowsRuntimeRoot = path.join(out, "node-win");
const windowsRuntimeSource = path.join(
  windowsRuntimeRoot,
  path.basename(winZip, path.extname(winZip))
);
await mkdir(path.join(win, "runtime"), { recursive: true });
run("unzip", ["-q", winZip, "-d", windowsRuntimeRoot]);
await cp(path.join(windowsRuntimeSource, "node.exe"), path.join(win, "runtime", "node.exe"));
await rm(windowsRuntimeRoot, { recursive: true, force: true });
await writeFile(path.join(win, "Start EOS.cmd"), [
  "@echo off", "set \"ROOT=%~dp0\"", "set \"WORKSPACE=%USERPROFILE%\\Documents\\EOS Beta Workspace\"",
  "if not exist \"%WORKSPACE%\" mkdir \"%WORKSPACE%\"", "\"%ROOT%runtime\\node.exe\" \"%ROOT%eos-core\\src\\eosBootstrap.js\" \"%WORKSPACE%\" \"EOS Beta Workspace\"",
  "curl.exe -fsS --max-time 2 \"http://127.0.0.1:4173/api/health\" >nul 2>&1 && start \"\" \"http://127.0.0.1:4173\" && exit /b 0",
  "start \"\" powershell.exe -NoProfile -WindowStyle Hidden -Command \"Start-Sleep -Seconds 1; Start-Process 'http://127.0.0.1:4173'\"",
  "set \"EOS_VAULT_DIR=%WORKSPACE%\\.eos\\vault\"", "set \"EOS_HOST=127.0.0.1\"", "set \"PORT=4173\"",
  "\"%ROOT%runtime\\node.exe\" \"%ROOT%eos-core\\src\\webServer.js\"", ""
].join("\r\n"));
await writeFile(path.join(win, "TESTER_GUIDE.md"), guide("Windows"));
const windowsArchive = path.join(out, "EOS-Windows-x64-Beta.zip");
run("ditto", ["-c", "-k", "--norsrc", "--noextattr", "--noqtn", "--noacl", "--keepParent", win, windowsArchive]);
await writeFile(path.join(out, "SHA256SUMS.txt"), [
  `${await sha256(macArchive)}  ${path.basename(macArchive)}`,
  `${await sha256(windowsArchive)}  ${path.basename(windowsArchive)}`,
  ""
].join("\n"));
console.log(`Built Beta packages: ${out}`);
