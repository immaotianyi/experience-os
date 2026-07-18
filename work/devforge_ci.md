# DevForge CI/CD 排查指南

> **版本** v1.0.0 · **更新日期** 2026-07-15 · **状态** 正式发布

CI 爆红了？别慌。这份指南帮你在 5 分钟内定位问题并修复。

---

## 目录

1. [CI 流水线概览](#1-ci-流水线概览)
2. [ESLint 报错排查](#2-eslint-报错排查)
3. [Build 失败排查](#3-build-失败排查)
4. [常见问题 FAQ](#4-常见问题-faq)
5. [本地预检命令](#5-本地预检命令)

---

## 1. CI 流水线概览

当你提交 PR 或 push 到 `main` 分支时，GitHub Actions 会自动运行 CI 流水线。流水线依次执行以下步骤：

```
checkout  →  setup Node 22  →  npm ci  →  npm run lint  →  npm run build
```

| 步骤 | 命令 | 作用 | 失败后果 |
|------|------|------|----------|
| 依赖安装 | `npm ci` | 根据 `package-lock.json` 安装精确版本的依赖 | 流水线中断，通常是锁文件不匹配 |
| 代码检查 | `npm run lint` | 运行 ESLint，检查代码规范 | PR 标红，输出 `::error` 指向 RULES.md |
| 构建验证 | `npm run build` | 运行 Vite 构建，验证代码可打包 | PR 标红，输出 `::error` 指向本指南 |

任何一个步骤失败，整个流水线标记为失败，PR 无法合并。你需要修复所有红色步骤后重新 push。

---

## 2. ESLint 报错排查

这是最常见的 CI 失败原因。CI 会在失败时输出 `::error` 注解，直接指向 `docs/RULES.md`。下表列出了常见报错及其修复方法。

### 常见错误一览

| 错误信息 | 规则 | 原因 | 修复方法 | 规范详情 |
|----------|------|------|----------|----------|
| `'xxx' is defined but never used` | no-unused-vars | 声明了变量/导入但未使用 | 删除未使用的声明，或加 `_` 前缀 | [RULES.md#no-unused-vars](./RULES.md#no-unused-vars) |
| `Unexpected console statement` | no-console | 代码中残留 `console.log` | 删除调试日志 | [RULES.md#no-console](./RULES.md#no-console) |
| `React Hook is called conditionally` | rules-of-hooks | 在 if/for 中调用 Hook | 将 Hook 移到条件语句之前 | [RULES.md#react-hooksrules-of-hooks](./RULES.md#react-hooksrules-of-hooks) |
| `React Hook has a missing dependency` | exhaustive-deps | 依赖数组遗漏了引用的变量 | 将遗漏的变量加入依赖数组 | [RULES.md#react-hooksexhaustive-deps](./RULES.md#react-hooksexhaustive-deps) |
| `Fast refresh only works when a file only exports components` | only-export-components | 文件混合导出组件和常量 | 将常量拆到单独文件 | [RULES.md#react-refreshonly-export-components](./RULES.md#react-refreshonly-export-components) |
| `Unexpected 'debugger' statement` | no-debugger | 代码中残留 `debugger` | 删除 `debugger` 语句 | [RULES.md#no-debugger](./RULES.md#no-debugger) |
| `Expected '===' and instead saw '=='` | eqeqeq | 使用了 `==` 而非 `===` | 将 `==` 改为 `===`，`!=` 改为 `!==` | [RULES.md#eqeqeq](./RULES.md#eqeqeq) |

### 排查步骤

1. **打开 PR 的 Checks 标签页**，点击失败的 `lint-and-build` job。
2. **展开 "Run ESLint" 步骤**，查看具体的报错行号和规则名。
3. **点击 CI 输出的 `::error` 链接**，跳转到 `docs/RULES.md` 对应章节。
4. **对照正/误代码示例**，修改你的代码。
5. **本地运行 `npm run lint`** 验证修复，确认无报错后再 push。

### 本地复现 ESLint 检查

```bash
# 检查全部文件
npm run lint

# 检查单个文件
npx eslint src/sandboxes/react-patterns/StateManagerSandbox.jsx

# 查看详细规则说明
npx eslint --print-config src/App.jsx
```

---

## 3. Build 失败排查

Build 失败意味着代码虽然通过了 lint，但 Vite 无法将其打包。常见原因分为三类。

### 导入错误 (Import Errors)

| 错误信息 | 原因 | 修复方法 |
|----------|------|----------|
| `Failed to resolve import "xxx"` | 导入了不存在的模块 | 检查路径拼写，确认文件存在 |
| `Cannot find module './xxx'` | 相对路径错误 | 确认文件层级关系，使用正确的 `./` 或 `../` |
| `The requested module does not provide an export named 'xxx'` | 导入了不存在的命名导出 | 检查目标文件的 `export` 语句 |

```javascript
// 错误：路径拼写错误
import { foo } from './../../../componets/Header.jsx'   // componets → components

// 正确
import { foo } from '../../components/Header.jsx'
```

### 语法错误 (Syntax Errors)

| 错误信息 | 原因 | 修复方法 |
|----------|------|----------|
| `Unexpected token` | JSX 语法错误，如标签未闭合 | 检查 JSX 标签是否成对闭合 |
| `Cannot use import statement outside a module` | 在非模块文件中使用 import | 确保文件扩展名为 `.js` / `.jsx`，且 `package.json` 设置了 `"type": "module"` |
| `Unterminated string literal` | 字符串引号未闭合 | 检查引号配对 |

### 依赖缺失 (Missing Dependencies)

| 错误信息 | 原因 | 修复方法 |
|----------|------|----------|
| `Module not found: Can't resolve 'xxx'` | 使用了未安装的 npm 包 | 运行 `npm install xxx`，并确认已写入 `package.json` |
| `Cannot find package 'xxx'` | 包名拼写错误 | 检查 npm 包名，访问 npmjs.com 确认 |

```bash
# 如果 CI 报依赖缺失但本地正常，通常是 package.json 漏了依赖
# 确认本地 node_modules 中有该包后：
npm install xxx --save

# 然后提交 package.json 和 package-lock.json
```

### 排查步骤

1. **打开 PR 的 Checks 标签页**，点击失败的 `lint-and-build` job。
2. **展开 "Run Build" 步骤**，查看报错的文件路径和行号。
3. **根据错误类型对照上表**，定位问题。
4. **本地运行 `npm run build`** 复现并修复。
5. **确认本地 build 通过后再 push**。

---

## 4. 常见问题 FAQ

### Q: CI 爆红了怎么办？

**A:** 按以下顺序排查：

1. 打开 PR 的 Checks 标签页，找到失败的步骤。
2. 如果是 "Run ESLint" 失败 → 跳转到 [第 2 节](#2-eslint-报错排查)。
3. 如果是 "Run Build" 失败 → 跳转到 [第 3 节](#3-build-失败排查)。
4. 如果是 "Install dependencies" 失败 → 通常是 `package-lock.json` 与 `package.json` 不一致，运行 `npm install` 后重新提交锁文件。
5. 修复后在本地运行 `npm run lint && npm run build` 确认通过，再 push。

### Q: 本地怎么复现 CI 的检查？

**A:** 运行以下两条命令，它们和 CI 执行的完全一致：

```bash
npm ci              # 与 CI 一致的依赖安装方式（需要 package-lock.json）
npm run lint        # ESLint 检查
npm run build       # Vite 构建
```

如果你没有 `package-lock.json` 或想更新依赖：

```bash
npm install         # 生成/更新 package-lock.json
```

建议在每次提交前都运行一次 `npm run lint && npm run build`，避免 CI 来回报错。

### Q: 如何跳过 CI？

**A:** 不能，也不应该。

DevForge 的设计理念就是**物理拦截**——CI 是代码质量的最后一道防线，没有后门可以绕过。如果你觉得某条规则过于严格，正确的做法是：

1. 在 PR 中说明你的理由，附上具体场景。
2. 与维护者讨论是否调整规则配置（修改 `eslint.config.js`）。
3. 如果达成共识，规则变更本身也是一个 PR，需要通过 CI。

不要尝试用 `// eslint-disable` 大面积绕过规则。少量、有注释的豁免是可以接受的，但滥用会被 review 拒绝。

### Q: 为什么 CI 显示的报错和本地不一样？

**A:** 最常见的原因是依赖版本不一致。CI 使用 `npm ci`，严格按 `package-lock.json` 安装；本地如果用了 `npm install`，可能装到了不同的小版本。解决办法：

```bash
rm -rf node_modules package-lock.json
npm install
npm run lint
```

### Q: CI 通过了但 review 被拒绝，为什么？

**A:** CI 只检查「机器能检测的问题」（语法、规范、构建）。代码设计、可读性、架构合理性需要人工 review。CI 通过不等于可以合并，请尊重 review 意见。

---

## 5. 本地预检命令

在提交代码之前，请运行以下命令，确保本地和 CI 结果一致。这是避免 PR 反复标红的最有效方法。

### 预检清单

| 命令 | 作用 | 何时运行 |
|------|------|----------|
| `npm run lint` | ESLint 代码规范检查 | 每次提交前 |
| `npm run build` | Vite 生产构建验证 | 每次提交前 |
| `npm run dev` | 启动开发服务器，手动验证功能 | 修改 UI 逻辑后 |
| `npm run preview` | 预览构建产物，验证生产环境行为 | 发布前 |

### 一键预检

```bash
# 检查 + 构建一条命令搞定
npm run lint && npm run build
```

如果这条命令在你的本地通过了，CI 几乎不可能失败（除非依赖版本差异，参见 FAQ）。

### git pre-commit hook（可选）

如果你希望在 `git commit` 时自动运行 lint，可以创建 pre-commit hook：

```bash
# .git/hooks/pre-commit
#!/bin/sh
npm run lint || exit 1
```

```bash
chmod +x .git/hooks/pre-commit
```

这样每次 commit 时都会自动检查，不合格的代码无法提交。

---

> 还在报错？把 CI 的完整输出贴到 GitHub Issue 里，维护者会帮你排查。
