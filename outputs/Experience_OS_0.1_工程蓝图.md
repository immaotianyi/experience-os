# Experience OS 0.1 工程蓝图

## 1. 工程本质

Experience OS 在代码层不是聊天应用。

它是：

```text
项目状态机
+ 结构化对象库
+ Prompt 编译器
+ Rule 引擎
+ Skill 注册表
+ 记忆与适配系统
+ 工程验证管道
+ 撞墙反馈系统
```

它要解决的问题是：

> 如何把人的非线性思想，无失真地转移成 AI 和工程系统可以执行的线性结构。

无失真不是逐字保存，而是保留思想的结构、来源、上下文、适用边界和后续用途。

## 1.1 DevForge 对我们的验证增强

参考 DevForge 的工程化训练平台设计，Experience OS 的工程化应进一步明确：

1. 采用 All-in-One / Monorepo 起步，让文档、代码、规则、CI、示例和 Vault 在同一仓库中共存。
2. 区分“物理拦截”和“知识呈现”：CI、Schema、测试负责冷酷拦截；文档、WallHit、修复指南负责耐心解释。
3. 采用漏斗式路由：从大类到子方向再到落地任务，避免用户一开始被海量能力淹没。
4. 所有失败必须结构化输出，指向对应规则、修复手册或 WallHit。
5. AI 功能必须具备 Provider 抽象、错误处理、降级提示、安全输入校验和输出过滤。

DevForge 的启发可以压成一句话：

> 用工程拦截错误，用文档解释原因，用靶场验证能力。

Experience OS 应把这句话改造成：

> 用生产通道拦截幻觉，用 WallHit 解释原因，用项目闭环验证 Skill。

## 2. 四类 LLM 约束的工程映射

| 约束类型 | 作用 | 工程形态 |
|---|---|---|
| System Instructions | 定义身份、边界、最高原则 | `system_profile` / `agent_policy` |
| Rules | 定义必须遵守的判断规则 | `Rule` 对象 / policy engine |
| Prompts | 定义具体任务的输入模板 | `PromptTemplate` / prompt compiler |
| Skills / Tools | 定义可调用能力 | `Skill` / tool registry / MCP server |

这四类约束必须结构化、版本化、可检索、可组合，而不是堆成一整段 Prompt。

## 3. 核心对象

```text
Project
ConversationEvent
ThoughtFragment
HumanEditLog
SubgoalSegment
WorkflowPattern
Artifact
Rule
PromptTemplate
Skill
PreferenceHypothesis
Review
WallHit
ReflectionMemory
MotherSkillTrajectory
Memory
AdaptationProfile
```

- `Project`：承载一次任务或产品过程；
- `ConversationEvent`：记录人和 AI 的交流片段；
- `ThoughtFragment`：从交流中提取出的思想片段；
- `HumanEditLog`：记录用户对 AI 输出的修改；
- `SubgoalSegment`：把用户行为切分为可理解的子目标；
- `WorkflowPattern`：从多个子目标中提炼稳定工作流；
- `Artifact`：固化出来的文档、代码、PRD、图表、模板；
- `Rule`：从过程里沉淀出的约束；
- `PromptTemplate`：可复用的任务提示结构；
- `Skill`：可调用的工具化能力；
- `PreferenceHypothesis`：带证据和置信度的个人偏好假设；
- `Review`：批判、审查、验证结果；
- `WallHit`：撞墙反馈；
- `ReflectionMemory`：由失败和撞墙提炼出的反思记忆；
- `MotherSkillTrajectory`：母 Skill 一次触发、路由、合并、回退的可重放轨迹；
- `Memory`：长期上下文和事实；
- `AdaptationProfile`：这个人如何工作、表达、判断。

## 3.1 研究校准后的字段要求

来自 AutoSkills、Voyager、PAHF、RUMS、Programming by Demonstration、Reflexion、SWE-agent trajectories 等研究的共同启发是：对象不能只存“结果”，还要存来源、证据、效用、轨迹和回退点。

`Skill` 应增加：

```text
skill_level: strategic | functional | atomic
source_evidence[]
quality_gate_result
last_validation_result
search_keywords[]
composable_with[]
failure_modes[]
```

`Memory` 应增加：

```text
memory_relevance_score
memory_response_utility
memory_last_success
memory_value_score
memory_used_in_task[]
```

`PreferenceHypothesis` 应包含：

```text
hypothesis
evidence[]
confidence
drift_signals[]
promotion_status
rollback_target
```

`WallHit` 应能派生：

```text
ReflectionMemory
NegativeMemory
RegressionCase
```

`MotherSkillTrajectory` 应保存：

```text
trigger_event
context_slice
mother_skill_version
routing_decision
child_skill_outputs
wall_hits
human_review
final_commit_or_rollback
```

## 4. 最小状态机

```text
IDLE
  -> COLLABORATING
  -> DIVERGING
  -> CANDIDATE_EXTRACTED
  -> PRODUCTION_VALIDATING
  -> WALL_HIT | ARTIFACT_CREATED
  -> HUMAN_REVIEW
  -> EXPERIENCE_EXTRACTING
  -> ASSET_STORED
  -> REUSE_READY
```

每个状态的职责：

- `COLLABORATING`：收集人的自然语言思想；
- `DIVERGING`：高温生成候选想法和 Skill 草案；
- `CANDIDATE_EXTRACTED`：把非线性表达提炼成结构化候选；
- `PRODUCTION_VALIDATING`：进入低温工程验证；
- `WALL_HIT`：遇到约束，显性反馈；
- `ARTIFACT_CREATED`：生成可用制品；
- `HUMAN_REVIEW`：人类确认、修改、否定；
- `EXPERIENCE_EXTRACTING`：提炼经验、规则、模板；
- `ASSET_STORED`：进入资产库；
- `REUSE_READY`：未来可自动调用。

## 5. 目录结构建议

```text
experience-os/
  .github/
    workflows/
      ci.yml                      # 物理拦截：lint/test/build/schema checks
    PULL_REQUEST_TEMPLATE.md      # 人类验收清单
  apps/
    web/                         # 前端工作台
    api/                         # 后端 API
  packages/
    core/                        # 状态机与核心领域对象
    schemas/                     # JSON Schema / Zod / Pydantic
    prompts/                     # PromptTemplate 编译与版本管理
    rules/                       # Rule engine
    skills/                      # Skill registry 与执行器
    memory/                      # Memory 与 AdaptationProfile
    review/                      # Critic / Review / WallHit
    security/                    # 权限、脱敏、安全等级
    telemetry/                   # 日志、追踪、反馈
  vaults/
    projects/
    artifacts/
    rules/
    skills/
    memory/
    adaptations/
  docs/
    product/
    architecture/
    operating-principles/
    rules/
    ci-cd-guide/
```

这套目录采用 DevForge 的“三类资产”思想，但映射到 Experience OS：

| 层 | 目录 | 性格 | 职责 |
|---|---|---|---|
| 拦截层 | `.github/`、`packages/schemas/`、`packages/security/` | 冷酷监工 | 不合规则阻断，不讲情面 |
| 法典层 | `docs/`、`outputs/` | 耐心导师 | 解释为什么失败、如何修复 |
| 生产层 | `apps/`、`packages/`、`vaults/` | 待检验系统 | 真实运行、真实验证、真实沉淀 |

这与我们的 WallHit 机制一致：拦截不是终点，拦截必须把用户导向解释和修复。

## 6. Skill 数据结构示例

```json
{
  "id": "skill.product_center_extractor",
  "name": "产品中心功能提炼",
  "skill_level": "functional",
  "origin": "derived_from_user_workflow",
  "source_evidence": ["event.product_core_001", "thought.word_wps_analogy"],
  "quality_gate_result": "candidate",
  "last_validation_result": "wall_hit_or_passed",
  "search_keywords": ["中心功能", "Word类比", "产品定义"],
  "composable_with": ["skill.prd_outline_generator", "skill.engineering_validator"],
  "failure_modes": ["over_generalization", "missing_product_boundary"],
  "trigger": {
    "intent": "define_product_core",
    "signals": ["中心功能", "轴心功能", "Word类比", "产品目的"]
  },
  "input_schema": {
    "type": "object",
    "required": ["raw_thoughts", "product_context"],
    "properties": {
      "raw_thoughts": { "type": "string" },
      "product_context": { "type": "string" }
    }
  },
  "output_schema": {
    "type": "object",
    "required": ["core_function", "supporting_functions", "non_core_functions"],
    "properties": {
      "core_function": { "type": "string" },
      "supporting_functions": { "type": "array", "items": { "type": "string" } },
      "non_core_functions": { "type": "array", "items": { "type": "string" } }
    }
  },
  "safety_level": "L1",
  "fallback": "return_markdown_analysis",
  "human_confirmation_required": true,
  "adaptation_notes": [
    "用户喜欢用 Word/WPS 类比解释产品中心功能",
    "输出必须区分中心功能与附属功能"
  ]
}
```

Skill 分层：

```text
Strategic Skill  战略级：母 Skill、调度、路由、合并
Functional Skill 功能级：PRD 生成、代码审查、产品中心提炼
Atomic Skill     原子级：lint、检索、摘要、格式转换、Schema 检查
```

母 Skill 必须是 `strategic`，且版本化、降级、回退要求最高。

## 7. WallHit 数据结构示例

```json
{
  "id": "wallhit.2026-07-16-001",
  "project_id": "project.experience_os",
  "wall_type": "schema_missing",
  "stage": "production_validation",
  "message": "当前 Skill 草案缺少稳定输入字段，无法进入工具库。",
  "blocked_by": ["input_schema", "trigger_condition"],
  "suggested_fixes": [
    "补充 raw_thoughts 字段",
    "定义触发信号",
    "增加失败降级路径"
  ],
  "human_decision_needed": true
}
```

WallHit 生成后不应结束流程，还应生成反思记忆：

```json
{
  "id": "reflection.wallhit.2026-07-17-001",
  "kind": "ReflectionMemory",
  "source_wall_hit": "wallhit.2026-07-16-001",
  "failure": "Skill 候选缺少稳定输入字段，无法进入工具库。",
  "lesson": "协作空间生成的 Skill 草案必须补齐 trigger、inputSchema、outputSchema 和 fallback 后才能进入生产通道。",
  "next_time": "先进入 candidate，不直接提交 stable。",
  "regression_case_needed": true
}
```

## 8. 一次思想进入工程的流程

用户说：

> 我觉得 Skill 应该从人的生产过程里自动长出来，而不是手动安装。

系统处理：

```text
1. 记录 ConversationEvent
2. 提取 ThoughtFragment
3. 判断属于产品哲学 / Skill 机制 / 自动化原则
4. 更新 AdaptationProfile
5. 生成候选 Rule
6. 判断是否可形成 Skill
7. 进入生产验证
8. 检查是否有稳定触发条件和输入输出
9. 若缺失，生成 WallHit 反馈
10. 若通过，生成 Skill 草案
11. 人类确认
12. 存入 Skill Vault 或 Rule Vault
```

如果输入来自用户修改行为，而不是直接表达，应先经过行为分段：

```text
HumanEditLog
  -> SubgoalSegment
  -> WorkflowPattern
  -> SkillCandidate
  -> ProductionValidation
```

这样可以避免把一次偶然修改直接固化为 Skill。

## 9. 物理拦截与知识呈现

DevForge 的核心设计可以加强我们的“撞墙反馈”：

```text
物理拦截
  Schema / CI / Test / Security / Build
        ↓
结构化错误
        ↓
知识呈现
  Rule 文档 / WallHit / 修复指南 / 示例
```

Experience OS 的生产通道必须这样设计：

- Schema 不通过：生成 `WallHit`，并指向对应 Schema；
- Skill 不完整：生成 `WallHit`，并给出缺失字段；
- 安全等级不明：阻断调用，并指向安全规则；
- 测试失败：保留失败日志，并生成修复建议；
- 部署失败：输出环境、命令、错误和下一步；
- 人类确认缺失：进入 `HUMAN_REVIEW`，不得自动继续。

示例 CI 输出应接近：

```text
::error file=docs/rules/skill-schema.md,title=Skill Schema 未通过::
Skill 缺少 inputSchema/outputSchema/fallback。请查看 WallHit 和修复指南。
```

这让工程墙壁不再只是“失败”，而是一个可学习的反馈面。

## 10. Provider 抽象与降级

AI 调用必须通过 Provider 抽象，不允许业务代码直接绑定某个模型供应商。

```text
AIProvider
  LocalProvider
  CloudProvider
  CustomProvider
```

Provider 需要统一：

- `chat(messages, options)`；
- `stream(messages, options)`；
- timeout；
- retry；
- rate limit；
- error mapping；
- fallback；
- usage telemetry。

降级策略：

```text
LocalProvider 失败或超时
  -> 明确提示用户
  -> 请求确认是否切到 CloudProvider
  -> 外发前脱敏
  -> 记录 ProviderSwitch 事件
```

重要原则：

> 降级必须告知用户，不能静默切换。

## 11. Agent 消息协议

多 Agent 不能互相直接调用内部方法，必须通过标准消息通信。

```ts
interface AgentMessage {
  from: string
  to: string
  type: "task" | "result" | "error" | "query"
  payload: unknown
  traceId: string
  timestamp: number
}
```

对应 Experience OS：

- `Builder` 生成候选；
- `Critic` 进行辩证审查；
- `Guardian` 做安全检查；
- `Executor` 做生产验证；
- `Reporter` 生成 WallHit 或 Artifact。

规则：

- Agent 之间不共享可变状态；
- 每条消息必须有 `traceId`；
- 失败必须返回 `error` 消息；
- 不允许静默吞掉异常。

## 12. 安全输入与输出过滤

所有进入模型和工具的输入必须先校验：

- 长度限制；
- API Key / token 检测；
- 邮箱、手机号、身份证等敏感信息检测；
- HTML / script 注入检测；
- 安全等级判定；
- 是否允许外发云端。

模型输出展示前必须过滤：

- HTML 转义；
- 疑似密钥脱敏；
- 高风险建议标记；
- 工具调用前再次确认；
- 代码块不得自动执行。

安全原则：

> AI 是工具，不是权威；模型建议必须经过人类审查后才能进入生产。

## 13. 母 Skill 防火墙

母 Skill 是经验路由核心，不能依赖模型自觉遵守流程。它必须站在工程防火墙后面。

完整执行链路：

```text
Event
  -> Trigger Firewall
  -> Context Builder
  -> Content Firewall
  -> Mother Skill
  -> Output Schema Firewall
  -> Policy Firewall
  -> Route to Child Skills
  -> Child Skill Result
  -> Merge Firewall
  -> Change Proposal
  -> Dry Run / CI / Simulation
  -> Human Review if needed
  -> Version Commit
  -> Audit Log
```

各防火墙职责：

| 防火墙 | 保证什么 |
|---|---|
| Trigger Firewall | 母 Skill 只在正确事件和证据条件下触发 |
| Content Firewall | 只给母 Skill 相关、脱敏、带证据的上下文 |
| Output Schema Firewall | 母 Skill 输出必须符合固定 Schema |
| Policy Firewall | 内部/外部分流必须符合可测试规则 |
| Permission Guard | 高风险迭代必须人工确认 |
| Merge Firewall | 子 Skill 反馈合并前必须去冲突、去污染 |
| Audit Logger | 每次触发、分流、合并、拒绝都可追踪 |

母 Skill 的权限边界：

```text
允许：
- 判断是否触发
- 分类经验
- 分流内部/外部子 Skill
- 生成更新提案
- 合并反馈提案

禁止：
- 直接修改稳定 Skill
- 直接改 DevForge
- 直接写入长期规则
- 绕过人类确认
- 绕过生产验证
```

母 Skill 是调度者，不是皇帝。

每次母 Skill 运行都必须保存 `MotherSkillTrajectory`，用于回放和审计。

最小轨迹：

```json
{
  "id": "trajectory.mother.001",
  "trigger_event": "event_001",
  "context_slice": ["event_001", "edit_002"],
  "mother_skill_version": "0.1.0-stable",
  "routing_decision": "both",
  "child_skill_outputs": ["internal_result_001", "external_result_001"],
  "wall_hits": ["wallhit_001"],
  "human_review": "pending",
  "final_commit_or_rollback": null
}
```

## 14. 母 Skill 降级策略

母 Skill 是单点路由核心，因此必须能降级。

降级等级：

```text
L0 正常模式：母 Skill 自动判断、分流、合并反馈
L1 保守模式：只观察和记录，不自动分流
L2 规则模式：不用 LLM，只用固定 policy 路由
L3 手动模式：生成候选，由人选择 internal / external / both
L4 停机保护：禁止迭代，只允许读取历史版本和回滚
```

触发降级的条件：

- 母 Skill 输出不符合 Schema；
- 母 Skill 置信度过低；
- 母 Skill 连续路由错误；
- 母 Skill 自我迭代提案失败；
- 母 Skill 触发过于频繁或过少；
- 子 Skill 反馈冲突；
- 外部 DevForge 验证不可用；
- 安全等级不明；
- Audit Log 写入失败。

最坏情况下，母 Skill 必须能退回规则模式，而不是退回“让模型随便判断”：

```text
contains("代码" | "架构" | "部署" | "CI" | "测试") -> external
contains("偏好" | "写作" | "语气" | "表达") -> internal
contains("安全" | "隐私" | "权限") -> human_review / guardian
```

## 15. 母 Skill Git 版本库

母 Skill 必须像核心基础设施一样留存在 Git 中。

建议结构：

```text
mother-skill/
  README.md
  policy/
    trigger-policy.json
    routing-policy.json
    permission-policy.json
  prompts/
    system.md
    router.prompt.md
    merge.prompt.md
  schemas/
    mother-skill-input.schema.json
    mother-skill-output.schema.json
    change-proposal.schema.json
  rules/
    routing-rules.md
    iteration-rules.md
    degradation-rules.md
    rollback-rules.md
  evals/
    trigger-cases.json
    routing-cases.json
    degradation-cases.json
    regression-cases.json
  versions/
    v0.1.0.md
    v0.1.1.md
  audit/
    changelog.md
```

每次母 Skill 迭代必须产生 commit，并跑：

```text
schema check
routing eval
trigger eval
degradation eval
regression cases
```

禁止：

- 母 Skill 直接在线自改；
- 母 Skill 直接覆盖旧版本；
- 母 Skill 无日志更新 prompt；
- 母 Skill 无测试更新路由规则。

## 16. 回退策略

母 Skill 每次迭代都必须带着回家的路。

版本状态：

```text
draft       草案
candidate   候选
stable      稳定
deprecated  废弃
rolled_back 已回退
```

只有 `stable` 可以作为默认生产版本。

每次更新前必须保存快照：

```json
{
  "version": "0.1.1",
  "parent_version": "0.1.0",
  "changed_files": [
    "policy/routing-policy.json",
    "prompts/router.prompt.md",
    "schemas/mother-output.schema.json"
  ],
  "reason": "增加 DevForge 外部验证路由",
  "evidence": ["wallhit_001", "human_review_003"],
  "risk_level": "L2",
  "rollback_target": "0.1.0"
}
```

回退触发条件：

- 新版本触发率异常升高或降低；
- 路由错误率上升；
- Schema 失败率上升；
- WallHit 数量异常增加；
- 人工拒绝率上升；
- DevForge 验证失败率上升；
- 内部子 Skill 被污染；
- 外部子 Skill 生成无效提案；
- 安全等级误判；
- 用户显式说“这个方向不对”。

回退流程：

```text
异常检测
  -> Freeze 当前版本
  -> 降级到 stable 版本或规则模式
  -> 生成 RollbackProposal
  -> 对比版本 diff
  -> 跑回归测试
  -> 人类确认
  -> git revert / checkout stable tag
  -> 生成 rollback audit log
  -> 失败经验沉淀
```

回退不是删除。失败版本要进入 Negative Memory：

```json
{
  "failed_version": "0.1.1",
  "failure_type": "over_triggering",
  "cause": "把单次用户偏好误判为长期规则",
  "lesson": "触发规则必须要求至少 3 次证据或人工确认",
  "avoid_in_future": true
}
```

发布策略：

```text
shadow mode：新版只观察，不影响真实路由
dry run：新版给出建议，但不执行
canary：只对低风险项目启用
partial rollout：只启用某一类触发规则
stable rollout：通过评估后设为默认
```

## 17. 0.1 开发优先级

第一步不要做复杂 UI，先实现骨架：

1. `Project` 对象；
2. `ConversationEvent` 记录；
3. `ThoughtFragment` 提取；
4. `Rule / Skill / Artifact` Schema；
5. 状态机；
6. WallHit 撞墙反馈；
7. Vault 存储；
8. 简单复用检索。

这 8 个东西跑通，Experience OS 的工程骨架就成立。

DevForge 校准后，0.1 还应补上 4 个工程化检查：

9. CI 脚本：至少运行 demo、validate、schema check；
10. Rule 文档：每个 WallHit 类型对应一条修复说明；
11. Trace ID：每次项目运行生成可追踪链路；
12. Provider 抽象：即使暂时不用云端，也先留出接口边界。
13. 母 Skill 防火墙：Trigger / Content / Schema / Policy / Merge；
14. 母 Skill Git 版本库：policy、prompt、schema、eval、audit 全部版本化；
15. 回退策略：snapshot、rollback proposal、stable tag、negative memory。
16. Skill 分层：strategic / functional / atomic；
17. PreferenceHypothesis：偏好先作为假设，不直接固化；
18. MotherSkillTrajectory：母 Skill 路由必须可回放；
19. ReflectionMemory：WallHit 必须沉淀为反思记忆；
20. Memory utility：记忆要记录对任务结果的实际贡献。
