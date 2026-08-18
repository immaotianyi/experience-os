# Experience OS AI 接手文档

> 更新时间：2026-08-18  
> 项目目录：`/Users/sanzhaibanniang/Documents/Codex/2026-07-16/gemini-3-1-pro`  
> 当前版本：`3.0.0-alpha.2`  
> 文档用途：让新的开发 AI 在不丢失产品哲学、工程边界和真实进度的前提下继续工作。

## 1. 给接手 AI 的第一条指令

你不是来重写一个普通 Dashboard，也不是来继续堆功能。你要维护和验证的是一个“跨 AI 宿主的经验资产化与人类决策系统”。

开始工作前必须：

1. 先阅读本文件、`协作文档.md`、`README.md`、`docs/ARCHITECTURE.md`、`docs/INTEGRATION_ARCHITECTURE.md`。
2. 运行 `git status --short`，把当前工作区视为多人协作中的脏工作区；不得回滚、覆盖或清理来源不明的改动。
3. 读取 `/api/health`、`/api/platforms`、`/api/attention` 的实时结果，不得使用旧文档或“进程存在”代替可用性验证。
4. 任何“兼容、正在工作、已观测、已完成”的结论都必须给出对应证据等级。
5. 任何宿主配置写入、内容捕获、许可批准或不可逆操作，都必须停下来取得人类明确确认。
6. 每完成一个小闭环都运行定向测试；阶段结束必须运行 `npm run verify:release`。

## 2. 创始人的核心哲学

### 2.1 产品必须有中心功能

像 Word 的中心功能是“文字 + 排版”，其他功能围绕中心演化。EOS 不能成为功能仓库。

EOS 当前中心功能是：

**把人和 AI 的真实协作过程，转化为有来源、有人类确认、经过结果验证、可以在未来复用的 Experience Receipt 与 Experience Asset。**

它不以“保存更多聊天”为价值，而以“知道哪些经验真的成立、适用于哪里、还缺什么证据”为价值。

### 2.2 顺应人的惰性，而不是要求人管理 Skill

- 用户不应手动寻找、安装、触发和维护大量 Skill。
- EOS 应从真实工作轨迹中提出候选 Skill 和经验。
- 自动化不能越过许可、审查和结果验证。
- “越用越懂你”必须被实现为可修改、可撤销的假设，而不是永久人格结论。

### 2.3 非线性协作，线性生产

- 协作层允许高温度、发散、试错和新 Skill 涌现。
- 生产层必须进入固定脚手架：Schema、状态机、测试、权限、回滚、降级和 WallHit。
- 工程不是创意的敌人，而是检验创意能否成立的漏斗。
- AI 撞墙时必须同时反馈给系统和人，让人修正思想模型。

### 2.4 Human Review 必须适配人类

人的注意力有限，所以审查必须：

- 从摘要到证据逐层展开；
- 线性、有顺序、有默认建议，但不替人决定；
- 明确说明对象、原因、风险、选项、影响和下一步；
- 高风险动作需要二次确认；
- 不把“没有报错”包装成“已经成功”。

## 3. EOS 是什么，不是什么

EOS 是：

- 跨 Codex、Claude Code、Cursor、TRAE、VS Code 等宿主的本地控制与经验层；
- MCP、项目工作区、Vault、Hook 和桌面注意力界面的组合；
- 从协作事实到经验收据、结果验证、复用试验和 Skill 候选的闭环；
- 证据优先、严格许可、默认本地的工具。

EOS 不是：

- 新的聊天客户端；
- 能读取所有宿主聊天的万能监听器；
- 仅凭安装检测就宣称兼容的展示页；
- 自动替人批准许可或升级 Skill 的自治 Agent；
- 已经完成生产级云账号、支付、多租户和正式签名的商业产品。

## 4. 当前产品形态

### 4.1 macOS 应用

- 原生 Swift/AppKit 常驻应用：`apps/macos/EOSMenuBar/`
- 内置 React 工作台，不需要每次打开浏览器。
- 菜单栏 Agent 雷达：回答“哪些宿主处于什么状态”。
- 屏幕边缘 EOS 注意力窗：回答“现在是否需要人处理”。
- 关闭完整工作台后，Core 和注意力入口应继续运行。
- 分发产物：Apple Silicon macOS DMG（alpha.2，ad-hoc 签名未公证）+ macOS/Windows ZIP；注意力组件完成度以 macOS 为准。

### 4.2 Web 工作台

- React 18 + Vite 5，源码位于 `apps/web-react/`。
- 生产产物写入 `apps/web/`，由 `src/webServer.js` 提供。
- 主要视图：项目主线（默认落地页，渐进披露布局）、总览（焦点卡+中文条形图）、审查、WallHit、Skill、代码图、质量、审计、Vault、Beta 反馈、AI 工具连接；市场与卖家营收已随交易搁置而隐藏。
- Web 右下角状态入口与原生边缘窗是不同信息层，不应互相复制全部内容。

### 4.3 本地 Core

- Node.js 原生 HTTP 服务：`src/webServer.js`
- 默认监听：`http://127.0.0.1:4173`
- 默认应用工作区：`~/Library/Application Support/ExperienceOS/Workspace`
- 多项目注册表：`~/.experience-os/workspaces.json`
- 项目自己的数据：`<workspace>/.eos/vault`
- 默认捕获策略：`strict_permit`

## 5. 证据等级是不可破坏的不变量

| 等级 | 含义 | 必须具备的证据 |
|---|---|---|
| L0 | 未检测 | 没有真实宿主安装证据 |
| L1 | 已安装 | 命令或应用实际存在 |
| L2 | 已配置 | 宿主存在 EOS MCP 注册 |
| L3 | 可调用 | MCP 注册、宿主确认、Relay 握手、已注册项目 Vault 绑定同时成立 |
| L4 | 已观测 | L3 成立，并收到同一宿主、同一项目、经许可的真实 Hook 事件 |

严禁：

- 用旧 ConversationEvent 冒充 HostObservation；
- 用另一个项目的 Codex 事件点亮当前项目；
- 用 Relay 自检成功冒充宿主已经调用；
- 用进程存在冒充 Core 可访问；
- 用 MCP 可调用冒充 EOS 能读取全部聊天。

## 6. 2026-08-17 的真实状态

实时读取 `http://127.0.0.1:4173`（Core 由已构建 `dist/EOS.app` 的 sidecar 常驻提供，`/api/health` 返回 `ok / 3.0.0-alpha.2`）：

- Codex：`L4 / observing`，MCP 已注册、Relay 握手通过、Vault 已绑定、真实事件已观测；`.codex` Hook 已安装（9 个 handler，`configured=true / tokenReady=true`）
- TRAE：`L4 / observing`（session-log watcher + AgentBar 协议，无 Hook 依赖）
- Claude Code：本机检测到 `L1 / available`（主仓库工作区经 AgentBar `~/.agentbar/state.d` 观测可达 L4；证据以 `/api/platforms` 实时结果为准）
- Cursor：检测到，hooks 已验证 supported，等待首个真实 Hook 事件后升级 L4
- VS Code：`L0 / not_installed`（扩展模式待扩展）

注意：以上是本文更新时刻的快照。接手 AI 必须重新读取三条实时 API，不得把本节当成当前在线证明。

## 7. 关键修复与演进记录（按时间沉淀）

### 7.1 跨工作区证据纠偏

此前桌面 App 只读取自己的 Application Support Vault，而 Codex 绑定项目 Vault，导致组件无法正确理解连接状态。

已完成：

- `src/platformEvidence.js` 根据显式工作区注册表校准 Vault 绑定；
- `/api/platforms` 和 `/api/attention` 聚合注册项目的 HostObservation；
- 只有宿主与项目 ID 同时匹配才允许 L4；
- 连接方案、观察许可和 Hook 事务能够解析到目标项目 Vault；
- UI 不再把控制库误写成当前项目 Vault。

### 7.2 运行状态 Hook 合同

已支持的元数据事件：

- `SessionStart`
- `UserPromptSubmit`
- `PreToolUse`
- `PermissionRequest`
- `PostToolUse`
- `SubagentStart`
- `SubagentStop`
- `Stop`
- `SessionEnd`

Bridge 只发送事件名、散列后的 session/turn 标识、有限工具名、权限模式、结果和时间。提示词、回复、工具参数、工具输出、源码、cwd、transcript 与凭据不得进入 Vault。

### 7.3 悬浮动效

- 原生边缘窗改为持续存在的 SwiftUI 内容，不再靠重建视图硬切换；
- 使用 AppKit 连续窗口帧动画、缓出曲线和轻弹簧内容过渡；
- 换边采用淡出、重定位、淡入；
- 支持 macOS“减弱动态效果”；
- Web 状态入口保持在 DOM 中，以透明度、位移和缩放过渡；
- 展开、收起、左右换边、工作台重开已实际操作验证。

贴边隐藏是可选增强。如果后续测试出现误触、跳动、遮挡或多屏异常，可以直接退回“可拖动 + 可收起”的固定悬浮窗，不得让边缘效果阻塞核心状态功能。

### 7.4 AgentBar 协议复用与 TRAE 真实观测（2026-08-16）

- 新增 `src/agentbarReader.js`：读取 `~/.agentbar/state.d`，零适配接入任何装有 AgentBar Hook 的宿主；
- 新增 `src/eosCredentialResolver.js`：统一 consent + host_capture 令牌解析，consent 携带 `vaultDir` 定位有效 token；
- 增强 `src/eosSessionLogWatcher.js`：TRAE/VS Code 会话日志状态发布与死进程清理；
- TRAE 无生命周期 Hook 的结论不变：观察走 watcher + AgentBar 文件协议，不伪造事件。

### 7.5 Cursor 成为已验证 Hook 宿主（2026-08-16）

- `VERIFIED_HOSTS` / `SUPPORTED_HOOK_HOSTS` 加入 cursor；
- 平铺 `.cursor/hooks.json`，`CURSOR_HOOK_EVENT_MAP` 映射 8 类事件（sessionStart / beforeSubmitPrompt / preToolUse / postToolUse / subagentStart / subagentStop / stop / sessionEnd）；
- `conversation_id / generation_id` 归一化为 `session_id / turn_id`；`eosHookBridge --event` 注入；
- 与 Codex / Claude 共享 hook-plan / apply 事务层；`/api/platforms` 显示 `hooks: supported`，首个真实事件后自动 L4。

### 7.6 三灯系统三项关键修复（2026-08-16 晚）

- 观察静默丢失：`webServer.js` 的 `collectWorkspaceEvidence` 合并主 Vault（`listCollectorConsents`），修复主库被排除导致状态灯不流动；
- 优先级抑制：单一待审项不再覆盖工作态黄闪，工作态优先、待审计数并入提示文案；
- 动画定稿：工作态改为三灯流动（红→黄→绿，650ms 步进，带拖尾），取代此前的“黄灯常亮”方案。

### 7.7 前端布局降噪（2026-08-17）

- 总览页三层结构：待审审查包置顶焦点卡（有待办时橙色强调、整卡可点直达），“EOS 是什么”默认折叠，记录分布改中文标签 + 比例条形图（Top 6 直显）；
- 项目页渐进披露：空态步骤区块（草案 / 审查验证 / 升级资格 / 经验建议）折叠为单行摘要，有待确认草案或真实数据时才展开；草案区内容（生成按钮 + 草案历史）在折叠 / 展开两种形态下完整保留；
- 时间线最近 3 条直显，其余折叠；左栏项目切换 sticky 跟随滚动（≤760px 退回静态）；
- 修复 `.panel { min-height: 184px }` 把折叠行撑高的问题（收起 59px / 展开恢复）；主栏高度 5154px → 约 3545px；
- 审美体系零改动：全部复用既有 `advanced-path` 折叠样式与设计变量。

### 7.8 首次完整闭环达成（2026-08-18）

中心功能端到端走通：工作节点 → LLM 草案 → 收据 → 人工审查决策 → 结果验证 → 经验资产。

- 工作节点 `checkpoint.1787031460564.uzn4qk`（创始人首次闭环检查点）；
- Live 草案 `draft.llm-live.1786856000`（deepseek-v4-flash，`isLive=true`，`~/.experience-os/secrets/llm.env` 0600 回落机制保证 GUI sidecar 可用）→ 接受为收据 `receipt.1786949919705.c52z9l`；
- 人工审查 `decision.1787032857445.xdt21g`：`humanReviewed=true / reviewedBy=founder`，引用收据全部两条证据（决策必须引用收据全部证据链接，`projectEngine.js` 强制校验）；
- 结果验证 `outcome.1787032864426.oqstso`：`outcome=success`，核验依据 710/710 回归 + 四宿主 L4 实时状态 + INTEGRATION_ARCHITECTURE.md 四处陈述校正；
- 晋升资产 `asset.1787032897297.og2vgb`：`status=approved / approvedBy=founder`，标题「多路径宿主接入至 L4 观察：MCP relay 自观察 + Hook 事务安装 + 文件注册」；
- 全程经 API 写入（未手改 vault 文件），`/api/project/readiness` 门控先判 eligible 再晋升，`/api/validation` 2235/2235 通过。

注意：`receipt.e2e.4hosts`（旧 e2e 记录）尚无配对决策+结果，保持不 eligible；收据 `phase` 字段不随晋升回写，资产状态以 ExperienceAsset 记录为准。

## 8. 尚未完成且必须诚实说明

### 已解决（2026-08-16）：Codex 真实状态事件闭环

Codex Hook 已按事务流程安装并取得真实事件：`.codex` Hook `configured=true / tokenReady=true`（9 个 handler），`/api/platforms` 显示 `L4 / observing`。事务纪律（预览 → 二次确认 → 只合并 EOS handler → 宿主内信任 → 真实事件验收）保留为所有宿主 Hook 写入的标准流程，后续宿主照此执行，不得伪造 HostObservation。

### 已定稿（2026-08-16 晚，最终版）：三灯语义

演化说明：最初定稿为“工作态黄灯常亮”，2026-08-16 晚经实机验证亮度与识别度后，用户确认改为三灯流动方案。当前唯一有效语义：

- `working`：三灯流动（红→黄→绿，650ms 步进，带拖尾）；
- `waiting_permission / waiting_review`：黄灯闪烁；
- `completed`：绿灯闪烁（45s 静默判 SessionEnd 后触发）；
- `blocked`：红灯闪烁。

原生菜单栏（圆点 10pt）、边缘窗与 Web 入口已统一到这套语义；接手 AI 不得回退到“工作=黄灯常亮”或改用红=工作。

### 其他未完成项

- 已解决（2026-08-16）：TRAE 经 session-log watcher + AgentBar 协议实现真实观测（L4）；Cursor 已验证为 Hook 宿主（hooks supported，待首个真实事件升 L4）；Codex / TRAE 实时 L4；Claude 在主仓库工作区经 AgentBar 观测；
- 已解决（2026-08-16）：LLM 配置为 deepseek（LaunchAgent 环境变量注入，key 以 `sk-4a6a...` 开头者有效；`~/.claude/cc-haha/providers.json` 中 `sk-...6f03` 已失效 401），真实草案生成可用；
- launchd 已知问题：gui-domain 崩溃节流后 `launchctl bootstrap` 全部 EIO(5)，兜底方案为 python 双 fork + setsid 拉起（不自愈），或由 `dist/EOS.app` sidecar 接管 4173；重新登录大概率恢复 launchd 常驻；
- VS Code 当前机器未安装（扩展模式已预留）；
- Windows 原生桌面注意力组件尚未达到 macOS 同等完成度；
- DMG 未做 Developer ID 签名与公证（暂无 Apple Developer 身份，用 ad-hoc 签名）；
- 手机/邮箱登录目前是本地开发模型，不是生产身份系统；
- 用户决定（2026-08-16）：支付/交易/市场开发全部搁置，当前唯一目标是工具真正能用、好用；底层足够大且扁平后再重启商业化。

## 9. 下一阶段建议顺序

### 阶段 A：真实 Codex Alpha 事件闭环（已完成，2026-08-16）

1. 恢复 EOS Core 并读取三条结构化 API。
2. 取得用户对项目级 Codex Hook 的明确许可。
3. 预览、二次确认、事务安装，不覆盖宿主配置。
4. 在 Codex 信任 Hook。
5. 触发并观测真实工作、权限、完成事件。
6. 验证 `/api/platforms` 从 L3 到 L4。
7. 验证 `/api/attention` 和两个原生入口同步变化。
8. 重启 EOS、重启 Codex，再做一次持久性验收。

### 阶段 B：确认并统一三灯语言（已完成，2026-08-16）

1. 与用户确认红灯冲突。
2. 建立状态到颜色、动画、超时的唯一映射表。
3. 修改 Swift、React、文档与自动化测试。
4. 增加屏幕录像或连续截图证据，而不仅是最终帧。

### 阶段 C：TRAE 真实接入（已完成：watcher 方案，2026-08-16）

1. 只使用 TRAE 官方或本机可验证的 MCP 配置入口。
2. 先做到 L2，再通过宿主内真实工具调用验收 L3。
3. 没有稳定 Hook 契约前，不声称 L4，不猜测配置文件。
4. 不修改 Codex 配置，不让两个宿主争抢同一写入操作。

### 阶段 D：真实用户价值试验

1. 在一个真实项目中保存经同意的工作节点。
2. 由活跃宿主 Agent 提出 Experience Receipt 草案。
3. 人类审查并记录真实结果。
4. 升级为 Experience Asset。
5. 在另一个项目发起复用试验。
6. 只有复用成功且减少重复判断后，才宣称 EOS 产生价值。

## 10. 关键文件

| 文件 | 作用 |
|---|---|
| `协作文档.md` | 全历史、设计判断、阶段验收记录 |
| `README.md` | 项目入口、命令和模块索引 |
| `src/webServer.js` | 本地 Core、API 和跨工作区编排 |
| `src/platformEvidence.js` | 注册工作区与宿主 Vault 的证据校准 |
| `src/eosPlatformAdapter.js` | 五类宿主检测、MCP 注册与连接计划 |
| `src/agentStatus.js` | HostObservation 到 Agent 状态的推导 |
| `src/agentbarReader.js` | 读取 `~/.agentbar/state.d`，零适配接入 AgentBar 宿主状态 |
| `src/eosSessionLogWatcher.js` | TRAE/VS Code 会话日志状态发布与死进程清理 |
| `src/eosCredentialResolver.js` | consent + host_capture 令牌统一解析（vaultDir 定位） |
| `apps/web-react/src/views/ProjectView.jsx` | 项目主线视图（渐进披露布局：空态折叠、时间线 3+折叠、sticky 左栏） |
| `apps/web-react/src/views/OverviewView.jsx` | 总览视图（焦点卡置顶、说明折叠、中文条形图） |
| `src/attentionStatus.js` | Agent、许可、审查、WallHit 到注意力快照的聚合 |
| `src/hostObservationEngine.js` | 元数据许可、归一化、持久化和撤销 |
| `src/eosHookBridge.js` | 短生命周期 Hook 输入脱敏与本机发送 |
| `src/hostHookPlan.js` | 可审查 Hook 事件与配置片段 |
| `src/hostHookTransaction.js` | 锁、哈希、原子写入、验证、回滚、定向移除 |
| `src/hostHookCoordinator.js` | 十分钟单次计划与二次确认 |
| `apps/macos/EOSMenuBar/Sources/EOSMenuBar/EOSMenuBarApp.swift` | 原生工作台、菜单栏和边缘窗 |
| `apps/web-react/src/components/AttentionBeacon.jsx` | Web 状态入口 |
| `apps/web-react/src/views/PlatformView.jsx` | 宿主证据与 Hook 审查界面 |
| `scripts/macos/buildAppBundle.js` | 自包含 EOS.app 构建与临时签名 |
| `scripts/macos/buildDmg.js` | DMG 创建、签名、挂载和资源验收 |

## 11. 启动与验证命令

### 只启动源码 Core

```bash
npm run web
```

### 启动已构建 macOS 应用

```bash
open "/Users/sanzhaibanniang/Documents/Codex/2026-07-16/gemini-3-1-pro/dist/EOS.app"
```

### 必须读取的实时状态

```bash
curl -fsS http://127.0.0.1:4173/api/health
curl -fsS http://127.0.0.1:4173/api/platforms
curl -fsS http://127.0.0.1:4173/api/attention
npm run macos:core-status
```

### 定向测试

```bash
node --test \
  tests/platformEvidence.test.js \
  tests/agentStatus.test.js \
  tests/attentionStatus.test.js \
  tests/hostHookPlan.test.js \
  tests/hostHookCoordinator.test.js \
  tests/hostHookTransaction.test.js \
  tests/hostObservationEngine.test.js \
  tests/eosHookBridge.test.js
```

### 发布验证

```bash
npm run verify:release
npm run macos:dmg
```

测试运行方式注意：在仓库根目录用裸 `node --test`（Node 26 下带 `tests/` 目录参数会坏）。

最后一次完整结果（2026-08-16，Cursor 合入后）：

- `710 tests / 0 fail`（裸 `node --test` 全量）
- fixture Vault：`1676 valid / 0 invalid / 0 corrupt`
- React production build：通过
- Swift Release：通过
- DMG ad-hoc 签名、只读挂载、App 深度签名、必需资源：通过

## 12. 当前构建产物

- App：`dist/EOS.app`（包内 `eos-core/src` 与仓库 src 逐文件一致；web 资源为最新构建）
- 当前 DMG：`dist/EOS-3.0.0-alpha.2-macOS-arm64.dmg`
- SHA-256：`7f396603951f72d988b629871ef15e4f4e3551134083399cf82a6c20bcc8a23f`
- 历史 DMG：`EOS-3.0.0-alpha.1-macOS-arm64.dmg`（SHA `58a5af...80ab`，保留备查）
- 签名：ad-hoc（Gatekeeper 拦截时 `codesign --force --deep --sign - dist/EOS.app`）
- 公证：无（无 Apple Developer 身份）
- 注意：`dist/EOS.app` 二进制替换前必须先退出运行中的 App；运行时占用 4173 的进程是 App 自己的 sidecar，改动 web 静态资源可直接按请求生效

## 13. 并发与工作区纪律

当前仓库存在大量已修改、删除和未跟踪文件，它们来自持续开发、构建产物和其他协作 AI。接手 AI 必须：

- 不运行 `git reset --hard`、`git checkout --` 或批量清理；
- 不删除不认识的文件；
- 修改前先读目标文件的当前版本；
- 把宿主配置写入视为事务，必须预览后再执行；
- Codex 与 TRAE 不得同时改同一配置文件或同一 Vault 记录；
- 构建前关闭旧 EOS.app，构建后重新启动并验证 4173；
- 不在文档、日志、测试夹具或提交中写入 API Key、捕获令牌或身份凭据。

## 14. 对用户的沟通方式

- 用直白中文说明“产品现在到底是什么、为什么这样做、证据在哪里”。
- 不用抽象术语掩盖未完成状态。
- 每次汇报分清：已经完成、已经测试、仍是推断、等待人类决定。
- 用户的想法不是自动正确，也不是可以忽略；需要指出冲突、缺口、成本和替代方案。
- Human Review 信息应从少到多展开，给出清晰的下一步。
- 用户要求持续推进时可以自主实现，但遇到许可、隐私、不可逆操作和产品语义冲突必须停下来讨论。

## 15. 可直接交给接手 AI 的结构化提示词

```text
你现在接手 Experience OS 项目。

项目目录：
/Users/sanzhaibanniang/Documents/Codex/2026-07-16/gemini-3-1-pro

先完整阅读：
1. AI接手.md
2. 协作文档.md
3. README.md
4. docs/ARCHITECTURE.md
5. docs/INTEGRATION_ARCHITECTURE.md

你的目标不是堆功能，而是继续验证 EOS 的中心功能：把经人类同意的人机协作事实，转成有来源、经人审查、由结果验证、可跨项目复用的经验资产。

开始时先执行 git status 和实时健康检查。不得回滚现有改动，不得读取或输出凭据，不得自动批准许可，不得把 detected/configured/callable/observing 混为一谈。

宿主接入现状（2026-08-17）：Codex L4 observing（Hook 9 handler 已装）、TRAE L4（watcher+AgentBar）、Claude 主仓库工作区经 AgentBar 观测、Cursor hooks supported 待首事件、VS Code 未装。宿主接入不再是无阻塞主线。

当前第一主线（用户已定方向）：
- 支付/交易/市场全部搁置，唯一目标是工具真正能用、好用；
- 阶段 D 真实用户价值试验：真实项目保存节点 → 草案 → 人工审查 → 结果验证 → 升级资产 → 跨项目复用；
- 前端体验持续降噪：渐进披露已落地（总览焦点卡、项目页空态折叠），后续改动不得回退为信息堆砌，也不得改动既有审美体系（配色、字体、组件风格）。

三灯语义最终版（2026-08-16 晚定稿）：工作=三灯流动（红→黄→绿 650ms 带拖尾）、红闪=阻塞、黄闪=权限/待审、绿闪=完成；代码、测试、UI 和文档已统一，不得回退为黄灯常亮。

每完成一个小闭环运行定向测试；阶段结束运行 npm run verify:release。最终汇报必须包含真实 API 结果、测试结果、仍未完成项和需要用户执行的动作。
```

## 16. 接手完成判据

接手 AI 只有在做到以下事项后，才可以说“已经接手并理解项目”：

1. 能用一句话说清 EOS 的中心功能；
2. 能解释协作漏斗与生产漏斗的区别；
3. 能说明 L0-L4 的证据差异；
4. 能报出各宿主当前实时证据等级并说明来源（以 /api/platforms 为准，区分 sidecar 工作区与主仓库注册工作区）；
5. 能说出定稿的三灯语义（工作=三灯流动红→黄→绿、红闪=阻塞、黄闪=权限/待审、绿闪=完成）；
6. 能给出下一步需要人类许可的具体写入对象；
7. 已读取实时健康状态，而不是复述本文的旧结果；
8. 已确认不会覆盖其他 AI 的并发改动。
