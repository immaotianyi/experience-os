# Experience OS 3.2 Agent-Hosted 草案协议

## 目的

让用户正在使用的 Codex、TRAE 或其他 MCP Agent 成为 EOS 的草案执行者。
EOS 不读取该工具的登录态、Cookie、会话令牌或 API Key，也不调用其云端模型。Agent 用自己的当前会话完成推理后，将候选草案写入 EOS；EOS 只负责来源约束、结构校验、人工审查和后续结果验证。

## 适用条件

1. Agent 已通过当前工具的正常授权运行。
2. Agent 已在当前协作中拥有相关上下文，或用户已在该工具中主动提供上下文。
3. 需要引用的 EOS 工作节点已由人明确同意保存，并属于同一项目。
4. 客户端支持 MCP 工具调用。

这不是后台模型调用。没有活跃 Agent 会话时，EOS 不会自行向该工具索要算力；后台生成仍需要 Direct API 或本地模型。

## Agent 操作

Agent 调用 `eos_submit_receipt_draft`，提交：

```json
{
  "id": "receipt_draft.<unique>",
  "projectId": "project.<id>",
  "checkpointIds": ["checkpoint.<consented-id>"],
  "proposal": {
    "phase": "协作",
    "summary": "仅根据当前已获许可的协作上下文写出的候选总结。",
    "outcome": "unknown",
    "uncertainty": null,
    "counterexamples": [],
    "applicabilityBounds": ["适用边界"],
    "lessonsLearned": ["可复核的经验"]
  },
  "agent": {
    "provider": "codex",
    "model": "hosted-session",
    "actor": "codex-agent",
    "sourceTool": "codex"
  }
}
```

## EOS 必做的事

- 校验每个 checkpoint、事件和证据都属于 `projectId`，且事件已经同意保存；
- 对非受控 outcome、不确定性和列表字段进行降级并写入警告；
- 标记 `generatedBy.mode = agent_hosted`，记录提交工具与 Agent 身份；
- 写入 `pending_review`，绝不创建 ExperienceReceipt、Decision、Outcome 或 ExperienceAsset；
- 将“当前工具提交，无需 EOS API Key”展示给人类审查者。

## 禁止事项

- 不得读取或转存其他工具的登录态、Cookie、会话 Token 或密钥；
- 不得根据 Agent 的输出自动确认草案；
- 不得将没有明确同意保存的协作原文主动取出并发送给外部 Agent；
- 不得将 Agent 的自然语言“成功”直接记为真实结果。
