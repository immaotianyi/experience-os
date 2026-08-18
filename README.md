# Experience OS (EOS)

Experience OS 是一个本地优先的人-AI 协作经验操作系统：把非线性的协作过程沉淀为可验证、可复用、可交易的工程化经验资产。

## 核心设计思想

- **非线性思想线性化**：人的想法是非线性的，但工程交付必须线性。EOS 用状态机 + 管道将发散思维收敛为可验证的工程对象。
- **经验即资产**：每次协作产生的规则、技能、反思、模式，在通过生产验证和人工审查后沉淀为 `ExperienceAsset`，供后续项目检索复用。
- **本地优先、零外部依赖**：所有数据存储在本地 JSON 文件（`work/vaults/`），叠加 Git 版本控制；不依赖数据库、云服务或 Web 框架。
- **人在回路（Human-in-the-loop）**：AI 自主写入受自治策略（explore/advise/draft/execute/commit）约束；关键决策必须由人审查确认；捕获协作片段需用户显式同意（consent）。
- **显式撞墙（WallHit）**：当 Skill 缺少 schema、触发条件不稳定或降级路径缺失时，系统不静默失败，而是产出结构化的 `WallHit` 记录，引导修复或重新探索。

## 快速开始（3 分钟跑起来）

### 环境要求

- Node.js >= 20
- Git（用于 Vault 版本控制；未安装时自动降级为无版本控制模式）

### 启动

```bash
npm install
npm start          # 即 npm run web，启动后访问 http://127.0.0.1:4173
```

启动后访问 `http://127.0.0.1:4173` 即可看到 React 工作台（项目入口 + 高级控制台）。这是 EOS 源码仓库的全局开发库；对真实项目进行跨工具协作时，应先 Bootstrap 并启动该项目自己的工作台：

```bash
npm run bootstrap -- /path/to/your/project "项目名称" "项目目标"
npm run workbench -- /path/to/your/project 4180
```

项目工作台、Codex/Claude/Cursor 等宿主必须指向同一个 `<workspace>/.eos/vault`。不同 Vault 的历史事件不会被当作当前连接成功。

### AI 工具连接

工作台的“AI 工具连接”页检测 Codex、Claude Code、Cursor、TRAE 和 VS Code，并用五级证据显示真实状态：`未检测 -> 已安装 -> 已配置 -> 可调用 -> 已观测`。检测到应用或配置文件不等于已经兼容；只有宿主确认、当前 Vault 一致且 Relay 通过真实 MCP 握手，才标记为可调用。

EOS 默认不读取其他工具的完整聊天，也不会静默修改其配置。保存协作正文必须使用严格捕获许可；生命周期 Hook 另需独立的元数据观察许可，且不能携带正文。完整边界与宿主矩阵见 [AI 工具集成架构](docs/INTEGRATION_ARCHITECTURE.md)。

Codex 与 Claude Code 已支持工作台内的项目级元数据 Hook 安装：用户先确认只观察会话开始/结束，再审查脱敏差异并进行第二次确认。EOS 只合并自己的 Hook，配置与工作区外 `0600` 私有凭据作为一个可回滚事务提交；撤销时只移除 EOS Hook。结构安装成功仍不等于宿主已调用，必须收到真实事件回执才提升观察证据。

#### Codex 快速连接

在项目目录下运行 `npm run codex:preflight` 查看当前 Codex 集成状态和安装命令。典型注册命令：

```bash
codex mcp add experience-os --env EOS_VAULT_DIR='/path/to/.eos/vault' --env EOS_CAPTURE_POLICY=strict_permit -- /absolute/path/to/node /absolute/path/to/src/eosRelayMcp.js
```

Relay 当前暴露 10 个受限工具，包括许可捕获、项目就绪度、已验证经验、证据时间线与代码图谱查询。它不能替人批准决策或提升资产状态。

### Bootstrap 一个工作区

```bash
npm run bootstrap -- /path/to/your/project "项目名称" "项目目标"
```

该命令只在目标目录创建 `.eos/` 子目录（本地 Git Vault + 项目配置 + mcp.json），不修改业务文件。

## 项目结构

```
.
├── src/             # 核心源码：存储层、引擎、HTTP 入口、MCP Relay、适配器
├── tests/           # 自动化测试（node:test，零测试框架依赖）
├── apps/
│   └── web-react/   # React 18 + Vite 5 前端工作台
├── scripts/         # 部署与平台脚本（macOS 打包、beta 构建、preflight）
├── work/            # 运行时数据：vaults/（真实数据）、fixtures/（demo 隔离）、vault-archive/（归档）
├── outputs/         # 产品文档（路线图、蓝图、PRD 等 Markdown/HTML）
└── eos-handbook/    # EOS 手册（静态 HTML）
```

## 核心模块一览

| 文件 | 职责 |
|---|---|
| `src/domain.js` | 31 种领域记录类型的工厂函数与枚举常量（STATES、SKILL_LEVELS、PROJECT_STATUSES 等） |
| `src/vault.js` | 本地 JSON 文件存储层：save/load/list/search，原子写入，ID 白名单，无 schema 校验 |
| `src/gitVault.js` | 在 Vault 之上叠加 Git 版本控制：自动 commit、history、revert、写锁、事务 |
| `src/vaultPath.js` | Vault 路径解析：区分真实 Vault（`work/vaults/real`）与 fixtures（`work/fixtures/`） |
| `src/stateMachine.js` | Project 管道状态机：纯函数 `transition()`，11 个状态、显式转换表、非法转换抛异常 |
| `src/pipeline.js` | 2.0 管道原型：从非线性思想到 Artifact/WallHit 的端到端演示流程 |
| `src/projectEngine.js` | 3.0 主循环引擎：项目 CRUD、证据链、Experience Receipt、Decision/Outcome、资产升级、复用试验 |
| `src/executionPolicy.js` | 自治策略：5 级自治模式（explore→commit），按动作风险分级管控 AI 自主写入 |
| `src/validate.js` | 字段/结构校验层：为每种记录类型提供 `validate*` 函数，返回 issues 数组 |
| `src/reviewEngine.js` | 审查引擎：将 ReviewPacket 的决策回写到目标 Skill/PreferenceHypothesis |
| `src/teamReviewEngine.js` | 团队审查流：分配、投票、讨论、确认阈值、finalize |
| `src/reuseEngine.js` | 复用检索：从 Vault 按类型检索 Rule/Skill/ReflectionMemory 等，构建 ReuseContext |
| `src/selfIterationEngine.js` | 自我迭代：基于 ReuseContext/ReflectionMemory 自动生成 Skill 候选并走生产验证 |
| `src/marketplace.js` | 技能市场：发布/下架/暂停、搜索、版本追踪、下载计数、评分聚合 |
| `src/pricingEngine.js` | 定价与授权：free/one_time/subscription、MIT/Commercial/Team、试用、平台抽成、密钥校验 |
| `src/qualityRating.js` | 质量评级：多因子评分（usage/approval/reviews/traction/activity），S/A/B/C/D 分级，低质自动标记 |
| `src/transactionLog.js` | 交易记录：购买/试用/退款流程、授权签发、收入统计、买家授权验证 |
| `src/skillRegistry.js` | Skill 注册表：本地索引、全文搜索、质量评分、分类、跨项目导入 |
| `src/mcpExporter.js` | MCP 导出器：将 stable Skill 打包为自包含 MCP Server（stdio/SSE），暴露 Prompt、Resource 与只读 tool `read_instructions` |
| `src/capturePermitStore.js` | 捕获许可：严格许可模式下的内容预览申请/审批/消费流程 |
| `src/alphaEvidence.js` | Alpha 证据检查：对已 Bootstrap 工作区报告许可捕获、模型状态、审查与复用情况 |
| `src/llmAdapter.js` | LLM 适配器：Mock/OpenAI/DeepSeek/Anthropic 四适配器，token 预算控制 |
| `src/agentStatus.js` | Agent 状态聚合：以已注册项目的可调用证据和同项目近期元数据事件推导 working/permission/completed/blocked |
| `src/platformEvidence.js` | 跨工作区证据校准：仅在宿主配置 Vault 与显式注册项目匹配时升级 L3/L4 |
| `src/attentionStatus.js` | 注意力快照：聚合逐 Agent 状态、待审草稿、审查包、WallHit、许可队列、LLM 状态 |
| `src/betaFeedback.js` | Beta 反馈收集：IP 限流（5 条/小时）、PII 过滤 |
| `src/accessControl.js` | 访问控制：四级角色（admin/owner/editor/viewer）× 三级可见性（private/team/public） |
| `src/webServer.js` | HTTP 入口：零框架原生 http 服务器，100+ REST 路由分支 + React 静态资源服务 |
| `src/eosRelayMcp.js` | MCP Relay Server：stdio 模式 MCP 服务，供 Codex 等 MCP 客户端跨工具捕获协作片段 |
| `src/eosPlatformAdapter.js` | AI 宿主适配器：按证据等级检测 Codex/Claude Code/Cursor/TRAE/VS Code |
| `src/eosMcpProbe.js` | MCP Relay 合规探针：真实执行 initialize + tools/list 并校验必备工具 |
| `src/eosCodexPreflight.js` | Codex 集成预检：检测 Codex CLI、报告 MCP 注册状态、生成安装/切换命令 |
| `src/eosDependencyParser.js` | JS/TS 依赖图解析器：零依赖扫描 import 关系生成 CodeGraph 快照（hub/cycle/leaf/blast radius） |
| `src/eosSessionLogWatcher.js` | 会话日志观察器：观察宿主落盘日志元数据推断会话状态，并发布 AgentBar 协议文件 |
| `src/agentbarReader.js` | AgentBar 协议读取器：读取 ~/.agentbar/state.d，装了 AgentBar hooks 的宿主零适配接入 |
| `src/eosCredentialResolver.js` | 宿主凭据解析：consent 携带 vaultDir，跨候选工作区定位有效捕获令牌 |
| `src/eosWorkbench.js` | 工作台解析：定位工作区 `.eos/` 目录、Vault 路径、projectId |
| `src/eosBootstrap.js` | Bootstrap：在目标目录初始化 `.eos/` 结构 |
| `src/onboardingDiscovery.js` | 经许可读取五类宿主的结构化项目路径索引，不读取聊天或源码内容 |
| `src/workspaceRegistry.js` | 本机多工作区注册表：原子写入、跨进程锁、串行 Bootstrap |
| `src/authService.js` | 手机/邮箱验证码身份网关；本地开发会话与生产 provider 边界 |
| `src/eosCodeGraphAdapter.js` | 代码图谱适配器：接收外部 AST/调用图快照，提取结构模式，计算 blast radius |
| `src/vaultMaintenance.js` | Vault 维护：归档候选预览、非破坏性归档 |
| `src/utils.js` | 公共工具：slug、safeIdSlug、latest、random id 等 |

## 命令清单

| 命令 | 用途 |
|---|---|
| `npm start` / `npm run web` | 启动 HTTP 服务器（默认 http://127.0.0.1:4173） |
| `npm run dev:web` | 启动 Vite 前端开发服务器（代理 API 到 4173） |
| `npm run demo` | 运行管道原型（故意生成不完整 Skill 以验证撞墙反馈） |
| `npm run validate` | 运行管道原型（生成完整 Skill，验证 Artifact 产出路径） |
| `npm run reuse` | 从历史 Vault 构建复用上下文（ReuseContext） |
| `npm run self-iterate` | 基于历史经验自动生成下一批 Skill 候选 |
| `npm run self-iterate:failure` | 验证自迭代失败候选会生成 WallHit 且不污染 Skill 库 |
| `npm run human-review` | 生成线性审查包并应用 demo 决策 |
| `npm run validate-vault` | 校验 Vault 中已覆盖 Schema 的记录 |
| `npm run archive-vault` | 预览 Vault 归档候选（加 `-- --apply --limit=N` 执行归档） |
| `npm run maintain` | 一键归档旧候选（默认 50 条，可传参数指定数量） |
| `npm run web:build` | 构建 React 前端（`npm --prefix apps/web-react run build`） |
| `npm run bootstrap` | 在目标目录初始化 `.eos/` 工作区 |
| `npm run codex:preflight` | 检查 Codex CLI 集成状态，输出注册命令 |
| `npm run relay:mcp` | 启动 MCP Relay Server（stdio 模式） |
| `npm run alpha:evidence` | 对已 Bootstrap 工作区运行 Alpha 证据检查 |
| `npm run workbench` | 工作台 CLI 工具 |
| `npm run deploy:preflight` | 部署前环境检查 |
| `npm run beta:packages` | 构建 beta 测试包 |
| `npm run release:check` | 检查版本、必备文档和前端构建产物一致性 |
| `npm run verify:release` | 完整行为验证 + 前端构建 + 发布一致性检查 |
| `npm run macos:build` | 构建 macOS menu-bar app（Swift） |
| `npm run macos:run` | 运行 macOS menu-bar app |
| `npm run macos:bundle` | 打包含内置 Core 的 macOS app bundle，并进行 ad-hoc 临时签名 |
| `npm run macos:dmg` | 构建、临时签名、挂载校验 macOS DMG，并生成 SHA-256 |
| `npm run macos:install-core` | 安装 launchd 核心代理 |
| `npm run macos:core-status` | 检查核心代理状态 |
| `npm test` | 运行全部自动化测试（`node --test tests/*.test.js`） |
| `npm run test:domain` | 仅运行 domain 测试 |
| `npm run test:validate` | 仅运行 validate 测试 |
| `npm run test:vault` | 仅运行 vault 测试 |
| `npm run test:pipeline` | 仅运行 pipeline 测试 |
| `npm run test:utils` | 仅运行 utils 测试 |
| `npm run verify` | 完整验证链：demo + validate + reuse + self-iterate + self-iterate:failure + human-review + validate-vault + test |

## 首次启动与登录

Apple Silicon 测试者可以直接使用 `npm run macos:dmg` 生成的邀请制 Alpha 安装包。把 `EOS.app` 拖入 Applications 后即可运行，无需浏览器、另装 Node.js 或另开 Core；完整 React 工作台会显示在应用自己的原生窗口中，关闭后可从菜单栏 Agent 雷达或屏幕边缘三灯悬浮窗重新打开。该包是 ad-hoc 临时签名且未公证，首次打开可能需要在 macOS“隐私与安全性”中确认。默认数据位于 `~/Library/Application Support/ExperienceOS/Workspace`。

EOS 的主品牌资产位于 `assets/brand/eos-logo-primary.png`。macOS 打包时会自动生成完整 `EOS.icns`，并将同一 Logo 用于应用图标、原生注意力窗和 React 工作台品牌位。

首次打开工作台会进入线性设置流程：

1. 可选择中国大陆手机号（`+86`）或邮箱验证，也可直接选择“仅本地使用”。
2. 用户明确授权后，EOS 才检测 Codex、Claude、Cursor、TRAE、VS Code。
3. EOS 只读取宿主保存的项目路径索引和目录工程标记，不读取聊天正文、源码或项目文件内容。
4. 用户选择项目并二次确认后，EOS 才为项目创建或复用 `<workspace>/.eos/`，并写入 `~/.experience-os/workspaces.json`。
5. 新注册项目的状态是 `awaiting_host_event`；MCP 真实可调用只算 L3，只有收到同项目、经许可的 Hook 事件后才算 L4 正在监测。

本地功能不依赖登录。`EOS_AUTH_DEV_OTP=1 npm run web` 可用于验证验证码界面，但显示的开发验证码只建立进程内本机会话，不会创建云账号。生产环境必须接入经过配置的短信/邮件或 OIDC 身份提供方。

## 测试

```bash
npm test
```

测试使用 Node.js 内置 `node:test` 运行器，零测试框架依赖。`tests/` 目录下 35+ 个测试文件覆盖核心模块：domain 类型、validate 校验、vault 存储、pipeline 管道、gitVault 版本控制、accessControl 权限、marketplace/pricing/quality/transaction 交易链、teamReview 团队审查、mcpExporter、skillRegistry、eosRelayMcp、eosPlatformAdapter、codeGraphAdapter、eosDependencyParser 等。

## 文档索引

- [架构说明](docs/ARCHITECTURE.md) — 分层架构、数据流、模块依赖、关键设计决策、不变量、扩展点
- [AI 工具集成架构](docs/INTEGRATION_ARCHITECTURE.md) — 五级兼容证据、宿主矩阵、协议选择和隐私边界
- [EOS 是什么：一页读懂](docs/EOS_EXPLAINED.md) — 产品理念、五步主线、名词白话表与上手三步
- [API 参考](docs/API.md) — HTTP 端点分组列表、认证方式、请求/响应 schema
- [数据模型](docs/DATA_MODEL.md) — 31 种 record kind、ID 命名约定、状态枚举、对象关系图
- [Beta 测试说明](docs/BETA_TESTING.md) — 外部测试闭环、数据边界和反馈回收
- [内测发放清单](docs/BETA_DISTRIBUTION.md) — 3.0.0-alpha.2 交付物、SHA-256、质检结论与发放指引
- [发布流程](docs/RELEASING.md) — Alpha 发布等级、双平台验收和签名边界
- [贡献指南](docs/CONTRIBUTING.md) — 开发环境、扩展步骤和提交检查
- [安全策略](SECURITY.md) — 漏洞报告方式和当前安全边界
- [变更记录](CHANGELOG.md) — 版本级功能与安全变化

## 版本里程碑

- **1.0** — 原型闭环完成：验证了"非线性思想 -> 线性工程对象 -> 生产验证 -> 撞墙反馈"的核心假设
- **2.0-A** — 工程 Rigor：Git Vault（自动版本控制、可 diff/回滚）+ 自动化测试框架（node:test）+ LLM 适配器（Mock/OpenAI/Anthropic）+ TypeScript 类型定义
- **2.0-B** — MCP 原生与协作：MCP 导出器（stable Skill -> 自包含 MCP Server）+ Skill 注册表（本地索引/搜索/质量评分）+ 访问控制（四级角色 × 三级可见性）+ 团队审查流（分配/投票/讨论/finalize）
- **2.0-C** — 经验资产交易：市场发布（搜索/版本/下载统计）+ 定价授权（三种定价模型 × 三种授权 + 试用 + 平台抽成）+ 质量评级（多因子 S/A/B/C/D 分级）+ 交易收入（购买/退款/收入统计/授权验证）
- **审核修复** — 全面安全审核：路径穿越防护 + 原子写入 + 授权密钥加密 + 防重复扣费 + Web API 访问控制 + 38+ 项边界测试
- **React 工作台** — 前端从原生 JS 迁移为 React 18 + Vite 5：项目入口 + 9 个高级视图（总览/市场/质量/营收/审查/撞墙/Skill库/审计/Vault维护）+ SPA 路由 + hooks 架构
- **3.0 阶段 0** — 可信自治基础：Vault 隔离（fixtures/real 分离）+ Project/EvidenceLink/ExperienceReceipt/DecisionReceipt/OutcomeRecord schema + AutonomyMode 执行策略（5 级风险分级）+ WallHit v2 可读格式 + Capture Relay MCP（严格许可模式）+ 项目时间线 + 经验资产升级门槛
- **3.0.0-alpha.1** — 邀请制 Alpha 基线：代码图谱 → 候选 Skill、统一身份协议、可下载 Beta 反馈、双平台测试手册、CI 和发布一致性检查

## 协议（License）

本项目采用 [PolyForm Noncommercial 1.0.0](LICENSE) 协议发布：

- **允许**：个人学习、研究、教学等非商业目的下运行、复制、修改与共享；
- **禁止**：任何商业使用，包括企业内部部署、有偿开发/维护/支持及一切以营利为目的的活动；
- **分发**：再分发必须附带协议全文，修改必须显著声明；
- **商业授权**：如需商用，请单独联系作者获取商业授权。
