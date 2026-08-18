# API 参考

## API 约定

- **基础 URL**: `http://127.0.0.1:4173`（可通过 `PORT` 环境变量修改端口，`EOS_HOST` 修改绑定地址）
- **认证**: 非本地部署由可信反向代理通过 `x-eos-identity` HTTP Header 传递身份，值为 JSON：
  ```json
  {"userId":"alice","role":"owner|editor|viewer|admin","visibility":"private|team|public"}
  ```
  `x-user-id` / `x-user-role` / `x-user-visibility` 仅用于旧客户端迁移。身份头格式错误会返回 400，不会降级成无约束身份。
  本地模式默认只绑定回环地址，并把无身份请求视为可信单用户操作；非本地高风险操作要求 admin。
  首次启动的手机/邮箱验证码使用 `HttpOnly; SameSite=Strict` 会话 cookie；它不会替代本地回环信任边界。未配置生产身份提供方时，EOS 会失败关闭验证码发送，但仍允许“仅本地使用”。
- **Content-Type**: POST/PUT 请求必须为 `application/json`，否则返回 415。
- **请求体大小**: 上限 1 MiB，超出返回 413。
- **错误响应**: 统一格式 `{"error": "<message>"}`，HTTP 状态码 4xx/5xx。500 错误不泄露堆栈信息。
- **分页**: 列表端点通过 `?limit=N` 控制返回条数，上限 500（默认 24）；`?offset` 不支持，全量加载后由客户端分页。
- **限流**: `POST /api/beta-feedback` 有 IP 级限流（每小时每 IP 5 条）；验证码对每个身份执行 60 秒冷却、10 分钟最多 3 次、最多 5 次校验失败。
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

### 首次启动与身份

#### `GET /api/auth/status`

返回身份能力、是否允许本地跳过、生产 provider 状态与当前会话。`productionReady=false` 时不得把本机开发验证码描述为真实账号。

#### `POST /api/auth/request-code`

请求中国大陆手机号或邮箱验证码。

请求体：`{"channel":"phone|email","identifier":"13800138000|name@example.com"}`。

仅当已配置真实 provider，或本地显式设置 `EOS_AUTH_DEV_OTP=1` 时可用。开发模式响应包含 `devCode`，生产响应不得包含原始验证码。

#### `POST /api/auth/verify-code`

请求体：`{"channel":"phone|email","identifier":"...","code":"123456"}`。

成功后写入 `eos_session` HttpOnly cookie，响应只返回掩码身份和会话元数据，不返回 token。

#### `POST /api/auth/logout`

注销当前验证码会话并清除 cookie。本地 Vault 仍可继续使用。

#### `POST /api/onboarding/scan-hosts`

请求体：`{"consent":true}`。检测五类宿主的安装、版本和 EOS 连接证据，不读取项目、聊天或源码正文。

#### `POST /api/onboarding/discover-projects`

请求体：`{"consent":true,"hosts":["codex","claude"]}`。仅从所选宿主的结构化元数据中读取项目路径，并检查有限的工程标记。

#### `POST /api/onboarding/inspect-manual`

请求体：`{"consent":true,"path":"/absolute/project/path"}`。检查一个用户主动提供的绝对路径；拒绝磁盘根、主目录、桌面和文档目录。

#### `GET /api/workspaces`

列出 `~/.experience-os/workspaces.json` 中的本机工作区，并重新验证每个 `.eos` 工作台是否可用。

#### `POST /api/workspaces/connect`

请求体：

```json
{
  "consent": true,
  "confirmWrites": true,
  "projects": [{"path": "/absolute/project", "sourceHosts": ["codex"]}]
}
```

最多 30 个项目，服务端严格串行处理。已有 `.eos/` 只注册，未初始化项目才执行 Bootstrap。部分失败返回 207，并分别列出 `connected` 与 `failed`。

---

### AI 宿主集成

#### `GET /api/platforms`

检测 Codex、Claude Code、Cursor、TRAE、VS Code 五个真实 AI 宿主的连接证据。

每个宿主包含：

- `status`: `not_installed|available|configured|callable|observing|error`
- `compatibilityLevel`: `0..4`
- `proof`: `hostInstalled/mcpRegistered/relayConformant/hostConfirmed/vaultBound/eventObserved`
- `details`: 版本、配置位置、当前 Vault 与 Relay 握手结果

响应：`{"platforms": {"codex": {...}, "claude": {...}, "cursor": {...}, "trae": {...}, "vscode": {...}}, "relay": {...}, "summary": {...}}`

#### `POST /api/platforms/:name/start`

生成指定宿主的人工审查连接方案。为兼容旧客户端保留 `/start` 路径，但不会启动应用，也不会静默修改外部配置。本地回环模式允许 Vault 所有者使用；非本地部署需要 admin。

请求体：`{}`（启动参数因平台而异）

响应：`{"started": false, "action": "human_configuration_required", "message": "...", "command|config": ..., "configPath": "..."}`

#### `GET /api/platforms/:name/diagnose`

对指定平台运行诊断。

响应：`{"status": "<evidence-status>", "healthy": true|false, "advice": [...], "result": ...}`。只有 L3 及以上 `healthy=true`。

---

### Beta 反馈

#### `POST /api/beta-feedback`

提交 Beta 反馈。IP 限流 5 条/小时。

请求体：
```json
{"consent": true, "participantId": "...", "stage": "first_impression|after_trying|blocked", "usefulness": 1-5, "clarity": 1-5, "wouldUseAgain": "yes|no|unsure", "helped": "...", "blocked": "...", "contactConsent": false, "contact": ""}
```

响应：`{"ok": true, "id": "beta_feedback....", "participantId": "...", "storageScope": "local|service", "canExport": true|false}` (201)

#### `GET /api/beta-feedback`

本地模式列出当前 Vault 最近 100 条反馈。远端普通参与者不能枚举其他测试者的反馈，只有 admin 可以读取。

响应：`{"kind": "BetaFeedback", "records": [...], "canExport": true|false, "storageScope": "local|service"}`

#### `GET /api/beta-feedback/export`

下载全部反馈。回环本地模式允许 Vault 所有者导出；非本地部署需要 admin 角色（403 否则）。

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

聚合全局灯态、逐 Agent 近期活动、待审草稿、审查包、WallHit、捕获许可和 LLM 状态。Agent 只有在当前 Vault 达到 L3 可调用且存在时间有效的元数据事件时，才可能显示为 `working`、`waiting_permission`、`completed` 或 `blocked`。

响应核心字段：

```json
{
  "overall": { "state": "idle|working|waiting_permission|waiting_review|completed|blocked", "label": "...", "detail": "..." },
  "agents": [{ "id": "codex", "label": "Codex", "state": "disconnected", "stateLabel": "待验收", "evidenceLevel": 2, "lastEvent": null }],
  "agentSummary": { "installed": 4, "working": 0, "waitingPermission": 0, "completed": 0, "blocked": 0, "callable": 0, "observing": 0 },
  "signals": [],
  "actions": []
}
```

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

### 宿主元数据观察

#### `POST /api/host-observation-consents`

为一个项目和宿主建立可撤销的元数据观察许可。本地 owner 操作，且
`metadataOnlyAcknowledged` 必须显式为 `true`。

请求体：`{"projectId":"project.x","host":"codex|claude","approvedBy":"human","metadataOnlyAcknowledged":true}`

响应包含许可记录和本次授权新生成的 `captureToken`。Vault 只保存其 SHA-256；原值只用于随后建立 Hook 计划，不应记录或复用到其他项目。

#### `POST /api/platforms/:host/hook-plan`

基于有效许可生成项目级 Hook 合并片段。该端点只预览、不写宿主配置；Codex 与 Claude Code
当前仅启用 `SessionStart` / `SessionEnd`；Cursor 等未验收契约返回失败关闭状态。

请求体：`{"consentId":"host_consent...","captureToken":"host_capture..."}`

#### `POST /api/platforms/:host/hook-apply`

对服务端保存的单次计划执行二次确认。事务会锁定并复核宿主配置与私有凭据，只合并 EOS Hook，原子写入并验证；失败时在无外部并发修改的前提下同时回滚。

请求体：`{"planId":"host-hook-plan...","approved":true,"confirmedScope":"metadata_only_session_lifecycle"}`

#### `POST /api/platforms/:host/hook-remove-plan` / `hook-remove-apply`

先预览，再经相同范围的二次确认撤销许可，并只移除 EOS Hook 与工作区外私有凭据。其他宿主设置与 Hook 保持不变。

#### `POST /api/host-observations`

供本机 Hook Bridge 提交已归一化的白名单元数据。`consentId` 是可审计引用，独立的
`captureToken` 才是本地调用凭据；服务端按 Vault 中的哈希做常量时间校验。
原始提示词、回复、工具参数、源码、cwd 和 transcript 路径不允许进入该记录。

#### `GET /api/host-observation-consents` / `GET /api/host-observations`

按 `projectId` 查询许可或观察证据；观察列表可附加 `host` 与 `limit`。

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
