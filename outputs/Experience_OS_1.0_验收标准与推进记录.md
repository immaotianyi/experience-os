# Experience OS 1.0 验收标准与推进记录

更新时间：2026-07-17

## 1. 1.0 定义

Experience OS 1.0 的目标不是功能数量最大化，而是让核心哲学闭环稳定、可审查、可验证：

```text
人类非线性思想
  -> AI 协作发散
  -> 工程对象抽取
  -> Skill 候选
  -> 生产验证
  -> WallHit / Artifact
  -> Human Review
  -> 资产回写
  -> Vault 复用
  -> 自迭代生成下一批 Skill
```

1.0 必须做到：

- 资产有明确字段和校验口径；
- Human Review 能真实改变资产状态；
- UI 能解释状态，而不是只展示 JSON；
- Vault 增长可观测、可预览归档、可受控移动旧记录；
- 自迭代结果必须经过生产验证；
- 工程 Debug + 升级 AI 可以基于文档、API 和原始记录做 debug、修复、补测试与升级。

## 2. 当前已达成

- `npm run verify` 已覆盖 demo、validate、reuse、self-iterate、human-review、validate-vault；
- Web UI 支持系统健康、Human Review 决策、详情抽屉、Vault 统计、Schema 校验和清理预览；
- Web UI 支持 ReviewPacket 状态筛选、WallHit 类型筛选、Skill 层级 / 状态 / promotionGate 筛选；
- Web UI 支持 ReviewDecision 审计视图，可追踪决策、目标资产、结果状态和断链情况；
- Skill 详情支持按需读取完整 review history；
- `ReuseContext` 已记录 `contributionCandidates`，并在被自迭代使用后回写 `outcome / usedInRunIds`；
- `WallHit` 已具备 `status / resolvedByIds / resolvedAt` 字段，`/api/wallhit-audit` 可观察 open / reflected / resolved 状态；
- `POST /api/wallhit-resolutions` 可将 WallHit 标记为 resolved，并关闭 `humanDecisionNeeded`；
- Web UI 支持 Vault 归档入口，可将旧候选移动到 `work/vault-archive/` 并生成 manifest；
- strategic Skill 的 `keep_candidate` 已落为 `candidate_retained`，并写入 `promotionGate`；
- Human Review 决策会回写目标资产；
- Vault 校验已覆盖当前全部核心资产类型。
- 自迭代失败路径已纳入 `npm run verify`：失败候选不会落入 Skill Vault，会生成 WallHit，并在 `SelfIterationRun.rejectedSkillIds` 中记录。

## 3. 当前验证快照

最近一次 `npm run verify`：

- exit 0；
- Vault 总记录：763；
- 已支持校验记录：763；
- 未覆盖 validator 记录：0；
- invalid：0。

归档能力验证：

- `npm run archive-vault` 可生成 preview；
- `npm run archive-vault -- --apply --limit=1` 已移动 1 条旧候选并生成 manifest；
- `POST /api/vault-archive` 已移动 1 条旧候选并生成 manifest；
- 归档后 `npm run validate-vault` 仍为 valid true，invalid 0。

审计深化验证：

- `/api/skill-review-history?skillId=skill.project_experience_os_self_iteration.auto_skill_growth_orchestrator` 返回 19 个审查包、18 条审查决策；
- `/api/wallhit-audit?limit=5` 返回 open 与 reflected 统计；
- 最新 `/api/reuse-contexts?limit=1` 返回 8 条 `contributionCandidates`。
- 自迭代使用后的 ReuseContext 已回写 `outcome=used_as_self_iteration_context` 与 `usedInRunIds`；
- `POST /api/wallhit-resolutions` 已将 1 条 WallHit 标记为 resolved，`humanDecisionNeeded=false`；
- 解析后的 `/api/wallhit-audit?limit=10` 返回 `resolved=1`。

## 4. 1.0 完成口径

1.0 已完成“原型闭环验证”，但不等同于产品级发布完成。

当前完成项：

- 核心哲学闭环成立；
- Web UI 可解释真实工程状态；
- Human Review 可真实回写资产；
- WallHit / ReflectionMemory / ReuseContext / SelfIterationRun 可形成经验复用；
- Vault 可校验、预览归档和受控归档；
- 工程 Debug + 升级 AI 已成为可写代码的工程角色；
- 亮暗模式配色温度已统一为暖色系。

2.0 PRD 对 1.0 的评估为 `7.2/10`。核心闭环均分较高，但工程基础不足，因此 P0 缺口不再作为 1.0 剩余项处理，而进入 2.0-A「工程 Rigor」。

## 5. 2.0 承接项

### P0：工程 Rigor

- ~~Git 版本控制集成：Vault 资产可追踪、可 diff、可回滚~~ → **已完成**（`src/gitVault.js`，auto-commit + history + revert + loadAtCommit + commitAll，CLI 写入脚本全部切到 GitVault，归档移动自动 commit，2 个 Git Web API 端点；LLM 状态另由 `/api/llm/status` 提供）；
- ~~自动化测试框架：单元 / 集成 / API / UI 分层测试~~ → **已完成**（`node:test` 零依赖，16 个测试文件，303 个测试全通过（含端到端集成测试），`npm run verify` 已包含 `npm test`）；
- ~~真实 LLM 集成：至少 1 个真实思想转译管道跑通~~ → **接口已完成**（`src/llmAdapter.js`，Mock/OpenAI/Anthropic 三适配器 + token 预算控制 + prompt 模板，待设置 API Key 跑通真实管道）；
- ~~TypeScript 迁移：领域对象、Vault、Pipeline、ReviewEngine、WebServer 逐步迁移~~ → **第一阶段已完成**（`src/types.ts` 全部 20 种记录 interface + `tsconfig.json` strict mode，后续阶段待推进）。

### P1：MCP 原生与协作

- ~~stable Skill 一键导出为 MCP Server~~ → **已完成**（`src/mcpExporter.js`，生成 server.json + README.md + index.js + package.json，支持 stdio/SSE 传输，3 个 Web API 端点）；
- ~~本地 / 远程 Skill 注册表~~ → **已完成**（`src/skillRegistry.js`，buildLocalIndex + searchIndex + importSkill + getSkillMetadata + listCategories，3 个 Web API 端点）；
- ~~多用户 Vault~~ → **已完成**（`src/accessControl.js`，三级角色 + 三级可见性 + 权限检查，单用户模式零侵入）；
- ~~团队审查流~~ → **已完成**（`src/teamReviewEngine.js`，assignee + 投票 + 讨论 + 确认阈值 + finalize，5 个 Web API 端点）；
- 前端从原生 JS 迁移到 React / Next.js 或同级架构 → **待推进**（2.0-C 已完成后的下一阶段）。

### P2：经验资产交易

- ~~Skill 质量评级~~ → **已完成**（`src/qualityRating.js`，市场感知评分 usage 25% + approval 20% + reviews 20% + traction 20% + activity 15%，S/A/B/C/D 分级，D 级自动标记 needs_revision，5 个 Web API 端点）；
- ~~定价与授权~~ → **已完成**（`src/pricingEngine.js`，free / one_time（¥9.9-¥99）/ subscription（¥3-¥19/月）三种定价，MIT / Commercial / Team 三种授权，试用 3 次，15% 抽成，授权密钥生成与校验，5 个 Web API 端点）；
- ~~市场发布~~ → **已完成**（`src/marketplace.js`，stable Skill 发布 / 下架 / 暂停，全文搜索 + 过滤 + 排序，版本追踪，下载计数，评分聚合，市场统计，8 个 Web API 端点）；
- ~~交易与收入~~ → **已完成**（`src/transactionLog.js`，完整购买流程 + 试用 + 退款 + 交易历史 + 卖家收入统计 + 买家授权验证，7 个 Web API 端点）；
- 个人免费、团队 `¥99/人/月`、市场抽成 `15%` → **已实现**（pricingEngine 支持 15% 抽成 / 85% 作者分成，TEAM_PLAN_PRICE = 99）；
- 前端从原生 JS 迁移到 React / Next.js → **待推进**（下一步）。
