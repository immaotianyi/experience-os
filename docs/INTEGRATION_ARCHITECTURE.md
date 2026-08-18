# AI 工具集成架构

## 核心原则

**兼容是一组可复核的证据状态，不是一张产品名单。**

EOS 不再因为检测到应用、配置文件或自身内部模块，就宣称“已兼容”。每个 AI 宿主必须沿同一证据阶梯推进：

| 等级 | 名称 | 必要证据 | 可以声称什么 |
|---|---|---|---|
| L0 | 未检测 | 未发现真实宿主 | 未安装或检测失败 |
| L1 | 已安装 | CLI 或应用存在 | 宿主可用，尚未连接 EOS |
| L2 | 已配置 | EOS MCP 注册存在 | 配置已准备，尚未证明宿主加载成功 |
| L3 | 可调用 | 宿主确认注册、Vault 一致、Relay 完成真实 MCP 握手 | 宿主可以调用 EOS 工具 |
| L4 | 已观测 | 先满足 L3，且当前 Vault 收到该宿主经许可的真实事件 | 当前连接至少完成一次端到端协作 |

`MCP 可调用`不等于 EOS 可以读取宿主中的全部聊天。MCP 解决工具与上下文调用；会话生命周期观测依赖宿主 Hooks、编辑器扩展或用户主动调用。任何协作正文进入 Vault 前仍必须通过 `strict_permit`。

### Vault 边界

- `work/vaults` 是 EOS 源码仓库的全局开发与治理库。
- `<workspace>/.eos/vault` 是一个真实项目的独立协作边界。
- 真实项目通过 `npm run workbench -- <workspace> [port]` 启动，工作台和宿主 MCP 必须绑定同一个项目 Vault。
- 另一个 Vault 中的配置或历史事件不能提升当前工作台的兼容等级。

## 统一数据路径

```text
Codex / Claude Code / Cursor / TRAE / VS Code
                    |
           MCP 调用或宿主 Hook
                    |
             Host Adapter
                    |
      CollaborationEnvelope（统一事件）
                    |
       Consent Gate（默认严格许可）
                    |
        EOS Relay -> 当前 Git Vault
                    |
     Receipt -> Human Review -> Outcome
                    |
          Verified Experience Asset
```

Host Adapter 只负责把宿主差异归一化，不直接决定经验是否真实、有价值或可复用。真实性由证据链和结果验证决定，价值判断保留给人类。

## 当前宿主矩阵

本表描述代码支持面；工作台中的状态以本机实时证据为准。

| 宿主 | 工具协议 | 生命周期事件 | 当前 EOS 连接策略 |
|---|---|---|---|
| Codex | MCP：stdio / Streamable HTTP | 官方 Hooks | `codex mcp add` 注册；CLI 可回读配置并确认当前 Vault |
| Claude Code | MCP | 官方 Hooks | `claude mcp add --scope project`；项目 `.mcp.json` 可检测 |
| Cursor | MCP | 官方 Hooks（已验收） | 项目 `.cursor/mcp.json` + 项目级 `.cursor/hooks.json` 扁平 Hook（sessionStart/preToolUse/postToolUse 等事件映射），与 Codex/Claude 共用 hook-plan/hook-apply 事务层 |
| TRAE | 官方确认支持 MCP | 未找到公开稳定 Hook 协议 | MCP 界面人工配置 + EOS session-log watcher 观察内部会话日志元数据（45s 静默判 SessionEnd）并发布 AgentBar 协议文件，无 Hook 也可观测 |
| VS Code | 完整 MCP 规范 | 扩展 API | 项目 `.vscode/mcp.json`；未来扩展可用 `registerMcpServerDefinitionProvider` 注册 |

TRAE 的 `.trae/mcp.json` 仅作为兼容性探测候选，不作为官方稳定接口，也不会被 EOS 自动写入。

## 当前实现

- `src/eosMcpProbe.js` 启动真实 Relay，执行 `initialize` 和 `tools/list`，并校验 EOS 必备工具。超时、非 JSON stdout、缺少工具都失败关闭。
- `src/mcpExporter.js` 把 stable Skill 导出为自包含 MCP Server（stdio/SSE），暴露 Prompt、Resource 与只读 tool `read_instructions`。
- `src/eosDependencyParser.js` 把 JS/TS 项目解析为 CodeGraph 快照，`POST /api/code-graph/parse-project` 一条链完成解析与入库。
- `src/eosPlatformAdapter.js` 检测真实宿主、MCP 注册、Vault 绑定、Relay 握手和事件回执。
- `GET /api/platforms` 返回每个宿主的 `compatibilityLevel`、`proof` 和可审查连接方案。
- `POST /api/platforms/:name/start` 名称保留用于旧客户端兼容，但不会启动应用或静默改配置，只返回 `human_configuration_required` 方案。
- `POST /api/platforms/:name/connection-plan` 生成服务端保存、十分钟有效的只读事务计划；浏览器只得到不可篡改的计划 ID 与脱敏差异。
- `POST /api/platforms/:name/connection-apply` 只接受明确批准，随后执行源哈希复核、EOS 独占锁、备份、原子写入、Relay 验证和并发安全回滚。
- `POST /api/platforms/:name/hook-plan|hook-apply` 为 Codex、Claude Code、Cursor 生成并提交项目级元数据 Hook（Codex/Claude 为嵌套 `SessionStart / SessionEnd`，Cursor 为扁平 `sessionStart/preToolUse` 等）；需要独立的许可确认与差异确认。
- Hook 配置与工作区外的 `0600` 捕获凭据组成同一事务；Vault 只保存凭据哈希，配置、预览和审计回执不保存原始凭据。
- `POST /api/platforms/:name/hook-remove-plan|hook-remove-apply` 撤销观察许可，并只删除 EOS Hook 与对应凭据。
- 自动事务目前只对已安装的 Cursor 与 VS Code 开放。Codex/Claude 保留官方 CLI 命令，TRAE 保留人工 MCP 界面，不能用不稳定路径换取“自动连接”的表面完成度。
- 工作台“AI 工具连接”页逐项显示证据，不再把 `tray/work/vault/cloud` 等 EOS 内部组件算作外部平台。

### 连接事务的不变量

1. 预览阶段绝不写宿主配置。
2. 批准请求只能引用 EOS 服务端保存的单次计划，不能提交任意路径或任意配置。
3. 应用前必须在锁内重读源文件；源哈希变化时拒绝写入并要求重新审查。
4. 只合并 `experience-os` 条目，保留宿主的其他设置与 MCP Server。
5. 验证失败时，仅当文件仍是 EOS 刚写入的版本才允许回滚；宿主或用户已并发修改时不覆盖。
6. “配置与 Relay 已验证”只产生 L2 证据。没有宿主加载回执就不能升级为 L3。

## Skill Central 融合边界

EOS 采用 Skill Central 的分层适配、先计划后写入、能力声明与降级思想，但不把它的 YAML 作为 EOS 的事实源。EOS 的事实源仍是经过证据、审查和结果验证的 Vault `Skill` 记录。

```text
Verified Experience Asset / reviewed Skill
                  |
          PortableSkill v2
      /             |              \
  SKILL.md      MCP Prompt/Resource   Skill Central YAML
```

`PortableSkill v2` 明确保存：

- `instructions`：真正可复用的操作知识，不能只有名字与触发词。
- `evidenceLinkIds`、`validationPlan`：技能为什么成立、如何再次验证。
- `appliesTo`、`activation`：项目边界与自动路由信号。
- `capabilities`、`degradation`：需要什么能力，缺失时如何诚实降级。
- `targetOverrides`：只允许覆盖指令、激活、能力和降级等白名单字段。
- `executionBinding`：可选的真实执行器绑定；没有绑定时只能导出为 instruction/prompt，不能伪造 MCP Tool。

当前编译目标：

| 目标 | 产物 | 工程语义 |
|---|---|---|
| Agent Skills | `<slug>/SKILL.md` | 面向支持 SKILL.md 的宿主，保留 EOS 来源与安全边界 |
| Generic MCP | Prompt + Resource 描述 | instruction-only；`tools/list` 必须为空，不生成假执行工具 |
| Skill Central | `skillcentral.dev/v1` YAML | 可选兼容层；仅项目身份可安全映射时生成 |

稳定状态本身不等于可分发。缺少可用指令、证据或必要能力时，注册表必须给出 `distributionBlockers`，而不是把 Skill 标为“可导出”。

## 可复用工程的选择

### 现在采用

1. **Model Context Protocol（MCP）**

   作为 EOS 与不同 AI 宿主之间的共同工具协议。当前 Relay 保持零依赖手写 stdio 实现，并由真实握手测试保证最小一致性。

2. **宿主 Hooks**

   Codex、Claude Code 当前只启用 `SessionStart / SessionEnd`，并只保存事件类型、散列会话标识和服务端时间。提示词、回复、工具输入输出、源码、cwd 与 transcript 路径在本地 Bridge 内丢弃。Cursor Hook 已完成独立验收（2026-08-16）：`.cursor/hooks.json` 扁平结构、`conversation_id/generation_id` 事件归一、`--event` 注入桥接，与 MCP 自动写入并存。

3. **OpenTelemetry GenAI 语义约定**

   用作 `CollaborationEnvelope` 的字段语义参考，便于未来跨宿主追踪。默认不记录原始 prompt、response 或密钥。

### 延后采用

1. **官方 MCP TypeScript SDK**

   它能减少协议漂移，但当前 Beta 包不携带 `node_modules`。应先完成依赖打包，再迁移 Relay，不能直接引入后让桌面包失效。

2. **Agent Client Protocol（ACP）**

   ACP 解决编辑器与编码 Agent 的会话互操作。它适合未来让 EOS 成为 Agent Client 或编辑器能力提供者，不替代当前“宿主调用 EOS sidecar”的 MCP 主路径。

3. **Microsoft MCP Gateway**

   适合团队级集中网关、策略和远程 Server 管理。当前 EOS 是本地优先单用户 Alpha，引入它会增加部署和信任边界，暂不采用。

## 不做的事情

- 不抓取其他应用的私有数据库、屏幕内容或完整聊天记录。
- 不以“安装了应用”冒充“连接成功”。
- 不以“发现配置文件”冒充“宿主已加载”。
- 不把 Relay 自测成功冒充某个宿主已调用成功。
- 不自动覆盖用户已有的 MCP 或 Hook 配置。

## 下一阶段

1. 已完成（2026-08-16）：Codex、Claude、Cursor、TRAE 四宿主均达真实 L4（Hook 回执 / mcp_only / session-log watcher 三条路径）。
2. 已完成（2026-08-16）：Cursor 从 mcp_only 升级为已验收 Hook 宿主（`.cursor/hooks.json` 扁平事件 + MCP 自动写入双通道），权限事件盲区消除。
3. 构建 VS Code 扩展，用官方 MCP Server Definition Provider 减少手工配置。
4. 已完成（2026-08-16）：TRAE 经 session-log watcher + AgentBar 协议形成可重复观测证据。
5. 建立宿主版本 × 操作系统 × MCP/Hook 的兼容性回归矩阵。

## 官方资料

- Codex MCP: <https://developers.openai.com/codex/mcp/>
- Codex Hooks: <https://learn.chatgpt.com/codex/hooks>
- Claude Code Hooks: <https://code.claude.com/docs/en/hooks>
- Claude MCP: <https://docs.anthropic.com/en/docs/mcp>
- Cursor MCP: <https://docs.cursor.com/en/tools/mcp>
- Cursor Hooks: <https://cursor.com/blog/hooks-partners>
- VS Code MCP 开发指南: <https://code.visualstudio.com/api/extension-guides/ai/mcp>
- VS Code MCP 配置: <https://code.visualstudio.com/docs/agents/reference/mcp-configuration>
- TRAE IDE（MCP 能力）: <https://www.trae.ai/ide/>
- MCP TypeScript SDK: <https://github.com/modelcontextprotocol/typescript-sdk>
- Agent Client Protocol: <https://github.com/agentclientprotocol/agent-client-protocol>
- OpenTelemetry GenAI 语义约定: <https://opentelemetry.io/docs/specs/semconv/gen-ai/>
- Microsoft MCP Gateway: <https://github.com/microsoft/mcp-gateway>
