# EOS 发布流程

## 当前发布等级

`3.0.0-alpha.1` 是邀请制 Alpha：适合在独立本地工作区中测试，不代表已经具备公开多租户云服务所需的账号、隔离、备份和删除能力。

## 发布前检查

1. 确认工作树中没有来源不明的并发改动。
2. 更新 `src/version.js`、`package.json` 和 `CHANGELOG.md`。
3. 执行 `npm run verify:release`。
4. 在 Apple Silicon Mac 上执行 `npm run macos:dmg`。
5. 挂载 DMG，执行 `codesign --verify --deep --strict EOS.app`，并核对 SHA-256 文件。
6. 从成品 `EOS.app` 启动，确认 `/api/health` 返回当前版本、Core 进程来自 App 内置运行时、退出后 4173 端口释放。
7. 执行 `npm run beta:packages`，解压两个测试包并检查启动文件和 `TESTER_GUIDE.md`。
8. 在 macOS 实际走一轮项目、工作节点、反馈下载和停止流程。
9. 在真实 Windows x64 设备或虚拟机完成同样验证。
10. 只有目标平台证据都通过后才创建 Git tag 和 GitHub Release。

macOS DMG 输出到 `dist/EOS-<version>-macOS-<arch>.dmg`。当前包内置原生状态栏、WebKit 应用内工作台、EOS Core、生产 Web UI 和当前架构的 Node.js 运行时；首次启动会在 `~/Library/Application Support/ExperienceOS/Workspace` 初始化独立本地工作区，不要求测试者手动打开浏览器。

## Windows 运行时

构建 Windows 包需要官方 Node.js x64 ZIP。默认读取：

`/private/tmp/node-v24.14.0-win-x64.zip`

也可通过 `EOS_WINDOWS_NODE_ZIP` 指向其他经过校验的官方归档。

## 签名与分发

- macOS DMG 与其中的可执行文件使用 ad-hoc 临时签名，已做本机结构和签名完整性校验，但尚未进行 Apple Developer ID 签名或 Apple 公证。
- Windows 测试包尚未进行代码签名，因此测试者可能看到 SmartScreen 提示。
- 当前 DMG 可以称为“正式测试包”或“邀请制 Alpha 安装包”，不得描述为已公证的公开生产版本。
- 发布页必须附带 SHA-256 校验值，并明确测试等级、数据位置和卸载方式。
- 当前 DMG 只包含构建机架构；本轮产物为 Apple Silicon `arm64`，Intel Mac 需单独构建和验证。

## macOS 首次连接

1. 将 `EOS.app` 拖入 `/Applications` 并打开；如被 Gatekeeper 拦截，在“系统设置 > 隐私与安全性”中确认打开。
2. EOS 会在本机 `127.0.0.1:4173` 启动内置 Core，并直接打开应用内工作台，默认开启 `strict_permit`。
3. 在“平台兼容”页分别查看 `detected / configured / callable / observing`；检测到宿主不等于已经接通。
4. 按页面生成的当前 Vault 配置连接 Codex、Claude、Cursor 或 TRAE，并在宿主内调用只读就绪度工具完成验收。
5. 只有用户明确许可后才启用协作内容捕获或元数据 Hook；EOS 不自动批准许可。

## 尚需人类决定

公开发布前必须选择并加入明确的开源许可证。许可证会影响 Skill、市场资产和第三方贡献的使用边界，不能由开发流程代替产品所有者决定。
