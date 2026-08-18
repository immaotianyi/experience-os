# 数据模型

## 总览

EOS 的 Vault 存储 31 种 record kind，按业务域分组如下。每种 kind 对应 `vault.js` 中 `COLLECTION_DIR` 的一个子目录，每条记录是一个独立的 JSON 文件。

### 项目域
- `Project` — 项目（顶层容器）
- `ConversationEvent` — 协作事件（对话片段）
- `WorkCheckpoint` — 工作检查点（人工标记的工作边界）
- `EvidenceLink` — 证据链接（指向文档/代码/数据/测试/反馈/参考/观察/代码图谱）
- `ExperienceReceipt` — 经验收据（人类确认的阶段总结）
- `ExperienceReceiptDraft` — 经验收据草案（LLM 生成，待审查）
- `DecisionReceipt` — 决策收据（记录 AI 自主决策）
- `OutcomeRecord` — 结果记录（决策执行后的观察结果）
- `ExperienceAsset` — 经验资产（通过验证可复用的经验）
- `ExperienceReuseTrial` — 复用试验（记录资产在新项目中的试用效果）

### 对话与思想域（2.0 管道）
- `ThoughtFragment` — 思想片段（从对话中提取的主题）
- `HumanEditLog` — 人工编辑日志（记录人对 AI 输出的修改）
- `SubgoalSegment` — 子目标段（从编辑日志中拆分的可操作单元）
- `WorkflowPattern` — 工作流模式（从子目标中识别的重复模式）
- `PreferenceHypothesis` — 偏好假设（关于用户偏好的待验证假设）
- `ReflectionMemory` — 反思记忆（撞墙后沉淀的教训）
- `MotherSkillTrajectory` — 母 Skill 轨迹（一次管道执行的输入/输出链）
- `ReuseContext` — 复用上下文（检索结果汇总）
- `SelfIterationRun` — 自我迭代运行（一次自迭代的输入/候选/结果）

### 规则与技能域
- `Rule` — 规则（从思想中提取的约束/准则）
- `Skill` — 技能（可复用的自动化能力单元）

### 审查域
- `ReviewPacket` — 审查包（线性化的待审对象）
- `ReviewDecision` — 审查决策（approve/reject/modify 的结果）

### 市场与交易域
- `MarketplaceListing` — 市场上架（Skill 的市场展示）
- `Transaction` — 交易（购买/试用/退款记录）
- `SkillRating` — 技能评分（用户评分和评论）

### 证据与收据域
（见项目域中的 EvidenceLink / ExperienceReceipt / DecisionReceipt / OutcomeRecord）

### 代码图谱域
- `CodeGraphPattern` — 代码图谱模式（hub/hotspot/cycle/leaf/bridge）
- `CodeGraphSnapshot` — 代码图谱快照（摄入的原始节点/边数据）

### 其他
- `WallHit` — 撞墙（验证失败或阻塞点）
- `BetaFeedback` — Beta 反馈（产品级自愿反馈，不含协作内容）
- `CapturePermitRequest` — 捕获许可请求（存储在 `.eos/permits/`，不在 Vault 中）

## 每个核心类型

### Project

- **id 前缀**: `project.`（如 `project.experience_os_0_1`）
- **存储目录**: `projects/`
- **关键字段**: `name`, `goal`, `constraints[]`, `acceptanceCriteria[]`, `state`（管道状态）, `status`（生命周期状态）, `ownerId`, `autonomyMode`, `evidenceLinkIds[]`, `experienceReceiptIds[]`, `tags[]`, `createdAt`, `updatedAt`
- **生命周期**: 由 `projectEngine.startProject()` 创建；`updateProject()` 修改；可在 status 间转换（planning→active→paused→completed→archived）；管道 state 由 `stateMachine.transition()` 推进。
- **关联**: 1:N EvidenceLink, 1:N ExperienceReceipt, 1:N Artifact, 1:N WallHit, 1:N ExperienceAsset

### ConversationEvent

- **id 前缀**: `event.`
- **存储目录**: `events/`
- **关键字段**: `projectId`, `actor`（human/agent 名）, `content`, `sourceTool`（codex/cursor/manual/...）, `sourceRef`, `consented`（必须为 true）, `capturePermitId`, `createdAt`
- **生命周期**: 由 `captureCollaborationEvent()`（webServer/relay）或 pipeline.js 创建；不可变，只追加。
- **关联**: N:1 Project；1:1 或 1:N ThoughtFragment（pipeline 中派生）

### WorkCheckpoint

- **id 前缀**: `checkpoint.`
- **存储目录**: `work-checkpoints/`
- **关键字段**: `projectId`, `title`, `eventId`, `evidenceLinkId`, `notes`, `capturePermitId`, `status`（captured）, `createdAt`, `updatedAt`
- **生命周期**: 由 `captureWorkCheckpoint()` 创建；将一次人工标记的工作边界同时创建 ConversationEvent + EvidenceLink + WorkCheckpoint。
- **关联**: N:1 Project, 1:1 ConversationEvent, 1:1 EvidenceLink

### EvidenceLink

- **id 前缀**: `evidence.`
- **存储目录**: 由 Vault 管理（artifacts 不，evidence-links 目录）
- **关键字段**: `projectId`, `type`（doc/code/data/test/feedback/reference/observation/code-graph）, `title`, `source`（URL/文件路径/文本引用）, `hash`, `notes`, `uncertainty`（0-1）, `counterexamples[]`, `applicabilityBounds[]`, `origin`（human/relay/ai）, `actor`, `capturePermitId`, `createdAt`
- **生命周期**: 由 `addEvidenceLink()` 创建；不可变。
- **关联**: N:1 Project；被 ExperienceReceipt.evidenceLinkIds、DecisionReceipt.evidenceLinkIds、OutcomeRecord.evidenceLinkIds 引用

### ExperienceReceipt

- **id 前缀**: `receipt.`
- **存储目录**: `experience-receipts/`
- **关键字段**: `projectId`, `phase`, `summary`, `evidenceLinkIds[]`, `outcome`（success/partial/failure/unknown）, `uncertainty`, `counterexamples[]`, `applicabilityBounds[]`, `lessonsLearned[]`, `autonomyMode`, `sourceDraftId`, `origin`, `actor`, `createdAt`
- **生命周期**: 两种路径：(1) LLM 生成 Draft → 人类 accept 转为 Receipt；(2) 人类直接通过 `writeExperienceReceipt()` 手动写入。
- **关联**: N:1 Project；N:M EvidenceLink（通过 evidenceLinkIds）；1:1 ExperienceReceiptDraft（sourceDraftId）；被 ExperienceAsset.receiptId 引用

### ExperienceReceiptDraft

- **id 前缀**: `receipt_draft.`
- **存储目录**: `experience-receipt-drafts/`
- **关键字段**: `projectId`, `checkpointIds[]`, `evidenceLinkIds[]`, `phase`, `summary`, `outcome`, `uncertainty`, `counterexamples[]`, `applicabilityBounds[]`, `lessonsLearned[]`, `generationWarnings[]`, `generatedBy`, `status`（pending_review/accepted/deferred/rejected）, `createdAt`
- **生命周期**: 由 `proposeExperienceReceiptDraft()`（LLM 调用）创建；人类 accept/reject/defer/resume；accepted 后产生正式 Receipt，draft 保留为审计记录。
- **关联**: N:1 Project；1:1 ExperienceReceipt（accept 后）

### DecisionReceipt

- **id 前缀**: `decision_receipt.`
- **存储目录**: `decision-receipts/`
- **关键字段**: `projectId`, `action`, `target`, `rationale`, `evidenceLinkIds[]`, `receiptId`, `autonomyMode`, `humanReviewed`, `reviewedBy`, `revertible`, `revertInstructions`, `origin`, `actor`, `createdAt`
- **生命周期**: 当 autonomyMode >= execute 时由引擎自动创建；可后续补充 humanReviewed。
- **关联**: N:1 Project；N:M EvidenceLink；可被 OutcomeRecord.decisionReceiptId 引用；被 ExperienceAsset.decisionReceiptId 引用

### OutcomeRecord

- **id 前缀**: `outcome.`
- **存储目录**: `outcome-records/`
- **关键字段**: `projectId`, `decisionReceiptId`, `action`, `outcome`（success/partial/failure/unknown）, `metrics{}`, `notes`, `evidenceLinkIds[]`, `origin`, `actor`, `createdAt`
- **生命周期**: 由 `recordOutcome()` 创建，在决策执行后记录观察结果。
- **关联**: N:1 Project；N:1 DecisionReceipt；被 ExperienceAsset.outcomeRecordId 引用

### ExperienceAsset

- **id 前缀**: `asset.`
- **存储目录**: `experience-assets/`
- **关键字段**: `projectId`, `receiptId`, `decisionReceiptId`, `outcomeRecordId`, `title`, `status`（candidate/approved/rejected）, `approvedBy`, `createdAt`, `updatedAt`
- **生命周期**: 由 `promoteExperienceAsset()` 创建/升级。升级为 approved 需满足：Receipt 有证据 + Decision 已人审 + Outcome 为 success 且引用该 Decision。
- **关联**: N:1 Project, 1:1 ExperienceReceipt, 1:1 DecisionReceipt, 1:1 OutcomeRecord；1:N ExperienceReuseTrial

### ExperienceReuseTrial

- **id 前缀**: `trial.`（实际代码中使用 `reuse.` 前缀）
- **存储目录**: `experience-reuse-trials/`
- **关键字段**: `projectId`, `assetId`, `sourceProjectId`, `taskTitle`, `decision`（adopted）, `decisionNote`, `outcome`, `outcomeNote`, `reducedRepeatedDecision`, `completedAt`, `createdAt`, `updatedAt`
- **生命周期**: 由 `startExperienceReuseTrial()` 创建；`completeExperienceReuseTrial()` 记录结果。
- **关联**: N:1 ExperienceAsset, N:1 Project（当前项目）, N:1 Project（来源项目）

### Skill

- **id 前缀**: `skill.`
- **存储目录**: `skills/`
- **关键字段**: `projectId`, `name`, `origin`（human/ai/...）, `trigger`, `inputSchema`, `outputSchema`, `safetyLevel`, `fallback`, `humanConfirmationRequired`, `skillLevel`（strategic/functional/atomic）, `status`（candidate/candidate_retained/candidate_confirmed/stable/needs_revision/rejected）, `memoryUtility`, `adaptationNotes[]`, `promotionGate`, `candidateReason`, `lastReviewDecisionId`, `reviewedAt`, `createdAt`, `updatedAt`
- **生命周期**: `createSkillCandidate()` 创建为 candidate；经 Human Review 可升级为 candidate_retained/candidate_confirmed/stable，或 rejected/needs_revision。
- **关联**: N:1 Project；可被 MarketplaceListing.skillId 引用；可被 Artifact.sourceIds 引用

### Artifact

- **id 前缀**: `artifact.`
- **存储目录**: `artifacts/`
- **关键字段**: `projectId`, `title`, `artifactType`, `content`, `sourceIds[]`, `createdAt`
- **生命周期**: 由 pipeline.js 在 PRODUCTION_VALIDATING 通过时创建（validateCandidateIntoArtifact 返回 ok: true）；selfIterationEngine 也在 Skill 验证通过后创建。
- **关联**: N:1 Project；N:M Skill/Rule 等（通过 sourceIds）

### WallHit

- **id 前缀**: `wallhit.`
- **存储目录**: `wallhits/`
- **关键字段**: `projectId`, `wallType`（schema_missing/trigger_unstable/safety_unclear/fallback_missing/human_confirmation_missing/target_missing）, `stage`, `message`, `blockedBy`, `suggestedFixes[]`, `status`（open/resolved）, `resolvedByIds[]`, `resolvedAt`, `impact`, `evidenceLinkIds[]`, `options[]`, `acceptanceCriteria[]`, `replaySteps[]`, `severity`（low/medium/high/blocker）, `humanDecisionNeeded`, `createdAt`
- **生命周期**: 由 pipeline.js（验证失败时）、selfIterationEngine（Skill 候选验证失败时）、reviewEngine（审查目标缺失时）创建；`handleWallHitResolution()` 标记为 resolved。
- **关联**: N:1 Project；1:1 ReflectionMemory（sourceWallHitId）

### Rule

- **id 前缀**: `rule.`
- **存储目录**: `rules/`
- **关键字段**: `projectId`, `title`, `statement`, `sourceThoughtIds[]`, `scope`（personal/...）, `createdAt`
- **生命周期**: 由 pipeline.js 在管道中从 ThoughtFragment 派生。
- **关联**: N:1 Project；N:M ThoughtFragment

### ThoughtFragment

- **id 前缀**: `thought.`
- **存储目录**: `thoughts/`
- **关键字段**: `projectId`, `sourceEventId`, `summary`, `themes[]`, `evidence, `createdAt`
- **生命周期**: 由 pipeline.js 从 ConversationEvent 提取。
- **关联**: N:1 Project, N:1 ConversationEvent

### HumanEditLog

- **id 前缀**: `edit.`
- **存储目录**: `human-edit-logs/`
- **关键字段**: `projectId`, `sourceEventId`, `before`, `after`, `editType`, `rationale`, `capturedSignals[]`, `createdAt`
- **生命周期**: 由 pipeline.js 创建，记录人对 AI 输出的修改。
- **关联**: N:1 Project, N:1 ConversationEvent

### SubgoalSegment

- **id 前缀**: `subgoal.`
- **存储目录**: `subgoal-segments/`
- **关键字段**: `projectId`, `sourceEditLogIds[]`, `title`, `intent`, `inputs[]`, `outputs[]`, `createdAt`
- **生命周期**: 由 pipeline.js 从 HumanEditLog 拆分。
- **关联**: N:1 Project, N:M HumanEditLog

### WorkflowPattern

- **id 前缀**: `workflow.`
- **存储目录**: `workflow-patterns/`
- **关键字段**: `projectId`, `sourceSubgoalIds[]`, `name`, `pattern`, `recurrenceEvidence[]`, `candidateSkillIds[]`, `createdAt`
- **生命周期**: 由 pipeline.js 从 SubgoalSegment 中识别重复模式创建。
- **关联**: N:1 Project, N:M SubgoalSegment, N:M Skill（候选）

### PreferenceHypothesis

- **id 前缀**: `pref.`
- **存储目录**: `preference-hypotheses/`
- **关键字段**: `projectId`, `statement`, `evidenceIds[]`, `confidence`, `status`（hypothesis/confirmed/confirmed_after_revision/rejected）, `decayPolicy`, `lastReviewDecisionId`, `reviewedAt`, `createdAt`, `updatedAt`
- **生命周期**: 由 pipeline.js 创建为 hypothesis；经 Human Review 可 confirmed/rejected。
- **关联**: N:1 Project；被 ReviewPacket 审查

### ReflectionMemory

- **id 前缀**: `reflection.`
- **存储目录**: `reflection-memories/`
- **关键字段**: `projectId`, `sourceWallHitId`, `lesson`, `avoidNextTime`, `replayPointers[]`, `createdAt`
- **生命周期**: 由 pipeline.js 在 WALL_HIT 路径创建。
- **关联**: N:1 Project, 1:1 WallHit

### MotherSkillTrajectory

- **id 前缀**: `trajectory.`
- **存储目录**: `mother-skill-trajectories/`
- **关键字段**: `projectId`, `motherSkillId`, `route`, `inputs`, `outputs`, `wallHitIds[]`, `fallbackUsed`, `createdAt`
- **生命周期**: 由 pipeline.js 在每次管道执行结束时创建，记录完整的输入/输出链。
- **关联**: N:1 Project；N:M WallHit

### ReuseContext

- **id 前缀**: `reuse.`
- **存储目录**: `reuse-contexts/`
- **关键字段**: `projectId`, `query`, `matchedRecordIds[]`, `recommendedRuleIds[]`, `recommendedSkillIds[]`, `recommendedReflectionIds[]`, `recommendedWorkflowIds[]`, `contributionCandidates[]`, `summary`, `createdAt`
- **生命周期**: 由 reuseEngine.js 构建。
- **关联**: N:1 Project；引用多个 Rule/Skill/ReflectionMemory/WorkflowPattern

### SelfIterationRun

- **id 前缀**: `self_iteration.`
- **存储目录**: `self-iteration-runs/`
- **关键字段**: `projectId`, `sourceRecordIds[]`, `candidateSkillIds[]`, `acceptedSkillIds[]`, `rejectedSkillIds[]`, `wallHitIds[]`, `artifactIds[]`, `iteration`, `summary`, `createdAt`
- **生命周期**: 由 selfIterationEngine.js 在每次自迭代运行时创建。
- **关联**: N:1 Project；N:M Skill, N:M Artifact, N:M WallHit

### ReviewPacket

- **id 前缀**: `review_packet.`
- **存储目录**: `review-packets/`
- **关键字段**: `projectId`, `targetKind`, `targetId`, `title`, `recommendation`, `why`, `evidence[]`, `risks[]`, `options[]`, `defaultOption`, `status`（pending/decided）, `assignees[]`, `votes[]`, `discussion[]`, `createdAt`, `updatedAt`
- **生命周期**: 由 reviewEngine.js（human-review 流）或 teamReviewEngine.js 创建；finalize 或 applyReviewDecision 后标记为 decided。
- **关联**: N:1 Project；1:1 目标对象（Skill/PreferenceHypothesis）；1:N ReviewDecision

### ReviewDecision

- **id 前缀**: `review_decision.`
- **存储目录**: `review-decisions/`
- **关键字段**: `projectId`, `reviewPacketId`, `targetKind`, `targetId`, `decision`, `rationale`, `resultingStatus`, `createdAt`
- **生命周期**: 由 applyReviewDecision() 在人类提交决策时创建；决策回写到目标对象（Skill/PreferenceHypothesis 更新状态）。
- **关联**: N:1 ReviewPacket, N:1 目标对象

### MarketplaceListing

- **id 前缀**: `listing.`
- **存储目录**: `marketplace-listings/`
- **关键字段**: `projectId`, `skillId`, `sellerId`, `version`, `pricing{model,price,currency}`, `license`（MIT/Commercial/Team）, `trialEnabled`, `status`（active/unpublished/suspended）, `summary`, `downloads`, `ratingSum`, `ratingCount`, `revenue`, `publishedAt`, `createdAt`, `updatedAt`
- **生命周期**: 由 publishSkill() 创建（active）；unpublishSkill() 下架；suspendListing() 暂停（仅 admin）。
- **关联**: N:1 Skill；1:N Transaction

### Transaction

- **id 前缀**: `transaction.`
- **存储目录**: `transactions/`
- **关键字段**: `projectId`, `listingId`, `skillId`, `buyerId`, `sellerId`, `type`（purchase/subscription/trial）, `amount`, `commission`, `netToSeller`, `licenseKey`, `licenseType`, `status`（completed/refunded/pending）, `createdAt`, `updatedAt`
- **生命周期**: 由 processPurchase()/processTrial() 创建为 completed；refundTransaction() 标记为 refunded。
- **关联**: N:1 MarketplaceListing, N:1 Skill；买家/卖家通过 buyerId/sellerId 关联

### SkillRating

- **id 前缀**: `rating.`
- **存储目录**: `skill-ratings/`
- **关键字段**: `projectId`, `skillId`, `userId`, `score`（1-5）, `review`, `createdAt`, `updatedAt`
- **生命周期**: 由 submitRating() 创建/更新。
- **关联**: N:1 Skill

### CodeGraphPattern

- **id 前缀**: `codegraph.`
- **存储目录**: `code-graph-patterns/`
- **关键字段**: `projectId`, `sourceSnapshotId`, `patternType`（hub/hotspot/cycle/leaf/bridge）, `nodeId`, `nodeIds[]`（cycle 类型用）, `label`, `description`, `metrics{fanIn,fanOut,complexity,cycleLength,...}`, `applicabilityBounds[]`, `suggestedSkillType`, `capturedAt`, `createdAt`, `updatedAt`
- **生命周期**: 由 eosCodeGraphAdapter.ingestCodeGraphSnapshot() 在摄入快照时提取并保存。
- **关联**: N:1 Project, N:1 CodeGraphSnapshot

### CodeGraphSnapshot

- **id 前缀**: 由 ingestCodeGraphSnapshot() 内部生成（`snapshot.` 前缀）
- **存储目录**: `code-graph-snapshots/`
- **关键字段**: 原始 nodes[]/edges[]/metadata，摄入时间、来源工具
- **生命周期**: 由 ingestCodeGraphSnapshot() 创建；不可变。
- **关联**: 1:N CodeGraphPattern

### BetaFeedback

- **id 前缀**: `beta_feedback.`
- **存储目录**: `beta-feedback/`
- **关键字段**: `participantId`, `stage`, `usefulness`（1-5）, `clarity`（1-5）, `wouldUseAgain`（bool）, `helped`, `blocked`, `contact`（可空）, `createdAt`, `updatedAt`
- **生命周期**: 由 submitBetaFeedback() 创建；受 IP 限流保护。
- **关联**: 无 projectId（产品级反馈，不绑定特定项目）

## ID 命名约定

所有 ID 必须匹配 `[a-zA-Z0-9._-]+`（`SAFE_ID_RE`），通常格式为 `<prefix>.<slug>.<suffix>`：

| 类型 | 前缀 | 示例 |
|---|---|---|
| Project | `project.` | `project.experience_os_0_1` |
| ConversationEvent | `event.` | `event.project_x.1784273000311` |
| WorkCheckpoint | `checkpoint.` | （由 captureWorkCheckpoint 生成） |
| EvidenceLink | `evidence.` | （由 addEvidenceLink 生成） |
| ExperienceReceipt | `receipt.` | （由 writeExperienceReceipt 生成） |
| ExperienceReceiptDraft | `receipt_draft.` | （由 proposeExperienceReceiptDraft 生成） |
| DecisionReceipt | `decision_receipt.` | （由 recordDecision 生成） |
| OutcomeRecord | `outcome.` | （由 recordOutcome 生成） |
| ExperienceAsset | `asset.` | （由 promoteExperienceAsset 生成） |
| ExperienceReuseTrial | `reuse.` | `reuse.project_x.1784339165373.a1b2c3d4` |
| Skill | `skill.` | `skill.project_x.nonlinear_transfer` |
| Artifact | `artifact.` | `artifact.project_x.skill_y.1784273000311` |
| WallHit | `wallhit.` | `wallhit.project_x.schema_missing.1784273000311` |
| Rule | `rule.` | `rule.project_x.1784273000311` |
| ThoughtFragment | `thought.` | `thought.project_x.1784273000311` |
| HumanEditLog | `edit.` | `edit.project_x.1784273000311` |
| SubgoalSegment | `subgoal.` | `subgoal.project_x.1784273000311` |
| WorkflowPattern | `workflow.` | `workflow.project_x.1784273000311` |
| PreferenceHypothesis | `pref.` | `pref.project_x.1784273000311` |
| ReflectionMemory | `reflection.` | `reflection.project_x.1784273000311` |
| MotherSkillTrajectory | `trajectory.` | `trajectory.project_x.1784273000311` |
| ReuseContext | `reuse.` | `reuse.project_x.1784273000311` |
| SelfIterationRun | `self_iteration.` | `self_iteration.project_x.1784273000311` |
| ReviewPacket | `review_packet.` | `review_packet.project_x.skill_y.1784273000311.abc123` |
| ReviewDecision | `review_decision.` | `review_decision.project_x.Skill.skill_y.approve.1784273000311.abc123` |
| MarketplaceListing | `listing.` | （由 publishSkill 生成） |
| Transaction | `transaction.` | （由 processPurchase 生成） |
| SkillRating | `rating.` | （由 submitRating 生成） |
| CodeGraphPattern | `codegraph.` | `codegraph.project_x.hub.1784273000311.abc1.0` |
| BetaFeedback | `beta_feedback.` | `beta_feedback.<uuid>` |

ID 中的 `<slug>` 部分通常通过 `utils.slug()` 生成（中文项目名通过 `utils.safeIdSlug()` 转码为 ASCII 安全形式），`<suffix>` 通常是 `Date.now()` + 随机 nonce。

## 状态枚举

### Project.state（管道状态，2.0 细粒度，面向引擎调度）

定义于 `domain.js STATES` 并由 `stateMachine.js` 约束转换：

| 状态 | 含义 |
|---|---|
| `IDLE` | 空闲，等待启动 |
| `COLLABORATING` | 协作中：人+AI 探索问题 |
| `DIVERGING` | 发散：产生多个候选方向 |
| `CANDIDATE_EXTRACTED` | 候选已提取：收敛出可验证方案 |
| `PRODUCTION_VALIDATING` | 生产验证：在真实环境中验证 |
| `WALL_HIT` | 撞墙：验证失败，可回 COLLABORATING 或继续验证 |
| `ARTIFACT_CREATED` | 产物已创建：验证通过 |
| `HUMAN_REVIEW` | 人工审查：等待人 review |
| `EXPERIENCE_EXTRACTING` | 经验抽取：从产物中抽取可复用经验 |
| `ASSET_STORED` | 资产入库：ExperienceAsset 已存入 Vault |
| `REUSE_READY` | 可复用：资产就绪，循环回 COLLABORATING |

### Project.status（生命周期状态，3.0 粗粒度，面向用户）

| 状态 | 含义 |
|---|---|
| `planning` | 项目创建，目标/约束定义中 |
| `active` | 工作进行中 |
| `paused` | 有意暂停 |
| `completed` | 验收标准达成 |
| `archived` | 不再活跃，保留供复用 |

### Skill.status

| 状态 | 含义 |
|---|---|
| `candidate` | 初始候选，未审查 |
| `candidate_retained` | 审查后保留候选（strategic Skill 特有） |
| `candidate_confirmed` | 候选已确认但未达 stable |
| `stable` | 稳定可用，可导出为 MCP Server、可发布到市场 |
| `needs_revision` | 需要修改（质量 D 级或审查驳回） |
| `rejected` | 已拒绝 |

### Skill.skillLevel

| 层级 | 含义 |
|---|---|
| `strategic` | 战略级：编排多个 functional Skill |
| `functional` | 功能级：完成一个具体任务 |
| `atomic` | 原子级：单一操作 |

### WallHit.wallType

| 类型 | 含义 |
|---|---|
| `schema_missing` | 缺少输入/输出 Schema |
| `trigger_unstable` | 触发条件不稳定 |
| `safety_unclear` | 安全性不明确 |
| `fallback_missing` | 缺少降级路径 |
| `human_confirmation_missing` | 需要人工确认但未获取 |
| `target_missing` | 审查目标不存在 |

### WallHit.severity

| 级别 | 含义 |
|---|---|
| `low` | 低影响，可继续 |
| `medium` | 中等影响，需要注意 |
| `high` | 高影响，阻塞当前路径 |
| `blocker` | 完全阻塞，必须解决 |

### WallHit.status

| 状态 | 含义 |
|---|---|
| `open` | 未解决，`humanDecisionNeeded: true` |
| `resolved` | 已标记解决，`humanDecisionNeeded: false` |

### Transaction.status

| 状态 | 含义 |
|---|---|
| `completed` | 交易完成（购买/试用成功） |
| `refunded` | 已退款 |
| `pending` | 处理中 |

### Transaction.type

| 类型 | 含义 |
|---|---|
| `purchase` | 一次性购买 |
| `subscription` | 订阅（预留） |
| `trial` | 试用（金额为 0，限 3 次） |

### ExperienceAsset.status

| 状态 | 含义 |
|---|---|
| `candidate` | 候选资产，待升级 |
| `approved` | 已批准，满足升级门槛 |
| `rejected` | 未通过升级 |

### ExperienceReceiptDraft.status

| 状态 | 含义 |
|---|---|
| `pending_review` | 待审查 |
| `accepted` | 已接受，生成正式 Receipt |
| `deferred` | 暂缓 |
| `rejected` | 已拒绝 |

### OutcomeRecord.outcome / ExperienceReceipt.outcome

| 值 | 含义 |
|---|---|
| `success` | 成功 |
| `partial` | 部分成功 |
| `failure` | 失败 |
| `unknown` | 结果未明 |

### ReviewPacket.status

| 状态 | 含义 |
|---|---|
| `pending` | 待审查 |
| `decided` | 已决策 |

### MarketplaceListing.status

| 状态 | 含义 |
|---|---|
| `active` | 上架中 |
| `unpublished` | 已下架（作者操作） |
| `suspended` | 已暂停（管理员操作） |

### PreferenceHypothesis.status

| 状态 | 含义 |
|---|---|
| `hypothesis` | 初始假设 |
| `confirmed` | 已确认 |
| `confirmed_after_revision` | 修改后确认 |
| `rejected` | 已拒绝 |

### 自治模式（AutonomyMode）

| 模式 | 风险等级 | 可执行动作 |
|---|---|---|
| `explore` | 0（只读） | 搜索、读取、观察 |
| `advise` | 1 | 产生建议，人决定 |
| `draft` | 2 | 生成待审草稿 |
| `execute` | 3 | 执行动作，人可观察和回滚；必须记录 DecisionReceipt |
| `commit` | 4 | 持久化变更，无需进一步确认；必须记录 DecisionReceipt |

### 证据类型（EvidenceLink.type）

| 类型 | 含义 |
|---|---|
| `doc` | 文档、设计说明、规格 |
| `code` | 源代码、diff、commit |
| `data` | 数据集、指标、测量 |
| `test` | 测试结果、覆盖率报告 |
| `feedback` | 用户/利益相关者反馈 |
| `reference` | 外部参考（论文、URL、书籍） |
| `observation` | 观察到的行为、日志、trace |
| `code-graph` | 代码结构图谱快照 |

### 代码图谱模式类型（CodeGraphPattern.patternType）

| 类型 | 含义 |
|---|---|
| `hub` | 高 fan-in 节点，许多模块依赖它 |
| `hotspot` | 高 fan-out + 高复杂度，脆弱耦合点 |
| `cycle` | 循环依赖链 |
| `leaf` | 叶子节点，无出边 |
| `bridge` | 连接两个不连通簇的节点 |

## 宿主观察记录

### HostObservationConsent

项目与宿主之间的独立、可撤销许可。`scope` 固定为 `metadata_only`，状态只有
`active` / `revoked`。它不同于协作正文的 CapturePermit：允许观察生命周期元数据，
不代表允许读取聊天、源码或 transcript。

`id` 只是可审计引用，不是调用秘密。每次人类重新授权都会轮换 `captureToken`；记录中仅保存
`captureTokenHash`，撤销时清空。原始凭据只保存在工作区外的私有文件中，权限为 `0600`。

### HostObservation

证明一个经许可的宿主生命周期事件实际到达 EOS。会话和 turn 标识在 Hook 进程内加盐
SHA-256 后才发送；服务端只接受白名单字段，并自行推导事件类别、结果与接收时间。
同一许可、事件、会话和 turn 的重复投递幂等，不重复增长 Vault。

该记录是平台兼容等级 L4 的唯一证据。历史 ConversationEvent 不再自动升级平台为
`observing`，避免把用户主动提交或旧数据误报成持续宿主观察。

## 关系图（ASCII）

```
Project 1────────────────────────────────────────────────────────┐
  │                                                               │
  ├──1:N── ConversationEvent ──1:1── ThoughtFragment              │
  ├──1:N── HostObservationConsent ──1:N── HostObservation          │
  │              │                                                   │
  │              └──1:1── WorkCheckpoint ──1:1── EvidenceLink       │
  │                                                               │
  ├──1:N── EvidenceLink ◄─────────────────────────────────────────┤
  │            │   (被 Receipt/Decision/Outcome 引用)                │
  │            │                                                   │
  ├──1:N── ExperienceReceiptDraft ──accept──1:1── ExperienceReceipt│
  │                                               │                │
  ├──1:N── DecisionReceipt ──1:N── OutcomeRecord  │                │
  │            │                                  │                │
  │            └────────── ExperienceAsset ───────┘                │
  │                         │                                      │
  │                         └──1:N── ExperienceReuseTrial          │
  │                                                                │
  ├──1:N── Artifact (via sourceIds → Skill/Rule/...)               │
  ├──1:N── WallHit ──1:1── ReflectionMemory                        │
  ├──1:N── Rule ──N:M── ThoughtFragment                            │
  ├──1:N── Skill ──1:0..1── MarketplaceListing ──1:N── Transaction │
  │              │                     │                           │
  │              │                     └──N:1── SkillRating        │
  │              │                                                 │
  │              ├──N:1── ReviewPacket ──1:N── ReviewDecision       │
  │              └──N:M── WorkflowPattern ──N:M── SubgoalSegment    │
  │                          │                    │                │
  │                          └── from SubgoalSegment ── HumanEditLog│
  │                                                   │            │
  ├──1:N── PreferenceHypothesis ── reviewed by ReviewPacket        │
  ├──1:N── MotherSkillTrajectory                                   │
  ├──1:N── ReuseContext ── references Rule/Skill/Reflection/...    │
  ├──1:N── SelfIterationRun ── tracks candidate Skill/Artifact/...  │
  └──1:N── CodeGraphSnapshot ──1:N── CodeGraphPattern              │
```

关键引用关系：
- 所有对象都通过 `projectId` 归属到一个 Project
- EvidenceLink 是跨对象引用的核心：Receipt、Decision、Outcome 都通过 `evidenceLinkIds[]` 引用证据
- ExperienceAsset 是经验沉淀的终点：必须同时持有 Receipt + DecisionReceipt + OutcomeRecord 的引用，且三者链闭合
- MarketplaceListing/Transaction/SkillRating 形成市场交易三角：Listing 是展示，Transaction 是流转，Rating 是质量信号
