# API 参考

## API 约定

- **基础 URL**: `http://127.0.0.1:4173`（可通过 `PORT` 环境变量修改端口，`EOS_HOST` 修改绑定地址）
- **认证**: 通过 `x-eos-identity` HTTP Header 传递身份，值为 JSON：
  ```json
  {"userId":"alice","role":"owner|editor|viewer|admin","visibility":"private|team|public"}
  ```
  不带头时默认为 `{"userId":"system","role":"owner","visibility":"private"}`（单用户模式）。
- **Content-Type**: POST/PUT 请求必须为 `application/json`，否则返回 415。
- **请求体大小**: 上限 1 MiB，超出返回 413。
- **错误响应**: 统一格式 `{"error": "<message>"}`，HTTP 状态码 4xx/5xx。500 错误不泄露堆栈信息。
- **分页**: 列表端点通过 `?limit=N` 控制返回条数，上限 500（默认 24）；`?offset` 不支持，全量加载后由客户端分页。
- **限流**: 仅 `POST /api/beta-feedback` 有 IP 级限流（每小时每 IP 5 条，返回 429），其他端点无限流。
- **CORS**: 本地模式 `Access-Control-Allow-Origin: *`（因绑定 127.0.0.1）。

## 端点分组

### 健康检查

#### `GET /api/health`

返回服务健康状态。无鉴权要求。

响应：
```json
{"ok": true, "service": "experience-os", "mode": "local", "generatedAt": "2026-07-28T..."}
```

---

### 平台集成

#### `GET /api/platforms`

检测 tray/work/vault/codex/cloud 五个集成面的健康状态。

响应：`{"platforms": {"tray": {...}, "work": {...}, "vault": {...}, "codex": {...}, "cloud": {...}}}`

#### `POST /api/platforms/:name/start`

启动指定平台组件。需要认证（401 未认证）。

请求体：`{}`（启动参数因平台而异）

响应：`{"started": true|false, "message": "..."}`

#### `GET /api/platforms/:name/diagnose`

对指定平台运行诊断。

响应：`{"status": "ok|error", "healthy": true|false, "advice": [...], "result": ...}`

---

### Beta 反馈

#### `POST /api/beta-feedback`

提交 Beta 反馈。IP 限流 5 条/小时。

请求体：
```json
{"participantId": "...", "stage": "...", "usefulness": 1-5, "clarity": 1-5, "wouldUseAgain": true|false, "helped": "...", "blocked": "...", "contact": "email|null"}
```

响应：`{"ok": true, "id": "beta_feedback...."}` (201)

#### `GET /api/beta-feedback`

列出最近 100 条反馈。非 admin 用户的响应中 `contact` 字段被移除。

响应：`{"kind": "BetaFeedback", "records": [...]}`

#### `GET /api/beta-feedback/export`

导出全部反馈（含 PII）。需要 admin 角色（403 否则）。

响应：`{"exportedAt": "...", "count": N, "feedback": [...]}`

---

### 审查

#### `POST /api/review-decisions`

提交审查决策。

请求体：
```json
{"reviewPacketId": "review_packet....", "decision": "<option_id>", "rationale": "..."}
```

响应：`{"ok": true, "reviewDecision": {...}, "packet": {...}, "target": {...}}`

#### `GET /api/review-audit`

审查审计视图。

查询参数：`?limit=N`（默认 40）

响应：`{...}` 最近审查决策的审计列表

#### `GET /api/skill-review-history`

按 Skill 聚合完整审查历史。

查询参数：`?skillId=skill....`（必填）

响应：`{...}` 该 Skill 的所有审查包与决策

---

### Vault 管理

#### `POST /api/vault-archive`

执行 Vault 归档（移动旧候选到 `work/vault-archive/`，生成 manifest，不删除）。

请求体：`{"limit": 10, "reason": "..."}`（limit 1-100）

响应：`{"archived": [...], "manifestId": "..."}`

#### `GET /api/vault-maintenance`

预览归档候选（不执行）。

响应：`{"candidates": [...], "retentionPolicy": {...}}`

#### `GET /api/validation`

全库校验：扫描所有记录，返回校验结果。

响应：`{"valid": true|false, "invalidCount": N, "corruptFileCount": M, "invalid": [...], "corruptFiles": [...]}`

#### `GET /api/summary`

Vault 总览：每种 record kind 的数量、最新记录、市场统计。

响应：`{"generatedAt": "...", "counts": {...}, "latestWallHit": {...}, "marketplaceStats": {...}, ...}`

#### `GET /api/git/history`

查询单条记录的 Git 历史。

查询参数：`?recordId=...`（必填）

响应：`{"recordId": "...", "history": [...]}`

#### `GET /api/git/stats`

Git 仓库统计。

响应：`{"totalCommits": N, "fileCount": M, ...}`

---

### LLM

#### `GET /api/llm/status`

当前 LLM 适配器状态。

响应：`{"adapter": "mock|openai|deepseek|anthropic", "model": "...", "mode": "mock|live", "isLive": false, "fallbackReason": "...", "totalUsage": N, "budgetRemaining": N, "maxTotalTokens": N}`

---

### 注意力

#### `GET /api/attention`

聚合待处理事项：待审草稿、审查包、WallHit、捕获许可、LLM 状态。

响应：`{"drafts": [...], "reviewPackets": [...], "wallHits": [...], "permits": [...], "llm": {...}}`

---

### 项目（3.0 主循环）

#### `GET /api/projects`

列出所有项目。

查询参数：`?status=planning|active|paused|completed|archived`（可选过滤）

响应：`{"count": N, "records": [Project, ...]}`

#### `POST /api/projects`

创建项目。

请求体：
```json
{"id": "project....", "name": "...", "goal": "...", "constraints": [...], "acceptanceCriteria": [...], "autonomyMode": "advise"}
```

响应：Project 对象

#### `GET /api/project`

获取单个项目。

查询参数：`?id=project....`（必填）

响应：Project 对象（404 未找到）

#### `POST /api/project`

更新项目。

请求体：`{"id": "project....", "name": "...", "status": "active", "autonomyMode": "draft", ...}`

响应：更新后的 Project 对象

#### `GET /api/project/timeline`

项目时间线（按时间排序的所有关联记录：EvidenceLink、Receipt、Decision、Outcome、Checkpoint、Asset）。

查询参数：`?id=project....`（必填）

响应：`{"projectId": "...", "events": [...]}`

#### `GET /api/project/readiness`

项目升级为 ExperienceAsset 的资格检查（缺少什么条件）。

查询参数：`?id=project....`（必填）

响应：`{"ready": true|false, "requirements": [...], "missing": [...]}`

#### `GET /api/project/trial-evidence`

项目的复用试验证据。

查询参数：`?id=project....`（必填）

响应：`{...}`

---

### 捕获许可（严格许可模式）

#### `GET /api/capture-permits`

列出待审批的捕获许可。

查询参数：`?projectId=project....`（必填）

响应：`{"records": [...], "activity": [...], "strictPermitsAvailable": true|false}`

#### `POST /api/capture-permits/approve`

批准捕获许可。

请求体：`{"id": "permit....", "projectId": "project....", "approvedBy": "human"}`

响应：`{"permit": {...}, "status": "issued"}`

#### `POST /api/capture-permits/reject`

拒绝捕获许可。

请求体：`{"id": "permit....", "projectId": "project....", "rejectedBy": "human"}`

响应：`{"permit": {...}, "status": "rejected"}`

---

### 复用

#### `GET /api/reuse-suggestions`

获取已验证经验的复用建议。

查询参数：`?projectId=...&q=...`（projectId 必填，q 可选搜索词）

响应：`{"records": [ExperienceAsset, ...]}`

#### `POST /api/reuse-feedback`

提交复用反馈。

请求体：`{"trialId": "...", "feedback": "...", "outcome": "positive|negative|neutral"}`

响应：更新后的 ExperienceReuseTrial

#### `GET /api/experience-reuse-trials`

列出项目的复用试验。

查询参数：`?projectId=...`（必填）

响应：`{"records": [ExperienceReuseTrial, ...]}`

#### `POST /api/experience-reuse-trials`

开始复用试验。

请求体：`{"projectId": "...", "assetId": "...", "taskTitle": "...", "decisionNote": "..."}`

响应：ExperienceReuseTrial

#### `POST /api/experience-reuse-trials/complete`

完成复用试验并记录结果。

请求体：`{"trialId": "...", "outcome": "adopted|rejected|partial", "outcomeNote": "...", "reducedRepeatedDecision": true|false}`

响应：更新后的 ExperienceReuseTrial

---

### 证据链接

#### `GET /api/evidence`

列出项目的证据链接。

查询参数：`?projectId=...`（必填）

响应：`{"count": N, "records": [EvidenceLink, ...]}`

#### `POST /api/evidence`

添加证据链接。

请求体：
```json
{"projectId": "...", "type": "doc|code|data|test|feedback|reference|observation|code-graph", "title": "...", "source": "...", "notes": "...", "uncertainty": 0.1, "actor": "human"}
```

响应：EvidenceLink

---

### Experience Receipt（经验收据）

#### `GET /api/experience-receipt-drafts`

列出项目的 Receipt 草案（LLM 生成，待人类审查）。

查询参数：`?projectId=...`（必填）

响应：`{"count": N, "records": [ExperienceReceiptDraft, ...]}`

#### `POST /api/experience-receipt-drafts`

请求 LLM 生成 Receipt 草案。需要 LLM 为 live 模式或 `EOS_ALLOW_MOCK_DRAFTS=1`（否则返回 409）。

请求体：`{"projectId": "...", "checkpointIds": [...], "evidenceLinkIds": [...], "phase": "..."}`

响应：ExperienceReceiptDraft

#### `POST /api/experience-receipt-drafts/accept`

接受草案，转为正式 ExperienceReceipt。

请求体：`{"draftId": "...", "acceptedBy": "human"}`

响应：ExperienceReceipt

#### `POST /api/experience-receipt-drafts/reject`

拒绝草案。

请求体：`{"draftId": "...", "reason": "..."}`

响应：`{"ok": true}`

#### `POST /api/experience-receipt-drafts/defer`

暂缓草案。

请求体：`{"draftId": "...", "reason": "..."}`

响应：`{"ok": true}`

#### `POST /api/experience-receipt-drafts/resume`

恢复暂缓的草案。

请求体：`{"draftId": "..."}`

响应：`{"ok": true}`

#### `GET /api/experience-receipts`

列出项目的正式 Receipt。

查询参数：`?projectId=...`（必填）

响应：`{"count": N, "records": [ExperienceReceipt, ...]}`

#### `POST /api/experience-receipts`

手动写入 ExperienceReceipt（不经 LLM 草案）。

请求体：`{"projectId": "...", "phase": "...", "summary": "...", "evidenceLinkIds": [...], "outcome": "success|partial|failure|unknown", "lessonsLearned": [...]}`

响应：ExperienceReceipt

---

### 决策与结果

#### `POST /api/decisions`

记录自主决策（DecisionReceipt）。autonomyMode >= execute 时必须记录。

请求体：`{"projectId": "...", "action": "...", "target": "...", "rationale": "...", "evidenceLinkIds": [...], "autonomyMode": "execute", "revertible": true, "revertInstructions": "..."}`

响应：DecisionReceipt

#### `GET /api/decisions`

列出项目的决策记录。

查询参数：`?projectId=...`（必填）

响应：`{"count": N, "records": [DecisionReceipt, ...]}`

#### `POST /api/outcomes`

记录结果（OutcomeRecord），与 DecisionReceipt 配对闭环。

请求体：`{"projectId": "...", "decisionReceiptId": "...", "action": "...", "outcome": "success|partial|failure|unknown", "metrics": {...}, "notes": "...", "evidenceLinkIds": [...]}`

响应：OutcomeRecord

#### `GET /api/outcomes`

列出项目的结果记录。

查询参数：`?projectId=...`（必填）

响应：`{"count": N, "records": [OutcomeRecord, ...]}`

---

### Capture Relay（事件上报）

#### `POST /api/relay/events`

捕获一条已同意的协作事件。`consented: true` 为必填，拒绝隐式捕获。

请求体：
```json
{"projectId": "...", "actor": "human|agent_name", "content": "...", "sourceTool": "codex|cursor|manual|...", "sourceRef": "...", "consented": true, "permitId": "..."}
```

响应：ConversationEvent (+ WorkCheckpoint)

#### `GET /api/relay/events`

列出项目的协作事件。

查询参数：`?projectId=...`（必填）

响应：`{"count": N, "records": [ConversationEvent, ...]}`

---

### 工作检查点

#### `POST /api/work-checkpoints`

创建工作检查点（一条人工标记的工作边界，同时创建事件和证据）。

请求体：`{"projectId": "...", "title": "...", "notes": "...", "eventContent": "...", "evidenceType": "doc|code|..."}`

响应：WorkCheckpoint

#### `GET /api/work-checkpoints`

列出项目的检查点。

查询参数：`?projectId=...`（必填）

响应：`{"count": N, "records": [WorkCheckpoint, ...]}`

---

### 经验资产

#### `POST /api/experience-assets`

升级经验资产（promote）。需要满足资格条件（有 Receipt + 已审查 Decision + success Outcome）。

请求体：`{"projectId": "...", "receiptId": "...", "decisionReceiptId": "...", "outcomeRecordId": "...", "title": "..."}`

响应：ExperienceAsset

#### `GET /api/experience-assets`

列出项目的经验资产。

查询参数：`?projectId=...`（必填）

响应：`{"count": N, "records": [ExperienceAsset, ...]}`

---

### 技能注册

#### `GET /api/skill-registry`

搜索/浏览 Skill 注册表。

查询参数：`?q=...&level=strategic|functional|atomic&status=candidate|stable|...&sort=quality|recent|downloads&limit=50`

响应：`{"total": N, "returned": M, "categories": [...], "skills": [...]}`

#### `POST /api/skill-registry/import`

从外部导入 Skill。

请求体：`{"skillData": {...}, "projectId": "...", "source": "web-import|..."}`

响应：`{"ok": true, "skill": Skill}`

#### `GET /api/skills/metadata`

获取单个 Skill 的元数据。

查询参数：`?skillId=skill....`（必填）

响应：Skill 详情（含 review history、quality rating 等聚合信息）

---

### MCP 导出

#### `POST /api/mcp/export`

将单个 stable Skill 导出为自包含 MCP Server 目录。

请求体：`{"skillId": "skill....", "transport": "stdio|sse", "version": "1.0.0"}`

响应：`{"ok": true, "serverName": "...", "serverDir": "...", "files": N}`

#### `POST /api/mcp/export-all`

导出所有 stable Skill。

响应：`{"total": N, "exported": M, "failed": K, "results": [...]}`

#### `GET /api/mcp/list`

列出已导出的 MCP Server 目录。

响应：`{"servers": [{"name": "...", "dir": "..."}]}`

---

### 代码图谱

#### `POST /api/code-graph/ingest`

摄入代码图谱快照（外部 AST/调用图解析器产出的 nodes + edges），提取结构模式。

请求体：
```json
{"projectId": "...", "snapshot": {"nodes": [...], "edges": [...], "metadata": {...}}, "sourceTool": "...", "sourceRef": "..."}
```

响应：`{"ok": true, "snapshotId": "...", "summary": {...}, "patternCount": N, "patterns": [CodeGraphPattern, ...]}`

#### `GET /api/code-graph/patterns`

查询代码结构模式。

查询参数：`?projectId=...&patternType=hub|hotspot|cycle|leaf|bridge&limit=50`

响应：`{"count": N, "patterns": [CodeGraphPattern, ...]}`

#### `POST /api/code-graph/blast-radius`

计算变更的爆炸半径（基于给定快照和目标节点）。

请求体：`{"projectId": "...", "targetId": "...", "snapshot": {"nodes": [...], "edges": [...]}}`

响应：`{"targetId": "...", "affectedNodes": [...], "distance": N, "criticalPaths": [...]}`

---

### 撞墙解决

#### `POST /api/wallhit-resolutions`

将 WallHit 标记为已解决。

请求体：`{"wallHitId": "wallhit....", "resolvedByIds": ["human"], "rationale": "..."}`

权限：需要 canEdit（owner/editor）。

响应：`{"ok": true, "wallHit": WallHit}`

#### `GET /api/wallhit-audit`

WallHit 审计视图。

查询参数：`?limit=N`（默认 40）

响应：`{...}` 包含 WallHit 状态、关联 ReflectionMemory 与轨迹

---

### 技能市场

#### `GET /api/marketplace/search`

搜索市场 listing。

查询参数：`?query=...&license=MIT|Commercial|Team&pricingModel=free|one_time|subscription&sellerId=...&sortBy=recent|downloads|rating|revenue|price&limit=20`

响应：`{"count": N, "listings": [MarketplaceListing, ...]}`

#### `POST /api/marketplace/publish`

发布 Skill 到市场。

请求体：`{"skillId": "...", "version": "1.0.0", "pricing": {"model": "one_time", "price": 29, "currency": "CNY"}, "license": "MIT", "trialEnabled": false, "summary": "..."}`

响应：`{"ok": true, "listing": MarketplaceListing}`

#### `POST /api/marketplace/unpublish`

下架 listing。

请求体：`{"listingId": "listing...."}`，需要是 listing 的 owner。

响应：`{"ok": true, "listing": MarketplaceListing}`

#### `POST /api/marketplace/suspend`

暂停 listing（仅 admin）。

请求体：`{"listingId": "listing...."}`

响应：`{"ok": true, "listing": MarketplaceListing}`

#### `GET /api/marketplace/listing`

获取 listing 详情。

查询参数：`?listingId=listing....`

响应：MarketplaceListing 详情

#### `GET /api/marketplace/versions`

列出 Skill 的已发布版本。

查询参数：`?skillId=skill....`

响应：`{"skillId": "...", "versions": [...]}`

#### `POST /api/marketplace/download`

记录下载。

请求体：`{"listingId": "listing...."}`

响应：`{"ok": true, "downloads": N}`

#### `GET /api/marketplace/stats`

市场统计。

响应：`{"totalListings": N, "activeListings": M, "totalDownloads": K, "totalRevenue": ...}`

---

### 质量评级

#### `POST /api/quality/rate`

提交评分。

请求体：`{"skillId": "...", "userId": "...", "score": 1-5, "review": "..."}`

响应：`{"ok": true, "rating": SkillRating}`

#### `GET /api/quality/ratings`

获取 Skill 的评分汇总。

查询参数：`?skillId=skill....`

响应：`{"average": 4.2, "count": N, "distribution": {...}}`

#### `GET /api/quality/report`

获取 Skill 的质量报告。

查询参数：`?skillId=skill....`

响应：质量报告详情（404 未找到）

#### `GET /api/quality/leaderboard`

质量排行榜。

查询参数：`?limit=10`

响应：`{"leaderboard": [...]}`

#### `POST /api/quality/auto-flag`

自动标记低质量 Skill（D 级标记为 needs_revision）。

响应：`{"ok": true, "flaggedCount": N, "flagged": [...]}`

---

### 交易

#### `POST /api/transaction/purchase`

购买 Skill。完整流程：检查可购 -> 定价 -> 15% 平台抽成 -> 授权签发 -> 记录 -> 更新 listing。

请求体：`{"listingId": "...", "buyerId": "..."}`

响应：`{"ok": true, "transaction": Transaction, "licenseKey": "..."}`

#### `POST /api/transaction/trial`

开始试用（每个 listing 每 buyer 限 3 次，金额为 0）。

请求体：`{"listingId": "...", "buyerId": "..."}`

响应：`{"ok": true, "transaction": Transaction}`

#### `POST /api/transaction/refund`

退款。buyer/seller/admin 可操作（403 否则）。trial 交易不可退款。

请求体：`{"transactionId": "transaction...."}`

响应：`{"ok": true, "transaction": Transaction}`

#### `GET /api/transaction/history`

交易历史。

查询参数：`?buyerId=...&listingId=...&sellerId=...&limit=50`

响应：`{"count": N, "transactions": [...]}`（非 owner 的 licenseKey 掩码）

#### `GET /api/transaction/revenue`

卖家收入统计。

查询参数：`?sellerId=...`（必填）

响应：`{"totalRevenue": ..., "topSkills": [...], "transactionCount": N}`

#### `GET /api/transaction/verify-license`

验证买家是否持有授权。

查询参数：`?listingId=...&buyerId=...`

响应：`{"hasLicense": true|false, "licenseType": "..."}`（licenseKey 掩码）

#### `GET /api/transaction/get`

获取单笔交易。

查询参数：`?transactionId=...`（必填）

响应：Transaction（非 owner 的 licenseKey 掩码，404 未找到）

---

### 定价

#### `POST /api/pricing/validate`

校验定价配置合法性。

请求体：`{"pricing": {"model": "one_time", "price": 29, "currency": "CNY"}}`

响应：`{"valid": true|false, "issues": [...]}`

#### `GET /api/pricing/commission`

计算平台抽成（15%）。

查询参数：`?amount=100`

响应：`{"amount": 100, "commission": 15, "netToSeller": 85}`

#### `GET /api/pricing/trial`

检查买家是否可试用。

查询参数：`?listingId=...&buyerId=...`

响应：`{"eligible": true|false, "trialsUsed": N, "trialLimit": 3}`

#### `GET /api/pricing/breakdown`

获取购买明细。

查询参数：`?listingId=...&type=purchase|subscription|trial`

响应：`{"listing": {...}, "breakdown": {"subtotal": ..., "commission": ..., "total": ...}}`

#### `POST /api/pricing/verify-license`

校验授权密钥格式。

请求体：`{"licenseKey": "..."}`

响应：`{"valid": true|false}`

---

### 团队审查

#### `POST /api/team-review/assign`

分配审查人。

请求体：`{"packetId": "review_packet....", "userIds": ["alice", "bob"]}`

响应：`{"ok": true, "packet": ReviewPacket}`

#### `POST /api/team-review/vote`

投票。

请求体：`{"packetId": "...", "userId": "...", "vote": "approve|reject|abstain", "comment": "..."}`

对已 finalized 的 packet 投票返回错误。

响应：`{"ok": true, "packet": ReviewPacket, "status": "pending|confirmed"}`

#### `POST /api/team-review/discuss`

添加讨论评论。

请求体：`{"packetId": "...", "userId": "...", "message": "...", "mentions": ["@bob"]}`

响应：`{"ok": true, "discussion": [...]}`

#### `GET /api/team-review/summary`

审查摘要。

查询参数：`?packetId=...`

响应：审查摘要

#### `POST /api/team-review/finalize`

最终确认团队审查。

请求体：`{"packetId": "...", "userId": "..."}`

响应：`{"ok": true, "decision": {...}, "packet": ReviewPacket}`

---

### 通用 GET 端点

以下路径自动映射到 vault.list() 返回对应 kind 的最新记录（受 filterReadable 权限过滤）：

| 路径 | kind |
|---|---|
| `/api/projects` | Project（有专属处理，非通用） |
| `/api/reuse-contexts` | ReuseContext |
| `/api/review-packets` | ReviewPacket |
| `/api/review-decisions` | ReviewDecision |
| `/api/wallhits` | WallHit |
| `/api/skills` | Skill |
| `/api/self-iteration-runs` | SelfIterationRun |
| `/api/reflection-memories` | ReflectionMemory |
| `/api/workflow-patterns` | WorkflowPattern |
| `/api/preference-hypotheses` | PreferenceHypothesis |

通用 GET 端点支持 `?limit=N`（默认 24，上限 500），按 `updatedAt`/`createdAt` 倒序。
