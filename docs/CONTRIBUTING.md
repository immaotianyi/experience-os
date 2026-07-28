# 贡献指南

面向想要修改 EOS（Experience OS）代码的工程师。

---

## 开发环境搭建

### 前置条件

- Node.js >= 20（项目使用 `node:test`、`node:fs/promises` 等现代 API）
- npm（随 Node 安装）

### 安装依赖

```bash
npm install
cd apps/web-react && npm install
```

### 启动开发环境

需要两个终端进程：

**终端 1 — 启动后端**（默认监听 `127.0.0.1:4173`）：

```bash
npm start
```

后端是一个零框架的 Node 原生 HTTP 服务器（`src/webServer.js`），同时承载 REST API 和前端静态资源。

**终端 2 — 启动前端开发服务器**（Vite，默认 `http://localhost:5173`，自动代理 `/api` 到后端 4173）：

```bash
npm run dev:web
```

Vite 开发服务器支持热更新（HMR），修改 React 组件后浏览器即时刷新。

### 常用环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `4173` | 后端监听端口 |
| `EOS_HOST` | `127.0.0.1` | 绑定地址 |
| `EOS_VAULT_DIR` | `work/vaults/real` | Vault 根目录 |
| `EOS_ALLOW_MOCK_DRAFTS` | 未设置 | 设为 `"1"` 允许 mock LLM 草稿（演示用） |
| `EOS_DEPLOYMENT_MODE` | `"local"` | `"local"` 或 `"cloud"`（Docker/Render 部署） |

---

## 代码规范

### 模块文件头注释规范

每个模块文件（尤其是 `src/` 下的核心模块）必须在顶部 `import` 之前包含一个 JSDoc 风格的文件头注释，结构如下（参考 `src/stateMachine.js`、`src/vault.js`）：

```
/**
 * 模块名 — 一句话说明做什么。
 *
 * 做什么：
 *   描述该模块在系统中的职责，1-3 句话。
 *
 * 核心抽象：
 *   - 关键概念/数据结构
 *   - 与其他模块的边界
 *
 * 关键不变量：
 *   1. ...
 *   2. ...
 *
 * 设计取舍：
 *   - 为什么这样做，为什么不那样做
 *
 * 不做什么：
 *   - 明确列出本模块不负责的事情，防止边界膨胀
 */
```

前端文件（`apps/web-react/src/`）使用简化版文件头（5-10 行），说明组件/模块做什么和核心职责即可。

### JSDoc 规范

- 公共函数必须加 JSDoc，包含 `@param` 和 `@returns`。
- 注释讲"做什么"和"为什么"，**不要**重复代码字面意思。
- 反例（无意义）：`/** @param {string} name - 名字 */`（只重复了参数名）
- 正例（有用）：`/** @param {string} name - 人类可读的项目名，用于 UI 展示，非唯一标识 */`
- 私有/内部函数可省略 JSDoc，但如果逻辑非显而易见建议加行内注释。

### 命名约定

| 场景 | 风格 | 示例 |
|------|------|------|
| Record kind 名 | PascalCase | `Project`, `WallHit`, `SkillRating` |
| 字段名/变量名/函数名 | camelCase | `createdAt`, `fetchProjects`, `isValid` |
| 文件名 | kebab-case | `web-server.js`, `quality-rating.js`, `use-fetch.js` |
| React 组件文件 | PascalCase.jsx | `ProjectView.jsx`, `ErrorBoundary.jsx` |
| Record ID 前缀 | `{kind 小写}.` 前缀 | `project.xxx`, `skill.xxx`, `wallhit.xxx` |
| 常量/枚举 | UPPER_SNAKE_CASE（冻结对象） | `STATES`, `TRANSITIONS` |
| CSS class | kebab-case | `.rail-item`, `.attention-beacon` |

### 错误处理原则

1. **不静默吞错**：`catch` 块要么重新 throw，要么返回 `null`/有意义的错误对象并让调用方知道出错了。空的 `catch (e) {}` 是反模式。
2. **`safeErrorMessage` 不泄露**：所有返回给客户端的错误消息必须经过 `webServer.js` 中的 `safeErrorMessage()` 过滤，不暴露堆栈、文件路径、内部错误细节。400/413/415 等客户端错误可以透出原始 message；服务端错误统一返回通用消息并在服务端 console.error。
3. **非法状态直接 throw**：如 `stateMachine.transition()` 遇到非法转换直接 `throw Error`，由上层编排层处理；不要返回 `{ ok: false }` 然后让调用方忘记检查。
4. **校验返回 issues 数组**：`validate.js` 中的 `validate<Type>` 函数返回 `string[]`（空数组=合法），不抛异常，让调用方决定是 throw 还是转 WallHit。

---

## 新增 Record Kind 的步骤清单

新增一种领域记录类型（如 `FooRecord`）需要依次修改以下文件：

1. **`src/domain.js`**
   - 添加 `createFooRecord({...})` 工厂函数，字段包含 `id`、`kind: "FooRecord"`、`createdAt`、`updatedAt` 等基础字段。
   - 如果有状态/类型枚举，在 `domain.js` 中导出对应的常量（如 `FOO_RECORD_STATUSES`）。

2. **`src/vault.js`** — 在 `COLLECTION_DIR` 映射中注册：
   ```js
   FooRecord: "foo-records",
   ```
   目录名用 kebab-case。

3. **`src/validate.js`**
   - 添加 `validateFooRecord(record)` 函数，返回 `string[]` issues。
   - 在 `validateRecord` 的 kind→validator 映射表中添加 `"FooRecord": validateFooRecord`。
   - 在 `validateVault` 的 `supportedKinds` 列表中添加 `"FooRecord"`。
   - 如果需要，扩展 `wallTypeForIssue` 映射。

4. **`src/webServer.js`**（如果该类型需要 API 访问）
   - 添加对应的 GET/POST 端点，遵循现有 if-else 路由链模式。
   - 读操作注意权限过滤（`filterReadable`）；写操作注意身份校验和 `safeErrorMessage`。

5. **前端**（如果需要 UI）
   - 在 `apps/web-react/src/api/` 下添加或扩展对应的 API 调用函数。
   - 添加/扩展 View 组件展示该类型数据。

6. **测试** — 在 `tests/` 下添加 `foo-record.test.js`（或在现有测试文件中增加用例），覆盖：
   - 工厂函数返回正确结构
   - 校验器接受合法记录、拒绝非法记录
   - Vault 存取往返正确

---

## 新增 API 端点的步骤清单

1. **确定 HTTP 方法和路径**：遵循 RESTful 风格，路径以 `/api/` 开头。
   - 读操作：`GET`，参数放 query string
   - 写操作：`POST`，参数放 JSON body
2. **在 `src/webServer.js` 的 `handleApi` 函数中添加路由分支**，在合适的业务域分组处插入 if-else 分支。
3. **解析参数**：GET 用 `new URLSearchParams(url.search)`；POST 用已解析好的 `body`（中间件已解析 JSON）。
4. **调用引擎/存储层**：不要在路由处理函数中写业务逻辑，调用 `projectEngine`/`reviewEngine`/`marketplace`/`GitVault` 等模块的方法。
5. **权限检查**：写操作从 `identity` 获取角色，用 `accessControl.js` 校验权限；读操作必要时用 `filterReadable` 过滤。
6. **返回 JSON**：用 `sendJson(response, data)` 返回成功响应；错误用 `sendJson(response, { error: safeErrorMessage(err) }, 400)` 。
7. **前端对接**：在 `apps/web-react/src/api/` 对应文件中添加调用函数（使用 `getJson`/`postJson`）。
8. **测试**：在 `tests/` 下添加测试或扩展现有 API 测试文件。

---

## 测试规范

- **测试运行器**：使用 Node.js 内置 `node:test`，零框架、零依赖。
- **测试文件命名**：`tests/*.test.js`，每个源文件对应一个测试文件（如 `vault.js` → `vault.test.js`）。
- **运行全部测试**：
  ```bash
  npm test
  ```
- **运行单个测试文件**：
  ```bash
  node --test tests/vault.test.js
  ```
- **测试风格**：
  - 使用 `node:test` 的 `test`/`describe`/`it`（或直接 `test`），断言使用 `node:assert/strict`。
  - 每个测试用例应独立，不依赖执行顺序；需要临时文件时用临时目录，测试结束清理。
  - 测试描述用中文，说明"在什么条件下应该发生什么"。
  - 不使用 mock 框架；需要 mock LLM/外部服务时，注入适配器或传入假数据。

---

## 提交前检查清单

提交代码前，请确认以下事项：

- [ ] **`npm test` 通过**：所有后端单元测试绿色，无失败用例。
- [ ] **`npm run build` 前端通过**：在 `apps/web-react/` 下 `npm run build`（或根目录 `npm run web:build`）成功，Vite 构建无错误。
- [ ] **手动验证 `/api/health`**：启动后端后，`curl http://127.0.0.1:4173/api/health` 返回正常响应。
- [ ] **无 lint 警告**：检查是否有未使用的 import、变量（项目目前未接入 ESLint，但请自行 review）。
- [ ] **文件头注释**：新增的 `.js`/`.jsx` 文件已添加文件头注释，遵循本指南的规范。
- [ ] **向后兼容**：如果修改了 record schema，旧版本记录（缺少新字段）能被正确读取（可选字段用"存在则校验"模式）。
- [ ] **敏感信息未泄露**：新增的 API 端点错误响应走 `safeErrorMessage`，不在错误消息中暴露堆栈/路径。
