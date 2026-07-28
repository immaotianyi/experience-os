# 架构说明

## 系统总览

Experience OS 是一个单进程 Node.js 应用，将人-AI 协作过程中的非线性输入转化为可验证、可复用的经验资产。系统分四层：

```
┌─────────────────────────────────────────────────────┐
│ 集成层                                               │
│  webServer.js (HTTP)  │  eosRelayMcp.js (MCP/stdio) │
│  eosPlatformAdapter (tray/cloud/codex 检测)          │
├─────────────────────────────────────────────────────┤
│ 引擎层                                               │
│  projectEngine · pipeline · reviewEngine ·          │
│  reuseEngine · selfIterationEngine ·                │
│  marketplace · pricingEngine · qualityRating ·      │
│  transactionLog · teamReviewEngine ·                │
│  skillRegistry · mcpExporter ·                      │
│  eosCodeGraphAdapter · capturePermitStore           │
├─────────────────────────────────────────────────────┤
│ 领域层                                               │
│  domain.js (工厂函数 + 枚举) · stateMachine.js      │
│  validate.js · executionPolicy.js · accessControl.js│
├─────────────────────────────────────────────────────┤
│ 存储层                                               │
│  GitVault → Vault → 本地 JSON 文件 + Git            │
└─────────────────────────────────────────────────────┘
```

- **存储层**：`Vault` 提供原子 JSON 文件读写；`GitVault` 在此基础上叠加自动 Git commit、历史查询、回滚、写锁和事务。
- **领域层**：`domain.js` 定义所有 record kind 的工厂函数和枚举；`stateMachine.js` 管理 Project 管道状态转换；`validate.js` 做字段校验；`executionPolicy.js` 管控 AI 自治权限；`accessControl.js` 管理多用户读写权限。
- **引擎层**：每个引擎模块负责一个业务域，通过 Vault 的 save/load/list/search 接口持久化数据，不直接操作文件系统。
- **集成层**：`webServer.js` 是 HTTP 入口（React 前端 + REST API）；`eosRelayMcp.js` 是 MCP stdio 入口（供 Codex 等工具调用）；`eosPlatformAdapter` 检测外部集成面状态。

## 核心数据流

从用户启动 Codex 会话到经验沉淀的端到端流程：

```
用户在 Codex 中与 AI 协作
        │
        ▼
eosRelayMcp.js (MCP Server)
  - Agent 调用 eos_prepare_capture_permit（预览申请）
  - 人类在工作台审批 → approveCapturePermit
  - Agent 调用 eos_capture_collaboration（consented: true）
        │
        ▼
captureCollaborationEvent() → ConversationEvent (+ WorkCheckpoint)
        │
        ▼
projectEngine.addEvidenceLink() → EvidenceLink
  - executionPolicy.assertAllowed() 校验自治权限
  - vault.save() → Git 自动 commit
        │
        ▼
[自然协作阶段] 多个 EvidenceLink + ConversationEvent 积累
        │
        ▼
proposeExperienceReceiptDraft() → ExperienceReceiptDraft (LLM 生成)
  - 需要 LLM 为 live 模式或 EOS_ALLOW_MOCK_DRAFTS=1
        │
        ▼
人类审查：acceptExperienceReceiptDraft()
        │
        ▼
writeExperienceReceipt() → ExperienceReceipt (经验收据，人类确认)
        │
        ▼
[受控生产] recordDecision() → DecisionReceipt (自主决策记录)
        │
        ▼
recordOutcome() → OutcomeRecord (结果记录)
        │
        ▼
promoteExperienceAsset() → ExperienceAsset (status: approved)
  - 条件：Receipt 有证据 + Decision 已人审 + Outcome 为 success
        │
        ▼
后续项目通过 getVerifiedExperienceSuggestions() 检索复用
  → 产出 ExperienceReuseTrial 记录复用效果
```

3.0 主闭环：`项目开始 -> 自然协作 -> Experience Receipt -> 受控生产 -> 验证 -> 结果记录 -> 有证据的复用`。

2.0 管道（pipeline.js 原型）覆盖的子流程：

```
IDLE → COLLABORATING → DIVERGING → CANDIDATE_EXTRACTED
    → PRODUCTION_VALIDATING → ARTIFACT_CREATED (验证通过)
                           → WALL_HIT → COLLABORATING (撞墙重试)
    → HUMAN_REVIEW → EXPERIENCE_EXTRACTING → ASSET_STORED → REUSE_READY
```

## 模块依赖图

```
domain.js ─────────────────────────────────────────────┐
    │                                                 │
    ▼                                                 │
validate.js ──► stateMachine.js                       │
    │             │                                   │
    │             ▼                                   │
    │       pipeline.js (原型)                        │
    │             │                                   │
    ▼             ▼                                   ▼
vault.js ──► gitVault.js ──► projectEngine.js ──► webServer.js
                  │    ──► reviewEngine.js   ──► eosRelayMcp.js
                  │    ──► reuseEngine.js
                  │    ──► selfIterationEngine.js
                  │    ──► marketplace.js ──┐
                  │    ──► pricingEngine.js │
                  │    ──► qualityRating.js ├─► webServer.js
                  │    ──► transactionLog.js│
                  │    ──► teamReviewEngine─┘
                  │    ──► skillRegistry.js
                  │    ──► mcpExporter.js
                  │    ──► capturePermitStore.js
                  │    ──► eosCodeGraphAdapter.js
                  │
                  └──► eosBootstrap.js
                  └──► eosWorkbench.js
                  └──► eosPlatformAdapter.js ──► eosCodexPreflight.js
                  └──► alphaEvidence.js
                  └──► vaultMaintenance.js
                  └──► attentionStatus.js
                  └──► betaFeedback.js

utils.js 被所有模块共享
llmAdapter.js 被 projectEngine / selfIterationEngine / webServer 使用
executionPolicy.js 被 projectEngine 使用
accessControl.js 被 webServer 使用
vaultPath.js 被 gitVault / webServer / eosRelayMcp / eosBootstrap 使用
```

依赖方向是严格的：上层依赖下层，领域层不依赖引擎层，存储层不依赖任何业务模块。`webServer.js` 和 `eosRelayMcp.js` 是唯二的组合根（composition root），负责实例化 Vault/LLM 并编排各引擎。

## 关键设计决策（ADR）

### 1. 为什么用本地 JSON 文件而非数据库

**Context**：EOS 需要持久化 28+ 种领域记录，且要求数据对用户透明、可审计、可回滚、零运维。

**Decision**：每种 record kind 对应一个子目录，每条记录对应一个 `${id}.json` 文件；不使用 SQLite/PostgreSQL 等数据库。

**Consequences**：
- 用户可直接用文件管理器/编辑器打开 `.eos/vault/` 查看和修改数据，无黑盒。
- GitVault 可在文件系统层面直接使用 Git 做版本控制，无需 ORM 或数据迁移工具。
- 写入通过 `.tmp + rename` 保证原子性；单文件损坏不影响整个集合。
- 搜索使用简单子串匹配（tokenize + scoreRecord），在单 Vault < 10k 条记录的规模下够用；未来需向量搜索时可在 search() 上层替换实现，不影响调用方。
- 不支持跨文档事务；事务由 GitVault.withTransaction() 通过备份+恢复模拟。

### 2. 为什么零 Web 框架（原生 http）

**Context**：Web 层需要承载 70+ REST API 端点和静态文件服务，目标是本地单机使用。

**Decision**：使用 Node.js 原生 `http.createServer()`，通过 `url.pathname` 字符串匹配分发路由，不引入 Express/Koa/Fastify。

**Consequences**：
- 零外部依赖，`npm install` 极快，冷启动 < 100ms。
- 攻击面最小化：没有框架级中间件链的未知漏洞。
- 路由通过 if-else 链手写，对于 70+ 端点可维护性尚可（按业务域分段注释）；端点数量膨胀到数百时需要重新评估。
- 中间件（CORS、JSON 解析、鉴权、错误兜底）在 createServer 回调中显式编排，顺序可控。

### 3. 为什么状态机用纯函数 transition()

**Context**：Project 在管道中推进状态时，需要保证状态转换的合法性和可审计性。

**Decision**：`transition(project, nextState, reason)` 是纯函数——不修改入参，返回浅拷贝的新对象；非法转换直接 throw Error。

**Consequences**：
- 调用方必须显式处理状态转换结果，不可能"偷偷"修改状态。
- 测试简单：给定输入 project 和 nextState，输出确定，无需 mock。
- 副作用（持久化、通知、引擎调度）不在 transition 内触发，由调用方（projectEngine/pipeline）在转换成功后编排。
- 非法转换不会静默失败，错误会冒泡到全局错误处理，便于发现管道逻辑 bug。

### 4. 为什么身份通过 HTTP Header 传递而非 JWT

**Context**：EOS 默认绑定 `127.0.0.1`，仅供本机访问；云端部署需前置反向代理鉴权。

**Decision**：身份通过 `x-eos-identity` 请求头传递（JSON 格式：`{"userId":"...","role":"owner|editor|viewer|admin","visibility":"private|team|public"}`），不使用 JWT/session/cookie。

**Consequences**：
- 本地单用户模式下零侵入：不带头时默认为 `system` 用户 + `owner` 角色 + `private` 可见性。
- 多用户模式或云端部署时，反向代理（Nginx/Caddy）负责鉴权并注入身份头，EOS 本身不处理密码/OAuth。
- 不做签名/验签：信任来自反向代理或本地进程的头。本地模式下 127.0.0.1 绑定已足够安全。
- 实现简单：`contextFromRequest()` 只做 JSON.parse 和字段提取，无 token 验证开销。

### 5. 为什么 Vault 不做 schema 校验

**Context**：Vault 是存储层，需要处理多种 record kind 的读写；字段合法性检查是业务关注点。

**Decision**：Vault 只做 ID 白名单校验（防止路径穿越）和 JSON 序列化/反序列化，不验证字段结构。字段校验由 `validate.js` 在引擎层完成。

**Consequences**：
- 分层职责清晰：Vault = 字节安全，validate = 形状正确，engine = 业务正确。
- 新增 record kind 时只需注册 COLLECTION_DIR 和工厂函数，不需要改 Vault 代码。
- 旧版本记录（缺失新字段）可被 Vault 正常加载，向前兼容由 validate.js 的可选字段模式处理。
- 风险：绕过引擎直接调用 vault.save() 可能写入不合法数据。代码审查和测试覆盖对此提供保障。

### 6. 为什么搜索用子串匹配而非全文索引

**Context**：需要在 Vault 中按关键字检索 Rule、Skill、ReflectionMemory 等资产，规模通常在数千条以内。

**Decision**：`Vault.search(kind, query)` 将 query 分词后对记录的字符串字段做子串匹配，按命中字段数和字段权重打分排序；不使用倒排索引或全文搜索引擎。

**Consequences**：
- 零依赖、零索引维护开销，写入性能不受搜索影响。
- 对中文内容友好（无需分词器，子串匹配天然支持 CJK）。
- 对 EOS 的数据规模（单 Vault < 10k 条记录）性能足够：list + score 在毫秒级。
- 不支持同义词、词干提取、向量语义搜索；未来需要语义检索时可在 search() 上层包装 embedding 检索，调用方接口不变。

## 跨模块不变量

1. **ID 格式白名单**：所有 `record.id` 必须匹配 `[a-zA-Z0-9._-]+`（`SAFE_ID_RE`），防止路径穿越。ID 通常以 `<kind_prefix>.<content>` 格式生成（如 `project.experience_os`、`artifact.project_x.skill_y.1784273000311`）。

2. **原子写入**：Vault.save() 先写 `.tmp` 文件再 POSIX rename，任意时刻文件要么完整要么不存在。进程崩溃不会损坏已有记录。

3. **审计链不断**：每次状态转换更新 `updatedAt` 和 `lastTransition`（from/to/reason/at）；GitVault 每次 save() 自动 commit，记录变更历史。

4. **kind 字段一致性**：每条记录的 `kind` 字段必须与 COLLECTION_DIR 的键名一致（如 `kind: "Project"` 对应 `projects/` 目录）。

5. **写操作需身份**：所有写端点必须经 `contextFromRequest()` 提取身份，并通过 `accessControl.canEdit()`/`applyOwnership()` 校验；单用户模式下默认为 system/owner。

6. **错误不泄露内部信息**：HTTP 错误响应经 `safeErrorMessage()` 过滤，500 错误只返回 "Internal server error"，不暴露堆栈/文件路径。

7. **请求体大小限制**：JSON 请求体上限 1 MiB（`MAX_BODY_BYTES`），防止内存滥用。

8. **list 容错**：单个损坏的 JSON 文件不会让 vault.list() 失败，文件被跳过并记录 warning，上层始终得到可用数组。

9. **Beta 反馈 IP 限流**：每小时每 IP 最多 5 条提交，通过滑动窗口 Map 实现，定时清理过期条目。

10. **AI 写入受策略约束**：`origin: "ai"` 的写入必须经 `executionPolicy.assertAllowed(action, autonomyMode)` 校验，advise 模式下 AI 不能自行保存证据或生成 Receipt。

## 扩展点

### 新增 record kind

1. 在 `src/domain.js` 中添加 `create<Kind>` 工厂函数，返回 `{ kind: "<Kind>", ... }` 对象。
2. 在 `src/vault.js` 的 `COLLECTION_DIR` 中注册 `Kind: "kebab-case-dir"`。
3. 如果需要字段校验，在 `src/validate.js` 中添加 `validate<Kind>(record)` 函数。
4. 如果需要通过 HTTP 暴露 list 端点，在 `src/webServer.js` 的 `kindForPath()` 中注册路径映射（自动获得 GET list 能力）；如需 POST/PUT/DELETE，添加对应的路由处理。

### 新增 API 端点

1. 在 `src/webServer.js` 的 `handleApi()` 函数中，按业务域位置添加 if-else 分支。
2. 写操作（POST/PUT）需：解析 JSON body → 调用对应引擎函数 → 处理错误 → sendJson 响应。
3. 涉及权限的操作需调用 `contextFromRequest()` 获取身份，并用 `canEdit`/`canReview`/`applyOwnership` 检查。
4. 遵循现有错误处理模式：`try { ... } catch (err) { sendJson(response, { error: err.message }, 400); }`。

### 新增引擎模块

1. 在 `src/` 下创建新文件，导入 `Vault`/`GitVault` 类型（通过参数注入，不直接实例化）。
2. 引擎函数接受 vault 实例作为第一个参数，不直接 import vault 实例（便于测试时传入 mock）。
3. 所有持久化通过 `vault.save()/load()/list()/search()` 完成，不直接操作文件系统。
4. 在 `src/webServer.js` 中导入引擎函数并添加路由。
5. 添加对应的测试文件到 `tests/`。
