# Experience OS

Experience OS 1.0 原型闭环、2.0 工程 Rigor / MCP / 经验资产交易、3.0 可用性与可信自治路线图均已推进。

它验证一件事：

> 人的非线性思想可以被转成线性工程对象，并通过生产通道的 Schema、状态机和撞墙反馈完成验证。

3.0 路线图见 `outputs/Experience_OS_3.0_可用性与可信自治路线图.md`，2.0 PRD 见 `experience-os-2-prd/experience-os-2-prd.html`。

当前口径：

- 1.0 = 原型闭环完成；
- 2.0-A = 工程 Rigor 已交付（Git Vault + 测试框架 + LLM 适配器 + TypeScript 类型定义）；
- 2.0-B = MCP 原生与协作已交付（MCP 导出器 + Skill 注册表 + 访问控制 + 团队审查流）；
- 2.0-C = 经验资产交易已交付（市场发布 + 定价授权 + 质量评级 + 交易收入）；
- 审核修复 = 全面安全审核完成（路径穿越防护 + 原子写入 + 授权密钥加密 + 防重复扣费 + Web API 访问控制 + 38 项边界测试）；
- React 工作台 = 原生 JS Web UI 已迁移为 React 工作台（项目入口 + 9 个高级视图 + Vite 构建 + SPA 路由 + hooks 架构）；
- 3.0 阶段 0 = 可信自治基础已开工（Vault 隔离 + Project/EvidenceLink/ExperienceReceipt schema + AutonomyMode 执行策略 + WallHit v2 可读格式）。

**重要区分**：2.0-C 的市场指标（listing 数、交易笔数、收入）来自 `work/fixtures/` 隔离 Vault 中的模拟交易数据，不是真实市场采用证明。3.0 的目标正是把主闭环做成真实可用的项目入口。

## 当前实现

- 核心领域对象：`Project`、`ConversationEvent`、`WorkCheckpoint`、`ExperienceReceiptDraft`、`ThoughtFragment`、`HumanEditLog`、`SubgoalSegment`、`WorkflowPattern`、`PreferenceHypothesis`、`Rule`、`Skill`、`Artifact`、`WallHit`、`ReflectionMemory`、`MotherSkillTrajectory`、`ReuseContext`、`SelfIterationRun`、`ReviewPacket`、`ReviewDecision`、`MarketplaceListing`、`Transaction`、`SkillRating`、`EvidenceLink`、`ExperienceReceipt`、`DecisionReceipt`、`OutcomeRecord`、`ExperienceAsset`（共 28 种）
- 状态机：协作 -> 发散 -> 候选提取 -> 生产验证 -> 撞墙或制品生成
- Vault：真实项目数据写入 `work/vaults/`，demo/verify 脚本写入隔离的 `work/fixtures/`（由 `src/vaultPath.js` 统一管理，可用 `EOS_VAULT_DIR` 覆盖）
- 撞墙反馈：当 Skill 缺少触发信号、Schema 或降级路径时，返回明确的 `WallHit`
- 自动 Skill 生长链路：`HumanEditLog -> SubgoalSegment -> WorkflowPattern -> SkillCandidate`
- 反思沉淀：`WallHit -> ReflectionMemory`
- 母 Skill 轨迹：每次路由都会生成 `MotherSkillTrajectory`，用于回放和审计
- 复用检索：从 Vault 中按类型检索 `Rule`、`Skill`、`ReflectionMemory`、`WorkflowPattern`、`PreferenceHypothesis`、`ThoughtFragment`，生成 `ReuseContext`
- 自我迭代：读取 `ReuseContext`、`WorkflowPattern`、`ReflectionMemory`、`MotherSkillTrajectory`，自动提出下一批 Skill 候选并走生产验证
- 人类审查：把偏好假设和自生成 Skill 整理成线性 `ReviewPacket`，记录 `ReviewDecision`，并把决策回写到目标资产
- React 工作台：默认“项目”入口（创建项目/记录证据/Experience Receipt/时间线）+ 9 个高级视图（总览/市场/质量看板/卖家营收/审查包/撞墙/Skill库/决策审计/Vault维护），React 18 + Vite 5 构建，SPA 路由，支持购买/评分/退款/审查决策/wallhit解决等完整交互
- Vault 审计：提供 `validate-vault`、`/api/validation`、`/api/vault-maintenance`，区分已覆盖 validator 的记录和未覆盖类型，并提供非破坏性归档预览
- Vault 归档：提供 `npm run archive-vault` preview、`npm run archive-vault -- --apply --limit=10`、`POST /api/vault-archive` 和 Web UI 入口；旧记录移动到 `work/vault-archive/`，并生成 manifest，不做删除
- 审计深化：`ReuseContext` 记录并回写 `contributionCandidates` outcome，Skill 详情可读取完整 review history，`/api/wallhit-audit` 可观察 WallHit 的 open / reflected / resolved 状态，`POST /api/wallhit-resolutions` 可将 WallHit 标记为 resolved
- Git 版本控制：Vault 已初始化为 Git 仓库，每次 `save()` 自动 commit，CLI 写入脚本与归档移动均保持 Git clean，`GitVault.commitAll(message)` 支持批量提交，归档移动后自动生成 `[VaultArchive] move ...` commit，支持 `history(recordId)` / `loadAtCommit(recordId, commitHash)` / `revert(recordId, commitHash)`，Web API 提供 `/api/git/history` 和 `/api/git/stats`
- LLM 适配器：`src/llmAdapter.js` 抽象 Mock / OpenAI / Anthropic 三适配器，根据环境变量自动切换，内置 token 预算控制，Web API 提供 `/api/llm/status`
- MCP 导出器：`src/mcpExporter.js` 将 stable Skill 自动封装为自包含 MCP Server 目录（server.json + README.md + index.js + package.json），支持 stdio / SSE 传输，JSON-RPC 2.0 协议，Web API 提供 `/api/mcp/export`、`/api/mcp/export-all`、`/api/mcp/list`
- Skill 注册表：`src/skillRegistry.js` 提供本地 Skill 索引、全文搜索、质量评分（usage 30% + approval 25% + reviews 25% + activity 20%，S/A/B/C/D 分级）、分类列表与跨项目导入，Web API 提供 `/api/skill-registry`、`/api/skill-registry/import`、`/api/skills/metadata`
- 访问控制：`src/accessControl.js` 三级角色（owner/editor/viewer）× 三级可见性（private/team/public），单用户模式零侵入，多用户模式通过 HTTP Header 传递用户上下文，Web API 已接入 `filterReadable` / `canEdit` / `applyOwnership`
- 团队审查流：`src/teamReviewEngine.js` 支持 assignee 分配、投票（approve/reject/abstain）、讨论线程与 @mention、确认阈值（默认团队 2 人，单人 1 人）、finalize 流程，Web API 提供 `/api/team-review/assign`、`/vote`、`/discuss`、`/summary`、`/finalize`
- 市场发布：`src/marketplace.js` 将 stable Skill 发布到本地市场，支持发布/下架/暂停、全文搜索、版本追踪、下载计数、评分聚合、市场统计，8 个 Web API 端点
- 定价与授权：`src/pricingEngine.js` 支持 free/one_time/subscription 三种定价模型、MIT/Commercial/Team 三种授权、试用机制（3 次）、15% 平台抽成、授权密钥生成（`crypto.randomBytes` 加密）与校验，5 个 Web API 端点
- 质量评级：`src/qualityRating.js` 市场感知质量评分（usage 25% + approval 20% + reviews 20% + traction 20% + activity 15%），S/A/B/C/D 分级，低质自动标记 needs_revision，5 个 Web API 端点
- 交易与收入：`src/transactionLog.js` 完整购买流程（检查→定价→抽成→授权→记录）、试用处理、退款、交易历史、卖家收入统计、买家授权验证，7 个 Web API 端点
- 自动化测试：`tests/` 目录下 17 个测试文件覆盖 domain / validate / vault / pipeline / utils / llmAdapter / gitVault / mcpExporter / skillRegistry / accessControl / teamReviewEngine / pricingEngine / qualityRating / marketplace / transactionLog / marketplace-e2e / auditFixes，共 342 个测试，`npm test` 运行
- TypeScript 类型定义：`src/types.ts` 定义全部 20 种记录 interface + `tsconfig.json` strict mode

## 运行

故意生成一个不完整 Skill，验证撞墙反馈：

```bash
npm run demo
```

生成一个结构完整 Skill，验证可产出 Artifact：

```bash
npm run validate
```

从历史 Vault 中构建下一次项目的复用上下文：

```bash
npm run reuse
```

一次性验证撞墙、成功制品和复用上下文：

```bash
npm run verify
```

让工具基于自身开发过程自动生成下一批 Skill 候选：

```bash
npm run self-iterate
```

验证自迭代失败候选会生成 WallHit，且不会污染 Skill 库：

```bash
npm run self-iterate:failure
```

生成适合人类线性阅读的审查包，并应用 demo 决策：

```bash
npm run human-review
```

校验 Vault 中已覆盖 Schema 的记录：

```bash
npm run validate-vault
```

运行自动化测试（342 个测试）：

```bash
npm test
```

预览 Vault 归档候选：

```bash
npm run archive-vault
```

显式归档少量旧候选：

```bash
npm run archive-vault -- --apply --limit=10
```

一键归档旧候选（按保留策略，默认 50 条）：

```bash
npm run maintain            # 归档 50 条
npm run maintain 100        # 归档 100 条
```

启动最小 Web UI：

```bash
npm run web
```

## 工程原则

这个原型暂时采用零依赖 ESM JavaScript，原因是先验证模型和流程，不被框架拖住。

下一阶段可以迁移到：

- TypeScript；
- Zod 或 JSON Schema；
- SQLite/PostgreSQL；
- Fastify/NestJS API；
- React/Next.js 前端工作台；
- MCP-compatible Skill registry。

## 2.0-A 已交付

1. ~~Git Vault~~：`src/gitVault.js`，资产变更自动版本化、可 diff、可回滚，`commitAll(message)` 批量提交，归档移动自动 commit，2 个 Git Web API 端点；
2. ~~自动化测试框架~~：`node:test` 零依赖，17 个测试文件，342 个测试，`npm run verify` 已包含；
3. ~~LLM 适配器~~：`src/llmAdapter.js`，Mock/OpenAI/Anthropic 三适配器 + token 预算 + prompt 模板，待设置 API Key 跑通真实管道；
4. ~~TypeScript 类型定义~~：`src/types.ts` 全部 20 种记录 interface + `tsconfig.json` strict mode。

## 2.0-B 已交付

1. ~~MCP 导出器~~：`src/mcpExporter.js`，stable Skill 一键导出为自包含 MCP Server 目录（server.json + README.md + index.js + package.json），支持 stdio / SSE 传输，3 个 Web API 端点；
2. ~~Skill 注册表~~：`src/skillRegistry.js`，本地索引 + 全文搜索 + 质量评分（S/A/B/C/D 分级）+ 跨项目导入，3 个 Web API 端点；
3. ~~访问控制~~：`src/accessControl.js`，三级角色 × 三级可见性，单用户模式零侵入，多用户模式通过 HTTP Header 传递用户上下文；
4. ~~团队审查流~~：`src/teamReviewEngine.js`，assignee 分配 + 投票 + 讨论线程 + 确认阈值 + finalize，5 个 Web API 端点。

## 2.0-C 已交付

1. ~~市场发布~~：`src/marketplace.js`，stable Skill 发布到本地市场，支持发布/下架/暂停、全文搜索（按 license/pricingModel/sellerId 过滤、按 downloads/rating/revenue/price/recent 排序）、版本追踪、下载计数、评分聚合、市场统计，8 个 Web API 端点；
2. ~~定价与授权~~：`src/pricingEngine.js`，free / one_time（¥9.9-¥99）/ subscription（¥3-¥19/月）三种定价模型，MIT / Commercial / Team 三种授权，试用机制（3 次），15% 平台抽成 / 85% 作者分成，授权密钥生成与校验，5 个 Web API 端点；
3. ~~质量评级~~：`src/qualityRating.js`，市场感知质量评分（usage 25% + approval 20% + reviews 20% + market traction 20% + activity 15%），S/A/B/C/D 分级，D 级 stable Skill 自动标记 needs_revision，质量排行榜，5 个 Web API 端点；
4. ~~交易与收入~~：`src/transactionLog.js`，完整购买流程（检查可购→定价→抽成→授权签发→记录→更新 listing）、试用处理、退款（含 listing 收入回退）、交易历史（按 buyer/listing/seller 过滤）、卖家收入统计（含 topSkills）、买家授权验证，7 个 Web API 端点。

## 审核修复已交付

全面安全审核覆盖核心存储层、2.0-C 业务模块和 Web API 层，共修复 6 个 P0 + 11 个 P1 + 4 个 P2 问题：

1. ~~路径穿越防护~~：`vault.js` 新增 `validateId()` 白名单校验，拒绝含 `..` / `/` / 特殊字符的 ID，`save()` 改为原子写入（`.tmp` + `rename`），`load()` 区分 ENOENT 和损坏文件；
2. ~~授权密钥加密~~：`pricingEngine.js` 授权密钥随机段改用 `crypto.randomBytes(4)`（32 位熵），`verifyLicenseKey` 严格正则校验，移除 `Math.random()`；
3. ~~确定性 ID 覆盖~~：`selfIterationEngine.js` 4 个 Skill ID 追加 `Date.now()` 后缀，防止重跑覆盖已审查 Skill；
4. ~~Review ID 前缀对齐~~：`reviewEngine.js` ID 前缀从 `review.` / `decision.` 改为 `review_packet.` / `review_decision.`，`gitVault.js` 保留旧前缀别名；
5. ~~防重复扣费~~：`transactionLog.js` one_time 购买前检查买家是否已持有授权，退款时同步回退 `downloads` 计数，trial 交易禁止退款；
6. ~~评分缓存同步~~：`qualityRating.js` `submitRating` 内部调用 `syncListingRatings`，重评保留 `createdAt` 更新 `updatedAt`；
7. ~~团队审查状态守卫~~：`teamReviewEngine.js` `submitVote` 拒绝对已 finalized 的 packet 投票；
8. ~~Web API 访问控制~~：`webServer.js` 接入 `accessControl`，list / search / history 端点调用 `filterReadable`，publish / import / review 端点调用 `applyOwnership`，review / wallhit 端点调用 `canEdit`，单用户模式零侵入；
9. ~~Web API 健壮性~~：错误响应不再泄露 `error.stack`，`readJsonBody` 防御 `null` JSON 体，所有 `limit` 参数经 `clampLimit` 限制上限 500；
10. ~~校验增强~~：`validate.js` 拒绝 unknown record kind，Transaction 新增 amount = commission + netToSeller 一致性校验、trial 金额必须为 0、非 trial 必须有 licenseKey 且格式合法。

## React 工作台已交付

原生 JS Web UI 已完整迁移为 React 工作台：

1. ~~React 18 + Vite 5 构建~~：产物输出到 `apps/web/`，由 `webServer.js` 提供静态文件服务，SPA fallback 支持客户端路由；
2. ~~项目入口 + 9 个高级视图~~：Project（创建项目/证据/Experience Receipt/时间线）作为默认入口；Overview（总览+市场统计）、Marketplace（搜索+详情+购买+评分）、Quality（排行榜+质量报告+低质预警）、SellerRevenue（收入统计+交易流水+退款）、Review（审查包队列+决策）、WallHits（撞墙记录+标记解决）、Skills（Skill库+详情）、Audit（决策审计）、Vault（验证+维护+归档）作为高级控制台；
3. ~~hooks 架构~~：`useFetch` 通用 GET hook + `useToast` 通知队列 + `useTheme` 主题切换 + `DetailDrawer` 滑入面板；
4. ~~API 层~~：5 个 API 模块（core/marketplace/quality/transaction/client）覆盖全部 25+ 端点，`getJson`/`postJson` 统一错误处理；
5. ~~键盘快捷键~~：1-9 切换视图、R 刷新、Esc 关闭抽屉。

## 3.0 阶段 0 已开工

3.0 的第一目标是把九视图工作台降为高级控制台，做出用户真正会自然使用的主闭环：

`项目开始 → 自然协作 → Experience Receipt → 受控生产 → 验证 → 结果记录 → 有证据的复用`

阶段 0 已完成：

- ✅ 修复 Marketplace 一笔购买被记为两次下载的 bug + 3 个回归测试
- ✅ 隔离 `work/fixtures/`（demo/verify）与 `work/vaults/`（真实项目），不再互相污染
- ✅ 新建 `Project`（升级）、`EvidenceLink`、`ExperienceReceipt`、`DecisionReceipt`、`OutcomeRecord` 的 schema、校验和单测
- ✅ 实现 `projectEngine.js`：项目时间线 + Evidence Link + Experience Receipt API（12 个端点）
- ✅ 建立 `executionPolicy.js`：按风险分级的自治策略（explore/advise/draft/execute/commit）
- ✅ WallHit 升级为 v2 可读格式（impact/evidence/options/acceptanceCriteria/replaySteps/severity）
- ✅ React 默认入口改为“项目”：可创建项目、记录 EvidenceLink、生成 Experience Receipt，并在线性时间线中审视来源与沉淀结果

阶段 0 待完成：

- 接入真实 LLM 的受控 Alpha（设置 `OPENAI_API_KEY` 或 `ANTHROPIC_API_KEY` 环境变量）
- 创建评估任务回归集
- 邀请首批用户试用主闭环

完整路线图见 `outputs/Experience_OS_3.0_可用性与可信自治路线图.md`。

## 3.0 可信经验核心（已实现）

这一轮把“自动经验资产化”从数据对象推进为受约束的可操作闭环：

`已同意捕获的协作片段 -> 证据 -> Experience Receipt -> 人工审查决策 -> 观察到的结果 -> ExperienceAsset`

- **Capture Relay API**：`POST /api/relay/events` 只接受用户明确 `consented: true` 的本地协作片段，保留来源工具与来源引用，不做静默抓取；
- **来源完整性**：Receipt、Decision、Outcome 引用的每一条 Evidence 都必须存在且属于同一项目；项目不存在、跨项目引用、重复引用和孤儿决策/结果都会被拒绝；
- **自治硬约束**：写入记录会区分 `human / relay / ai`。用户主动保存不会被误拦截；AI 自主写入则严格经过 `ExecutionPolicy`，例如项目处于 `advise` 时不能自行保存证据或生成 Receipt；
- **可复用经验升级门槛**：`ExperienceAsset` 只有在 Receipt 有证据、对应 Decision 已由人审查、Outcome 明确成功且引用该 Decision 时才能升级为 `approved`；
- **线性工作台**：项目页新增协作捕获、人工审查、结果回写、资格解释和“一键升级经验资产”。不满足资格时，页面会说明缺少什么，而不是只显示失败。

验证：新增 4 个主闭环回归测试；当前 `npm test` 为 421 passed，React 生产构建通过。

## 跨工具接入：Bootstrap + Capture Relay MCP

EOS 现在提供一个不绑定单一 IDE 的本地接入方式：

```bash
npm run bootstrap -- /你的/项目目录 "项目名称" "项目目标"
```

它只会在目标目录新增可见的 `.eos/`：本地 Git Vault、项目身份、README 和 `mcp.json`；不会移动、扫描或修改业务文件。`mcp.json` 可作为 MCP-compatible 客户端的本地服务定义，运行的是：

```bash
npm run relay:mcp
```

Relay 对外只暴露四个有限工具：捕获已同意的协作片段、读取项目升级资格、读取已验证经验、读取证据时间线。它不能替人批准决策或提升资产状态。

## 当前复用策略

`reuse` 不做单一全局搜索，而是按资产类型分别检索和去重：

- `Rule`：最多 3 条；
- `Skill`：最多 3 条；
- `ReflectionMemory`：最多 3 条；
- `WorkflowPattern`：最多 3 条；
- `PreferenceHypothesis`：最多 2 条；
- `ThoughtFragment`：最多 2 条。

这样可以避免某一种高频资产淹没其他资产，让下一次项目启动时同时继承规则、工具、失败教训、工作流和个人偏好。

## 当前自我迭代策略

`self-iterate` 会基于最近的复用上下文、工作流、反思记忆和母 Skill 轨迹生成候选 Skill。

当前会尝试生成：

- `复用上下文构建`
- `撞墙反思沉淀`
- `偏好假设人工确认`
- `自动 Skill 生长编排`

所有候选 Skill 都必须经过生产验证。通过后生成 `Artifact`，失败则生成 `WallHit`。

## 当前 Human Review 策略

Human Review 不直接展示原始 JSON，而是生成线性审查包：

```text
建议动作
  -> 为什么
  -> 证据
  -> 风险
  -> 可选决策
```

当前审查对象包括：

- `PreferenceHypothesis`：确认、修改后确认、驳回、暂缓；
- 自生成 `Skill`：确认候选、升级稳定、要求修改、驳回。

默认 demo 决策是保守的：偏好假设暂缓，自生成 Skill 只确认候选，不直接升级稳定。

Web UI 会通过 `POST /api/review-decisions` 提交真实决策。决策会：

- 将 `ReviewPacket.status` 更新为 `decided`；
- 写入 `ReviewDecision`；
- 将结果回写到目标 `Skill` 或 `PreferenceHypothesis`；
- 对 strategic Skill 的 `keep_candidate` 写入 `candidate_retained`、`promotionGate` 和 `candidateReason`。

Web UI 的详情抽屉会展示：

- `Skill`：状态、层级、来源、升级门、触发器、降级路径和原始 JSON；
- `ReviewPacket`：目标资产、默认选项、线性审查结构和原始 JSON；
- `WallHit`：墙类型、阶段、阻塞项、建议修复和原始 JSON。

审计 API 还提供：

- `/api/skill-review-history?skillId=...`：按 Skill 聚合完整审查包与审查决策；
- `/api/wallhit-audit`：观察 WallHit 状态、关联 ReflectionMemory 与轨迹；
- `/api/wallhit-resolutions`：将 WallHit 标记为 resolved，并关闭 `humanDecisionNeeded`；
- `/api/reuse-contexts`：最新记录中包含 `contributionCandidates`，用于追踪资产被推荐后的预期贡献。
