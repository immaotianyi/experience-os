# EOS 3.0.0-alpha.2 内测发放清单

## 一、交付物（dist/ 下）

| 交付物 | 用途 | 大小 | SHA-256 |
| --- | --- | --- | --- |
| **EOS-3.0.0-alpha.2-macOS-arm64.dmg** | macOS 主推安装包 | 46.1 MB | `7f396603951f72d988b629871ef15e4f4e3551134083399cf82a6c20bcc8a23f` |
| **beta/EOS-macOS-AppleSilicon-Beta.zip** | macOS 备选（Start EOS.command 引导） | 40.9 MB | `da8677ddaaf91b7db9e972baea5799fbfdb05aa537a4caf07efa91c3d7dee6b4` |
| **beta/EOS-Windows-x64-Beta.zip** | Windows x64 测试包 | 34.5 MB | `a2a7a56b3e29fe943e00e660347756531f147e269316077930e1468bad9224b0` |

① 三包均自包含：Core + Web 工作台 + 官方 Node v24.14.0（mac 118 MB / win 91 MB），测试者零依赖；② 包内附平台专属 **TESTER_GUIDE.md**。

## 二、质检结论（2026-08-16）

① 全量回归 **710/710** → ② `verify:release` 全绿 → ③ DMG 挂载校验：codesign 有效 + SHA-256 一致 + 内置真实 Node → ④ 成品启动冒烟：health 报 `3.0.0-alpha.2`，platforms/presets 端点正常 → ⑤ 无 LLM key 降级验证通过 → ⑥ **三灯链路实测修复**：TRAE 工作观察恢复落盘（60s 心跳），working 优先级高于积压审查项，工作态三灯流动（红→黄→绿 650ms 步进带拖尾）。

## 三、发放指引

**A. 分发**：三个包按平台发给测试者，附上方 SHA-256 供校验。
**B. macOS**：① 双击 DMG → 拖 **EOS.app** 到 Applications → ② 首启被 Gatekeeper 拦截属预期（ad-hoc 签名）→ 按住 **Control** 点应用 →「打开」→ ③ 菜单栏出现三灯即成功：**流动=工作中 / 红闪=阻塞 / 黄闪=要权限或待审查 / 绿闪=已完成**。
**C. Windows**：① 解压 ZIP → ② 双击 **Start EOS.cmd**（SmartScreen 拦截 → 「更多信息→仍要运行」）→ ③ 浏览器开 `http://127.0.0.1:4173`。
**D. LLM Key（可选）**：无 key 主线全通（草案降级为本地模板并标注）；配 DeepSeek key 得真实 AI 草案。
**E. 反馈**：「Beta 反馈」页提交 → 下载 JSON → 按邀请渠道回传。

## 四、已知限制

① ad-hoc 签名未公证 → 首启需手动放行；② 交易/市场已隐藏（当前唯一目标=工具本身可用）；③ 预设技能 7 个以候选状态安装，需工作台确认后生效（治理设计非 bug）；④ 首次启动 Core 初始化需 10-60s（vault git 历史压缩后已明显缩短）。
