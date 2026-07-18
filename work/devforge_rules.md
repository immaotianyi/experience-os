# DevForge 代码规范法典

> **版本** v1.0.0 · **更新日期** 2026-07-15 · **状态** 正式发布

CI 拦截的每一条规则都在这里。每条规则附有正/误代码对照，请逐条阅读。

---

## 目录

1. [为什么需要规范](#1-为什么需要规范)
2. [ESLint 规则逐条解释](#2-eslint-规则逐条解释)
3. [提交规范](#3-提交规范)
4. [命名规范](#4-命名规范)
5. [目录规范](#5-目录规范)
6. [文档规范](#6-文档规范)

---

## 1. 为什么需要规范

这些规范不是「建议」，不是「最佳实践参考」，而是**被 CI 物理拦截的强制约束**。

当你在本地写完代码、提交 PR 后，GitHub Actions 会运行 `npm run lint`。如果代码违反了下述任何一条规则，CI 会标红你的 PR，阻断合并。错误信息会直接指向本文档的对应章节，告诉你「为什么这条规则存在」「正确写法是什么」。

> 规范的目的不是为难你，而是帮你提前消灭那些在真实工程项目中会导致线上事故的坏习惯。在 DevForge 学到的每一条规则，都对应着工业界的真实血泪教训。

---

## 2. ESLint 规则逐条解释

以下规则在 `eslint.config.js` 中配置，由 `npm run lint` 强制执行。

### no-unused-vars

| 项目 | 内容 |
|------|------|
| 级别 | `error`（阻断合并） |
| 捕获什么 | 声明了但从未使用的变量、函数参数、导入语句 |
| 为什么 | 死代码是维护负担的根源。未使用的变量往往意味着逻辑遗漏或重构残留 |

**正确写法：**

```javascript
import { useState, useEffect } from 'react'

function MyComponent({ title }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    document.title = title
  }, [title])
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

**错误写法：**

```javascript
import { useState, useEffect, useRef } from 'react'  // useRef 未使用 → error

function MyComponent({ title, subtitle }) {           // subtitle 未使用 → error
  const [count, setCount] = useState(0)
  const unused = 42                                    // 未使用 → error
  useEffect(() => {
    document.title = title
  }, [title])
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

> 提示：如果函数参数确实需要保留位置但暂不使用，可用下划线前缀豁免：`function handler(_event) {}`（配置了 `argsIgnorePattern: '^_'`）。

---

### no-console

| 项目 | 内容 |
|------|------|
| 级别 | `warn`（不阻断合并，但会在 CI 输出警告） |
| 捕获什么 | 代码中的 `console.log` / `console.warn` / `console.error` 调用 |
| 为什么 | 生产环境不应残留调试日志。`console.log` 会暴露内部数据、污染控制台、影响性能 |

**正确写法：**

```javascript
function fetchData() {
  return fetch('/api/data').then((res) => res.json())
}

// 如果确实需要日志，使用专门的 logger 服务或条件编译
```

**错误写法：**

```javascript
function fetchData() {
  console.log('开始请求')                    // warn
  return fetch('/api/data').then((res) => {
    console.log('响应:', res)                // warn
    return res.json()
  })
}
```

> 提示：开发阶段可用 `console.log` 临时调试，但提交前务必删除。CI 不会因为 `warn` 阻断合并，但维护者 review 时会要求清理。

---

### react-hooks/rules-of-hooks

| 项目 | 内容 |
|------|------|
| 级别 | `error`（阻断合并） |
| 捕获什么 | 在条件语句、循环、嵌套函数中调用 Hook；在非组件函数中调用 Hook |
| 为什么 | React 依赖 Hook 的调用顺序来关联状态。条件调用会破坏顺序一致性，导致状态错乱和崩溃 |

**正确写法：**

```javascript
function UserProfile({ userId }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!userId) return            // 在 Effect 内部做条件判断，而不是条件调用 Hook
    fetchUser(userId).then(setUser)
  }, [userId])

  if (!userId) return <p>请选择用户</p>
  if (!user) return <p>加载中...</p>
  return <div>{user.name}</div>
}
```

**错误写法：**

```javascript
function UserProfile({ userId }) {
  if (userId) {                                     // 条件调用 Hook → error
    const [user, setUser] = useState(null)
  }

  for (let i = 0; i < 3; i++) {                     // 循环中调用 Hook → error
    useEffect(() => {}, [])
  }

  const handler = () => {
    const [state, setState] = useState(0)            // 嵌套函数中调用 Hook → error
  }

  return <div />
}
```

---

### react-hooks/exhaustive-deps

| 项目 | 内容 |
|------|------|
| 级别 | `error`（阻断合并） |
| 捕获什么 | `useEffect` / `useCallback` / `useMemo` 的依赖数组遗漏了函数体内引用的外部变量 |
| 为什么 | 依赖数组遗漏会导致闭包捕获旧值，引发竞态条件、内存泄漏、状态不更新等难以排查的 bug |

**正确写法：**

```javascript
function SearchResults({ query }) {
  const [results, setResults] = useState([])

  useEffect(() => {
    if (!query) return
    let cancelled = false
    fetchResults(query).then((data) => {
      if (!cancelled) setResults(data)
    })
    return () => { cancelled = true }
  }, [query])   // query 在 Effect 内被引用，必须出现在依赖数组中
}
```

**错误写法：**

```javascript
function SearchResults({ query }) {
  const [results, setResults] = useState([])

  useEffect(() => {
    if (!query) return
    fetchResults(query).then(setResults)
  }, [])        // 依赖数组为空，但函数体引用了 query → error
}
```

> 提示：如果你确信某个依赖不需要列入（例如它是一个稳定引用），在上方注释 `// eslint-disable-next-line react-hooks/exhaustive-deps` 并说明原因。但请谨慎使用，99% 的情况下你应该把它加进去。

---

### react-refresh/only-export-components

| 项目 | 内容 |
|------|------|
| 级别 | `warn`（不阻断合并，但会在 CI 输出警告） |
| 捕获什么 | 一个文件中既导出 React 组件，又导出非组件值（常量、函数、类型） |
| 为什么 | React Fast Refresh (HMR) 要求每个文件只导出组件。混合导出会导致热更新时状态丢失或报错 |

**正确写法：**

```javascript
// constants.js — 常量单独放一个文件
export const MAX_ITEMS = 100
export const API_BASE = '/api/v1'

// UserCard.jsx — 只导出组件
export function UserCard({ name }) {
  return <div>{name}</div>
}
```

**错误写法：**

```javascript
// UserCard.jsx — 既导出组件又导出常量 → warn
export const MAX_ITEMS = 100

export function UserCard({ name }) {
  return <div>{name}</div>
}
```

> 提示：配置了 `allowConstantExport: true`，因此只导出常量（不导出组件）的文件不会报警。但「组件 + 常量混导」仍会触发警告。

---

### no-debugger

| 项目 | 内容 |
|------|------|
| 级别 | `error`（阻断合并） |
| 捕获什么 | 代码中的 `debugger` 语句 |
| 为什么 | `debugger` 会让浏览器暂停执行，如果残留到生产环境会卡住用户页面 |

**正确写法：**

```javascript
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

**错误写法：**

```javascript
function calculateTotal(items) {
  debugger                                      // → error
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

---

### eqeqeq

| 项目 | 内容 |
|------|------|
| 级别 | `error`（阻断合并） |
| 捕获什么 | 使用 `==` 或 `!=` 进行松散相等比较，而非 `===` 或 `!==` 严格比较 |
| 为什么 | `==` 会触发隐式类型转换，导致 `'' == 0`、`null == undefined` 等反直觉的结果，是无数 bug 的根源 |

**正确写法：**

```javascript
function isValid(value) {
  if (value === null || value === undefined) return false
  if (value === '') return false
  return true
}

// 判断 null/undefined 时可用宽松比较，但建议显式
if (value === null || value === undefined) { /* ... */ }
```

**错误写法：**

```javascript
function isValid(value) {
  if (value == null) return false       // 隐式转换 → error
  if (value == '') return false         // 隐式转换 → error
  if (status == 200) { /* ... */ }      // 应使用 === → error
  return true
}
```

> 提示：唯一可接受的 `==` 场景是 `value == null`（同时判断 `null` 和 `undefined`），但本项目一律要求 `===`，保持一致。

---

## 3. 提交规范

所有 commit message 必须遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。CI 会检查 commit 格式。

### 提交类型

| 类型 | 含义 | 何时使用 | 示例 |
|------|------|----------|------|
| `feat:` | 新功能 | 新增用户可感知的能力 | `feat: 新增虚拟列表靶场` |
| `fix:` | 修复 | 修复已有 bug | `fix: 修复 Context 重渲染问题` |
| `refactor:` | 重构 | 不改变外部行为的代码调整 | `refactor: 抽取公共防抖逻辑到 utils` |
| `docs:` | 文档 | 仅修改文档 | `docs: 补充 ESLint 规则说明` |
| `chore:` | 杂务 | 构建、配置、依赖等非功能变更 | `chore: 升级 Vite 到 8.1.1` |
| `test:` | 测试 | 新增或修改测试 | `test: 添加 JSON 序列化边界用例` |

### 格式要求

```
<type>: <简短描述>

<可选的详细说明>
```

- 描述部分使用中文，简洁明确，不超过 50 字
- 不要以句号结尾
- 使用祈使句（「新增」而非「新增了」）

---

## 4. 命名规范

一致的命名是可读性的基础。以下规则覆盖文件、变量、常量、组件四个维度。

### 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| React 组件文件 | PascalCase | `UserCard.jsx`、`SandboxViewer.jsx` |
| 工具函数文件 | camelCase | `helper.js`、`linkUtils.js` |
| 配置文件 | camelCase | `funnel.js`、`sandboxes.js` |
| 常量文件 | camelCase | `const.js` |
| Markdown 文档 | 全大写或 kebab-case | `ARCHITECTURE.md`、`ai-engineering-standard.md` |

### 变量命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 普通变量 | camelCase | `userName`、`isLoading` |
| 布尔变量 | camelCase + is/has/should 前缀 | `isVisible`、`hasError`、`shouldRender` |
| 函数 | camelCase | `handleSubmit`、`fetchUserData` |

### 常量命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 全局常量 | UPPER_SNAKE_CASE | `MAX_ITEMS`、`API_BASE_URL` |
| 枚举值 | UPPER_SNAKE_CASE | `STATUS_TODO`、`STATUS_SOLVED` |

### 组件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| React 组件 | PascalCase | `function UserCard() {}`、`const App = () => {}` |
| 组件 props | camelCase | `{ userName, onSubmit }` |
| 自定义 Hook | use 前缀 + camelCase | `useLocalStorage`、`useProgress` |

---

## 5. 目录规范

每个目录有明确的职责边界，放错位置会导致 CI 无法正确扫描或组件无法被动态导入。

| 目录 | 放什么 | 不放什么 | 示例 |
|------|--------|----------|------|
| `src/components/` | 通用 UI 组件（跨靶场复用） | 靶场专属组件、业务逻辑 | `MarkdownViewer.jsx`、`Toast.jsx` |
| `src/config/` | 配置数据和常量 | 含业务逻辑的函数 | `funnel.js`、`sandboxes.js`、`const.js` |
| `src/sandboxes/` | 靶场实操组件 + 任务说明 | 通用组件、非靶场代码 | `data-processing/JSONSerializationSandbox.jsx` |
| `src/services/` | 外部服务封装（API 调用等） | UI 组件、纯数据 | `githubService.js` |
| `src/hooks/` | 自定义 React Hooks | 非 Hook 函数 | `useLocalStorage.js`、`useKeyboard.js` |
| `src/utils/` | 纯工具函数（无副作用） | 含状态或副作用的逻辑 | `helper.js`、`link.js` |
| `docs/` | 纯 Markdown 文档 | 代码文件、图片资源 | `ARCHITECTURE.md`、`RULES.md` |

---

## 6. 文档规范

DevForge 的文档遵循严格的格式约束，确保零渲染依赖、任意平台可读。

### 只使用 GFM 语法

允许使用的 Markdown 语法：

- 标题（`#` ~ `######`）
- 有序/无序列表
- 表格（`| 列 | 列 |`）
- 代码块（``` 包裹，标注语言）
- 引用块（`>`）
- 行内代码（`` `code` ``）
- 链接和图片
- 粗体（`**bold**`）和斜体（`*italic*`）
- 删除线（`~~text~~`）
- 任务列表（`- [ ]` / `- [x]`）

### 禁止使用的扩展语法

| 禁止语法 | 来源 | 替代方案 |
|----------|------|----------|
| `!!! note` | mkdocs / Python-Markdown | 用 `>` 引用块代替 |
| `:::tip` / `:::warning` | Docusaurus / VuePress | 用 `>` 引用块代替 |
| `{% include %}` | Jekyll / Liquid | 直接内联内容 |
| frontmatter (`---`) | Hugo / Jekyll | 不需要，文档元信息写在正文第一行引用块 |
| Mermaid 图表 (` ```mermaid `) | 各种文档站 | 用 ASCII art 代码块代替 |

### 路径即导航

文档之间使用相对路径引用，路径本身即代表导航结构：

```markdown
详见 [架构设计文档](./ARCHITECTURE.md) 和 [代码规范法典](./RULES.md)。
```

不要使用锚点别名或短链接，保持路径的直观可读性。

---

> 本文档是 CI 拦截规则的唯一权威解释。如果你被 CI 拦截了，来这里找答案。
