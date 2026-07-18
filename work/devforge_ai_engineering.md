# DevForge AI 工程化规范

> **版本** v1.0.0 · **更新日期** 2026-07-15 · **状态** 正式发布

本文档定义 DevForge 中 AI 相关功能的工程规范，覆盖端侧 AI 助手、多 Agent 编排、API 封装与安全约束。

---

## 目录

1. [范围](#1-范围)
2. [端侧 AI 助手架构](#2-端侧-ai-助手架构)
3. [多 Agent 编排](#3-多-agent-编排)
4. [API 封装规范](#4-api-封装规范)
5. [安全约束](#5-安全约束)

---

## 1. 范围

DevForge 的 AI 工程化能力聚焦于两个方向：

- **端侧 AI (On-Device AI)**：在用户设备（桌面 / 移动端）本地运行大模型，不依赖云端 API，保护隐私、离线可用。
- **多 Agent 架构 (Multi-Agent)**：多个职责单一的 Agent 协作完成复杂任务，通过标准协议通信，支持工具调用 (Tool Calling)。

本文档不涉及模型训练或微调，只关注**推理部署**和**工程封装**层面的规范。

---

## 2. 端侧 AI 助手架构

端侧 AI 助手的目标是：在用户设备上运行本地大模型，提供代码补全、规范检查、靶场提示等能力，全程不离开浏览器。

### 2.1 本地模型加载

模型文件通过浏览器 Cache API 或 IndexedDB 持久化，首次加载后离线可用。

```
┌──────────────────────────────────────────────┐
│                  浏览器环境                    │
│                                              │
│  ┌────────────┐    ┌──────────────────────┐  │
│  │ IndexedDB  │───▶│  模型文件缓存         │  │
│  │ (持久存储)  │    │  (.bin / .safetensors)│  │
│  └────────────┘    └──────────┬───────────┘  │
│                               │ 加载到内存    │
│                    ┌──────────▼───────────┐  │
│                    │  WASM / WebGPU 推理   │  │
│                    │  运行时               │  │
│                    └──────────┬───────────┘  │
│                               │              │
│                    ┌──────────▼───────────┐  │
│                    │  AI 助手服务          │  │
│                    │  (流式输出 / 缓存)    │  │
│                    └──────────────────────┘  │
└──────────────────────────────────────────────┘
```

**加载规范：**

| 规范 | 要求 | 原因 |
|------|------|------|
| 模型来源 | 必须来自可信 CDN 或本地打包 | 防止模型文件被篡改 |
| 加载进度 | 必须显示加载进度条 | 模型文件较大（数百 MB），用户需要反馈 |
| 离线缓存 | 首次加载后必须可离线使用 | 端侧 AI 的核心价值是离线可用 |
| 版本管理 | 模型版本号必须记录 | 便于排查推理结果差异 |

```javascript
// 模型加载示例
async function loadModel(modelId) {
  const cache = await caches.open('ai-models')
  const cached = await cache.match(`/models/\${modelId}`)
  if (cached) {
    return await instantiateModel(cached)
  }
  // 首次加载，显示进度
  const response = await fetch(`/models/\${modelId}`, { progress: true })
  await cache.put(`/models/\${modelId}`, response.clone())
  return await instantiateModel(response)
}
```

### 2.2 推理优化

端侧设备的算力和内存有限，推理必须做优化。

| 优化手段 | 说明 | 适用场景 |
|----------|------|----------|
| 量化 (Quantization) | 将模型权重从 FP32 降至 INT8 / INT4 | 内存受限设备 |
| KV Cache | 缓存已计算的注意力键值对 | 流式生成 |
| 批处理 (Batching) | 合并多个短请求为一次推理 | 高并发场景 |
| 懒加载层 (Lazy Layers) | 按需加载 Transformer 层 | 大模型分段加载 |

**推理规范：**

- 推理过程必须在 Web Worker 中运行，不阻塞主线程 UI。
- 推理超时默认 30 秒，超时后中止并提示用户。
- 流式输出优先，让用户尽快看到部分结果。

### 2.3 内存管理

浏览器内存有限（通常 2-4 GB 可用），大模型容易触发 OOM。

```javascript
// 内存管理示例
class AIModelSession {
  constructor() {
    this.session = null
    this.memoryUsage = 0
  }

  async init() {
    this.session = await loadModel('default')
    this.memoryUsage = estimateMemory(this.session)
  }

  // 主动释放内存
  dispose() {
    if (this.session) {
      this.session.dispose?.()
      this.session = null
      this.memoryUsage = 0
    }
  }
}
```

**内存规范：**

- 模型不使用时必须 `dispose()`，不能依赖 GC。
- 单个标签页最多加载一个模型实例。
- 监听 `visibilitychange` 事件，页面不可见时释放推理资源。

---

## 3. 多 Agent 编排

复杂任务（如「审查一段代码并给出修复建议」）由多个职责单一的 Agent 协作完成。

### 3.1 Agent 角色

| Agent | 职责 | 输入 | 输出 |
|-------|------|------|------|
| Analyst | 分析用户意图，拆解任务 | 用户原始输入 | 任务计划 |
| Coder | 生成 / 修改代码 | 任务计划 + 代码上下文 | 代码变更 |
| Reviewer | 审查代码变更是否符合规范 | 代码变更 + RULES.md | 审查意见 |
| Executor | 执行代码（沙箱内） | 代码变更 | 运行结果 |
| Reporter | 汇总结果，生成报告 | 各 Agent 输出 | 最终报告 |

### 3.2 通信协议

Agent 之间通过标准消息格式通信，不直接调用彼此内部方法：

```typescript
// Agent 间通信消息格式
interface AgentMessage {
  from: string        // 发送方 Agent ID
  to: string          // 接收方 Agent ID
  type: string        // 消息类型：'task' | 'result' | 'error' | 'query'
  payload: unknown    // 消息内容
  traceId: string     // 链路追踪 ID，贯穿整个任务
  timestamp: number   // 发送时间戳
}
```

**通信规范：**

- Agent 之间只通过消息通信，不共享可变状态。
- 每条消息必须携带 `traceId`，用于全链路追踪。
- 消息处理失败时，必须返回 `type: 'error'` 消息，不能静默吞掉。

### 3.3 工具调用 (Tool Calling)

Agent 可以调用外部工具（如代码搜索、lint 检查、文件读取）来增强能力。

```javascript
// 工具注册示例
const TOOLS = {
  search_codebase: {
    description: '在代码库中搜索指定模式',
    parameters: { pattern: 'string', scope: 'string' },
    execute: async ({ pattern, scope }) => {
      // 执行搜索逻辑
      return { matches: [] }
    },
  },
  run_lint: {
    description: '对指定文件运行 ESLint',
    parameters: { filePath: 'string' },
    execute: async ({ filePath }) => {
      // 执行 lint 逻辑
      return { errors: [], warnings: [] }
    },
  },
}

// Agent 调用工具时，必须经过用户确认
async function callTool(toolName, params) {
  const confirmed = await requestUserConfirmation(toolName, params)
  if (!confirmed) throw new Error('用户拒绝工具调用')
  return TOOLS[toolName].execute(params)
}
```

**工具调用规范：**

- 所有工具调用必须经过用户确认（除非标记为 `safe: true`）。
- 工具的输入参数必须经过校验，拒绝非法输入。
- 工具执行超时默认 10 秒。

---

## 4. API 封装规范

当端侧算力不足时，DevForge 支持回退到云端 API。API 封装层必须遵循以下规范。

### 4.1 OpenAI 兼容接口

所有 API 封装必须兼容 OpenAI Chat Completions 接口格式，确保 provider 可切换：

```javascript
// 标准请求格式（OpenAI 兼容）
const request = {
  model: 'devforge-default',
  messages: [
    { role: 'system', content: '你是 DevForge 的代码助手' },
    { role: 'user', content: '检查这段代码是否有问题' },
  ],
  temperature: 0.3,
  stream: true,
}

// 统一调用入口
const response = await aiClient.chat.completions.create(request)
```

### 4.2 Provider 抽象

通过 Provider 抽象层隔离不同 API 供应商的实现差异：

```javascript
// Provider 接口定义
class AIProvider {
  constructor(config) {
    this.name = config.name        // 'openai' | 'anthropic' | 'local'
    this.baseURL = config.baseURL
    this.apiKey = config.apiKey    // 从安全存储读取，不硬编码
  }

  async chat(messages, options = {}) {
    throw new Error('子类必须实现 chat 方法')
  }

  async *stream(messages, options = {}) {
    throw new Error('子类必须实现 stream 方法')
  }
}
```

| Provider | 场景 | 特点 |
|----------|------|------|
| `LocalProvider` | 端侧推理 | 零延迟、离线可用、隐私安全 |
| `OpenAIProvider` | 云端回退 | 模型能力强、需联网、按量计费 |
| `CustomProvider` | 自建服务 | 可定制、需自行维护 |

**Provider 切换规范：**

- 默认使用 `LocalProvider`，端侧推理。
- 端侧模型加载失败或超时时，自动降级到云端 Provider。
- 降级必须告知用户（Toast 提示），不能静默切换。

### 4.3 错误处理

API 调用必须处理以下错误类型：

| 错误类型 | 表现 | 处理方式 |
|----------|------|----------|
| 网络错误 | `fetch` 抛出 TypeError | 重试 1 次，失败后提示用户检查网络 |
| 认证失败 | HTTP 401 | 提示用户检查 API Key，不清除本地缓存 |
| 速率限制 | HTTP 429 | 指数退避重试，最多 3 次 |
| 模型超载 | HTTP 503 | 提示用户稍后重试 |
| 推理超时 | 超过 30 秒无响应 | 中止请求，提示用户简化输入 |

```javascript
// 统一错误处理
async function safeChat(provider, messages, options) {
  try {
    return await provider.chat(messages, options)
  } catch (error) {
    if (error.status === 401) {
      throw new AIError('AUTH_FAILED', 'API Key 无效，请检查配置')
    }
    if (error.status === 429) {
      throw new AIError('RATE_LIMITED', '请求过于频繁，请稍后重试')
    }
    if (error.name === 'TimeoutError') {
      throw new AIError('TIMEOUT', '推理超时，请简化输入后重试')
    }
    throw new AIError('UNKNOWN', error.message)
  }
}
```

---

## 5. 安全约束

AI 功能涉及模型推理和外部 API 调用，安全是底线。

### 5.1 API Key 管理

| 约束 | 要求 | 原因 |
|------|------|------|
| 禁止硬编码 | API Key 不得出现在任何源码文件中 | 防止泄露到 Git 历史 |
| 本地存储 | API Key 仅存储在 `localStorage`，不上传服务端 | 用户自主控制 |
| 环境隔离 | 开发环境的 Key 不得用于生产 | 防止额度消耗 |
| 定期轮换 | 文档中提示用户定期更换 Key | 降低泄露风险 |

```javascript
// 正确：从 localStorage 读取
function getApiKey() {
  return localStorage.getItem('ai_api_key')
}

// 错误：硬编码在代码中
const API_KEY = 'sk-xxxxxxxx'  // 绝对禁止
```

### 5.2 速率限制

| 限制维度 | 阈值 | 超限行为 |
|----------|------|----------|
| 单用户每分钟 | 20 次请求 | 返回 429，提示稍后重试 |
| 单次会话 | 100 次请求 | 提示用户开启新会话 |
| 单次推理输入 | 8192 tokens | 截断输入并提示 |

### 5.3 输入校验

所有用户输入在送入模型前必须经过校验：

```javascript
function validateInput(input) {
  // 1. 长度限制
  if (input.length > 32000) {
    throw new Error('输入过长，请控制在 32000 字符以内')
  }

  // 2. 敏感信息检测
  const sensitivePatterns = [
    /sk-[a-zA-Z0-9]{20,}/,    // API Key
    /\\b\\d{16,}\\b/,             // 信用卡号
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/, // 邮箱
  ]
  for (const pattern of sensitivePatterns) {
    if (pattern.test(input)) {
      throw new Error('输入包含敏感信息，请移除后重试')
    }
  }

  // 3. 注入防护
  if (input.includes('<script') || input.includes('javascript:')) {
    throw new Error('输入包含潜在的注入代码')
  }

  return input
}
```

### 5.4 输出过滤

模型输出在展示给用户前必须经过过滤：

- **XSS 防护**：模型输出的 HTML 内容必须经过转义，不允许直接 `dangerouslySetInnerHTML`。
- **敏感信息脱敏**：如果输出中包含疑似密钥、 token 的字符串，自动替换为 `***`。
- **内容审查**：对模型输出做基本的安全分类，拦截有害内容。

---

> AI 是工具，不是权威。模型给出的建议必须经过人工审查后才能采纳，尤其是涉及代码变更时。
