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

启动后访问 `http://127.0.0.1:4173` 即可看到 React 工作台（项目入口 + 高级控制台）。

### Codex 集成（一行命令注册 MCP Relay）

在项目目录下运行 `npm run codex:preflight` 查看当前 Codex 集成状态和安装命令。典型注册命令：

```bash
codex mcp add experience-os --env EOS_VAULT_DIR='/path/to/.eos/vault' --env EOS_CAPTURE_POLICY=strict_permit -- /absolute/path/to/node /absolute/path/to/src/eosRelayMcp.js
```

Relay 只暴露四个受限工具：捕获已同意的协作片段、查询项目升级资格、读取已验证经验、读取证据时间线。它不能替人批准决策或提升资产状态。

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
| `src/domain.js` | 28+ 种领域记录类型的工厂函数与枚举常量（STATES、SKILL_LEVELS、PROJECT_STATUSES 等） |
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
| `src/mcpExporter.js` | MCP 导出器：将 stable Skill 打包为自包含 MCP Server（stdio/SSE） |
| `src/capturePermitStore.js` | 捕获许可：严格许可模式下的内容预览申请/审批/消费流程 |
| `src/alphaEvidence.js` | Alpha 证据检查：对已 Bootstrap 工作区报告许可捕获、模型状态、审查与复用情况 |
| `src/llmAdapter.js` | LLM 适配器：Mock/OpenAI/DeepSeek/Anthropic 四适配器，token 预算控制 |
| `src/attentionStatus.js` | 注意力快照：聚合待审草稿、审查包、WallHit、许可队列、LLM 状态 |
| `src/betaFeedback.js` | Beta 反馈收集：IP 限流（5 条/小时）、PII 过滤 |
| `src/accessControl.js` | 访问控制：三级角色（owner/editor/viewer）× 三级可见性（private/team/public） |
| `src/webServer.js` | HTTP 入口：零框架原生 http 服务器，70+ REST API 端点 + React 静态资源服务 |
| `src/eosRelayMcp.js` | MCP Relay Server：stdio 模式 MCP 服务，供 Codex 等 MCP 客户端跨工具捕获协作片段 |
| `src/eosPlatformAdapter.js` | 平台适配器：检测/启动 tray/work/vault/codex/cloud 五个集成面 |
| `src/eosCodexPreflight.js` | Codex 集成预检：检测 Codex CLI、报告 MCP 注册状态、生成安装/切换命令 |
| `src/eosWorkbench.js` | 工作台解析：定位工作区 `.eos/` 目录、Vault 路径、projectId |
| `src/eosBootstrap.js` | Bootstrap：在目标目录初始化 `.eos/` 结构 |
| `src/eosCodeGraphAdapter.js` | 代码图谱适配器：接收外部 AST/调用图快照，提取结构模式，计算 blast radius |
| `src/vaultMaintenance.js` | Vault 维护：归档候选预览、非破坏性归档 |
| `src/utils.js` | 公共工具：slug、safeIdSlug、latest、random id 等 |

## 命令清单

| 命令 | 用途 |
|---|---|
| `npm start` / `npm run web` | 启动 HTTP 服务器（默认 http://127.0.0.1:4173） |
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
| `npm run macos:build` | 构建 macOS menu-bar app（Swift） |
| `npm run macos:run` | 运行 macOS menu-bar app |
| `npm run macos:bundle` | 打包 macOS app bundle |
| `npm run macos:install-core` | 安装 launchd 核心代理 |
| `npm run macos:core-status` | 检查核心代理状态 |
| `npm test` | 运行全部自动化测试（`node --test tests/*.test.js`） |
| `npm run test:domain` | 仅运行 domain 测试 |
| `npm run test:validate` | 仅运行 validate 测试 |
| `npm run test:vault` | 仅运行 vault 测试 |
| `npm run test:pipeline` | 仅运行 pipeline 测试 |
| `npm run test:utils` | 仅运行 utils 测试 |
| `npm run verify` | 完整验证链：demo + validate + reuse + self-iterate + self-iterate:failure + human-review + validate-vault + test |

## 测试

```bash
npm test
```

测试使用 Node.js 内置 `node:test` 运行器，零测试框架依赖。`tests/` 目录下 35+ 个测试文件覆盖核心模块：domain 类型、validate 校验、vault 存储、pipeline 管道、gitVault 版本控制、accessControl 权限、marketplace/pricing/quality/transaction 交易链、teamReview 团队审查、mcpExporter、skillRegistry、eosRelayMcp、eosPlatformAdapter、codeGraphAdapter 等。

## 文档索引

- [架构说明](docs/ARCHITECTURE.md) — 分层架构、数据流、模块依赖、关键设计决策、不变量、扩展点
- [API 参考](docs/API.md) — HTTP 端点分组列表、认证方式、请求/响应 schema
- [数据模型](docs/DATA_MODEL.md) — 28+ 种 record kind、ID 命名约定、状态枚举、对象关系图
- CONTRIBUTING.md — 待补充

## 版本里程碑

- **1.0** — 原型闭环完成：验证了"非线性思想 -> 线性工程对象 -> 生产验证 -> 撞墙反馈"的核心假设
- **2.0-A** — 工程 Rigor：Git Vault（自动版本控制、可 diff/回滚）+ 自动化测试框架（node:test）+ LLM 适配器（Mock/OpenAI/Anthropic）+ TypeScript 类型定义
- **2.0-B** — MCP 原生与协作：MCP 导出器（stable Skill -> 自包含 MCP Server）+ Skill 注册表（本地索引/搜索/质量评分）+ 访问控制（三级角色 × 三级可见性）+ 团队审查流（分配/投票/讨论/finalize）
- **2.0-C** — 经验资产交易：市场发布（搜索/版本/下载统计）+ 定价授权（三种定价模型 × 三种授权 + 试用 + 平台抽成）+ 质量评级（多因子 S/A/B/C/D 分级）+ 交易收入（购买/退款/收入统计/授权验证）
- **审核修复** — 全面安全审核：路径穿越防护 + 原子写入 + 授权密钥加密 + 防重复扣费 + Web API 访问控制 + 38+ 项边界测试
- **React 工作台** — 前端从原生 JS 迁移为 React 18 + Vite 5：项目入口 + 9 个高级视图（总览/市场/质量/营收/审查/撞墙/Skill库/审计/Vault维护）+ SPA 路由 + hooks 架构
- **3.0 阶段 0** — 可信自治基础：Vault 隔离（fixtures/real 分离）+ Project/EvidenceLink/ExperienceReceipt/DecisionReceipt/OutcomeRecord schema + AutonomyMode 执行策略（5 级风险分级）+ WallHit v2 可读格式 + Capture Relay MCP（严格许可模式）+ 项目时间线 + 经验资产升级门槛
