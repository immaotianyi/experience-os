# DevForge 架构设计文档

> **版本** v1.0.0 · **更新日期** 2026-07-15 · **状态** 正式发布

---

## 目录

1. [项目愿景](#1-项目愿景)
2. [架构哲学：极简单体仓库 (Monorepo / All-in-One)](#2-架构哲学极简单体仓库-monorepo--all-in-one)
3. [仓库目录结构](#3-仓库目录结构)
4. [核心设计模式：物理拦截 vs 知识呈现](#4-核心设计模式物理拦截-vs-知识呈现)
5. [漏斗式路由逻辑](#5-漏斗式路由逻辑)
6. [CI/CD 流水线架构](#6-cicd-流水线架构)
7. [技术栈选型决策](#7-技术栈选型决策)
8. [MVP 里程碑](#8-mvp-里程碑)
9. [非功能性约束](#9-非功能性约束)
10. [进阶特性](#10-进阶特性)

---

## 1. 项目愿景

DevForge 是一个开源的教育与工程化协作平台，致力于在**学生**（仅有单文件 / 算法题背景）和**工业生产**（模块化解耦、CI/CD、高可用）之间架起最短路径的桥梁。

我们认为，从「能写出一个能跑的函数」到「能交付一个可维护的工程」之间，缺少的不是更多教程，而是一个**可以被真实 CI 拦截、被真实规范约束、被真实工具链检验**的练手场。DevForge 就是这个练手场。

### 三大核心原则

| 原则 | 含义 | 对应实现 |
|------|------|----------|
| 接口统一 | 所有靶场、文档、导航共享同一套 CTA 分发协议 | `handleCtaClick` 统一入口 |
| 实现下放 | 框架只定义契约，具体实现交由各靶场自行完成 | `loadComponent` 动态导入 |
| 渐进式认知 | 学习者按 L1 → L2 → L3 漏斗逐层深入，不被信息淹没 | 三级漏斗导航 |

---

## 2. 架构哲学：极简单体仓库 (Monorepo / All-in-One)

我们拒绝引入外部文档站生成器（Quartz、Docusaurus、VitePress 等）。所有文档都是**纯 Markdown**，所有资产都在**同一个 Git 仓库**里。一个仓库承载三类资产：脚手架源码、CI 拦截配置、规范法典。

### 2.1 为什么选择 All-in-One

| 维度 | 外部文档站（Docusaurus / VitePress 等） | 单体仓库纯 Markdown |
|------|------------------------------------------|----------------------|
| 构建依赖 | 需要 Node 构建 + 框架运行时 + 主题插件 | 零构建，Git 原生预览 |
| 学习成本 | 需学习框架专属语法（frontmatter / MDX / 组件） | 只需会写标准 Markdown |
| 维护负担 | 框架升级、依赖安全、主题适配的长期成本 | 文件即文档，永不过期 |
| CI 集成 | 文档站与代码仓库分离，需额外部署流水线 | 文档与代码同仓库同 PR，CI 统一拦截 |
| 可移植性 | 锁定在特定框架生态 | 任意 Markdown 渲染器即可阅读 |
| 版本追溯 | 文档变更与代码变更可能脱节 | 文档与代码同 commit，原子可追溯 |

### 2.2 设计约束

| 约束 | 说明 | 为什么 |
|------|------|--------|
| 纯标准 Markdown (GFM only) | 只使用 GitHub Flavored Markdown 语法：标题、列表、表格、代码块、引用块。禁止 `!!! note`、`:::tip` 等扩展语法 | 保证任意平台可读，零渲染依赖 |
| 零构建依赖 | 文档不需要任何编译步骤即可阅读 | 降低贡献门槛，学生只需会写 Markdown |
| 路径即导航 | `docs/ARCHITECTURE.md` 这个路径本身就是导航结构 | 物理路径即信息架构，所见即所得 |

---

## 3. 仓库目录结构

```
devforge/
├── .github/                     # ── 拦截层（冷酷监工）
│   ├── workflows/
│   │   ├── ci.yml               #   CI 流水线：lint + build
│   │   └── deploy.yml           #   GitHub Pages 部署
│   ├── PULL_REQUEST_TEMPLATE.md #   PR 模板
│   └── ISSUE_TEMPLATE/
│       └── bug_report.md        #   Bug 上报模板
│
├── docs/                        # ── 法典层（耐心导师）
│   ├── ARCHITECTURE.md          #   架构设计文档（本文档）
│   ├── RULES.md                 #   代码规范法典
│   ├── CI-CD-GUIDE.md           #   CI/CD 排查指南
│   ├── ONBOARDING.md            #   新手上路指南
│   └── ai-engineering-standard.md # AI 工程化规范
│
├── src/                         # ── 源码层（待检验代码）
│   ├── components/              #   通用组件
│   ├── config/                  #   配置（漏斗数据、靶场列表、常量）
│   │   ├── const.js
│   │   ├── funnel.js
│   │   └── sandboxes.js
│   ├── hooks/                   #   自定义 Hooks
│   ├── sandboxes/               #   靶场实操组件
│   │   ├── data-processing/
│   │   ├── react-patterns/
│   │   └── performance/
│   ├── services/                #   外部服务封装
│   ├── utils/                   #   工具函数
│   ├── App.jsx                  #   根组件
│   └── main.jsx                 #   入口
│
├── CONTRIBUTING.md              # 贡献指南
├── README.md                    # 项目说明
├── package.json
├── eslint.config.js             # ESLint 扁平配置
└── vite.config.js               # Vite 构建配置
```

### 3.1 三类资产的职责边界

```
┌─────────────────────────────────────────────────────────────┐
│                     用户 / 贡献者                            │
│              (学生 · 初级开发者 · 维护者)                     │
└──────────┬──────────────────┬──────────────────┬────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
  │  .github/      │ │  docs/         │ │  src/          │
  │  拦截层         │ │  法典层         │ │  源码层         │
  │  (冷酷监工)     │ │  (耐心导师)     │ │  (待检验代码)   │
  │                │ │                │ │                │
  │  ci.yml        │ │  ARCHITECTURE  │ │  App.jsx       │
  │  deploy.yml    │ │  RULES         │ │  sandboxes/    │
  │  PR/Issue 模板 │ │  CI-CD-GUIDE   │ │  components/   │
  │                │ │  ONBOARDING    │ │  hooks/        │
  │                │ │  ai-engineering│ │  config/       │
  └───────┬────────┘ └───────┬────────┘ └───────┬────────┘
          │                  │                  │
          │   拦截失败时      │  错误重定向到     │  PR 提交时
          │   指向法典        │  对应规则解释     │  触发拦截
          │                  │                  │
          ▼                  ▼                  ▼
     ┌─────────────────────────────────────────────────┐
     │            ::error → docs/RULES.md#锚点          │
     │            CI 报错信息直接链接到规范法典           │
     └─────────────────────────────────────────────────┘
```

### 3.2 为什么这样划分

每一层都有鲜明的「性格」，这种性格决定了它的职责边界：

- **`.github/` — 冷酷监工**：它不讲情面。代码不通过 lint，CI 直接标红；PR 缺少自检清单，模板会提醒你。它是规则的物理执行者，不接受「我觉得没问题」。
- **`docs/` — 耐心导师**：它不指责，只解释。当 CI 拦截了你的代码，错误信息会把你导向这里，告诉你「为什么这条规则存在」「正确写法是什么」「错误长什么样」。
- **`src/` — 待检验代码**：它是最诚实的部分。靶场里故意埋了 bug，等你来修；修复后必须通过 CI 的检验才算合格。代码本身不解释自己，解释工作交给法典层。

### 3.3 文档的导航结构

文档之间存在一条明确的阅读动线，对应贡献者从「认识项目」到「参与贡献」的完整路径：

```
README.md                项目入口，回答「这是什么 / 为什么存在」
   │
   ▼
ONBOARDING.md            第一次参与：环境准备 → 30 秒启动 → 第一个 PR
   │
   ▼
ARCHITECTURE.md          理解全局：三类资产 · 漏斗路由 · CI 流水线（本文档）
   │
   ▼
RULES.md                 代码规范：每条 ESLint 规则的正/误对照
   │
   ▼
CI-CD-GUIDE.md           CI 爆红时的 5 分钟修复手册
   │
   ▼
CONTRIBUTING.md          贡献流程：提交规范 · PR 流程 · 行为准则
```

---

## 4. 核心设计模式：物理拦截 vs 知识呈现

DevForge 的核心设计理念可以用一句话概括：**用 CI 物理拦截错误，用文档耐心解释原因**。这两者不是割裂的，而是通过「错误重定向」机制紧密耦合。

| 维度 | 物理拦截 (Physical Interception) | 知识呈现 (Knowledge Presentation) |
|------|----------------------------------|----------------------------------|
| 发生位置 | `.github/workflows/ci.yml` | `docs/RULES.md` |
| 触发时机 | PR 提交 / push 到 main | 用户主动点击阅读 |
| 交互方式 | 强制阻断，CI 标红，PR 无法合并 | 渐进展示，按需深入 |
| 语气 | 冷酷、不可协商 | 耐心、解释原因 |
| 输出形式 | `::error` 注解 + 退出码 1 | Markdown 表格 + 正/误代码对照 |
| 用户体验 | 「你的代码有问题，不能合并」 | 「这是为什么，正确写法在这里」 |

### 错误重定向机制

当 CI 拦截到代码问题时，错误信息不是冷冰冰的报错堆栈，而是**结构化输出**，直接把用户导向 `docs/RULES.md` 中对应的规则解释。这样用户不需要在报错和文档之间来回跳转搜索。

```yaml
# .github/workflows/ci.yml 中的结构化错误输出
- name: Run ESLint
  run: |
    npm run lint || {
      echo "::error file=docs/RULES.md,title=ESLint 规范未通过::\\
        代码未通过 ESLint 检查。请阅读 docs/RULES.md 查看每条规则的正/误对照。"
      echo "::error title=排查指南::\\
        CI 爆红了？查看 docs/CI-CD-GUIDE.md 获取 5 分钟修复手册。"
      exit 1
    }
```

这段配置做了三件事：

1. 运行 `npm run lint`，如果失败则进入错误分支。
2. 输出 `::error` 注解，在 GitHub PR 的 Files changed 视图直接高亮提示，并附带 `docs/RULES.md` 的链接。
3. 退出码为 1，阻断 PR 合并。

---

## 5. 漏斗式路由逻辑

DevForge 采用**三级漏斗式导航**，将海量内容按认知深度逐层收敛，避免学习者在入口处就被信息淹没。

### 三层漏斗结构

```
                    ┌─────────────────────────┐
                    │      L1  一级大类        │
                    │  软件开发 · 网络安全 ...  │
                    └────────┬────────────────┘
                             │ 选中后展开
                    ┌────────▼────────────────┐
                    │      L2  子方向          │
                    │  前端 · 数据处理 · 性能  │
                    └────────┬────────────────┘
                             │ 选中后展开
                    ┌────────▼────────────────┐
                    │      L3  落地靶场/文档   │
                    │  sandbox · doc · external│
                    └─────────────────────────┘
```

### URL Hash 路由

每一层的选择状态都同步到 URL hash，实现可分享、可后退的导航体验：

```
https://devforge.github.io/#l1=software&l2=frontend&l3=state-management
```

对应的 hash 参数：

| 参数 | 含义 | 示例值 |
|------|------|--------|
| `l1` | 一级大类 ID | `software` |
| `l2` | 子方向 ID | `frontend` |
| `l3` | 落地节点 ID | `state-management` |
| `sandbox` | 当前打开的靶场 ID | `state-management` |
| `doc` | 当前打开的文档 ID | `architecture` |

路由读写由 `writeHash()` / `readHash()` 两个纯函数负责，状态变化时通过 `useEffect` 自动同步。

### CTA 分发

L3 节点落地时，由 `handleCtaClick` 统一分发，根据 `cta.kind` 决定行为：

| `cta.kind` | 行为 | 示例 |
|------------|------|------|
| `sandbox` | 打开 SandboxViewer，异步加载靶场组件 | `kind: 'sandbox', sandboxId: 'state-management'` |
| `doc` | 打开 MarkdownViewer，渲染本地 Markdown | `kind: 'doc', docId: 'architecture'` |
| `external` | 走 SafeLink 安全跳转外部链接 | `kind: 'external', href: 'https://...'` |

---

## 6. CI/CD 流水线架构

### 拦截矩阵

CI 流水线在两个时机拦截代码质量，覆盖从提交到部署的全链路：

| 拦截点 | 触发条件 | 执行内容 | 失败行为 |
|--------|----------|----------|----------|
| CI Lint | push 到 main / PR 到 main | `npm ci` → `npm run lint` | 标红 PR，输出 `::error` 指向 RULES.md |
| CI Build | push 到 main / PR 到 main | `npm run build` | 标红 PR，阻断合并 |
| Deploy | push 到 main | `npm run build` → 上传 Pages 产物 → 部署 | 部署失败，页面不更新 |

### 流水线流程图

```
push / PR
    │
    ▼
┌──────────┐     失败     ┌──────────────────────┐
│ npm ci   │─────────────▶│ ::error → CI-CD-GUIDE │
└────┬─────┘              └──────────────────────┘
     │ 通过
     ▼
┌──────────┐     失败     ┌──────────────────────┐
│ lint     │─────────────▶│ ::error → RULES.md    │
└────┬─────┘              └──────────────────────┘
     │ 通过
     ▼
┌──────────┐     失败     ┌──────────────────────┐
│ build    │─────────────▶│ ::error → CI-CD-GUIDE │
└────┬─────┘              └──────────────────────┘
     │ 通过 (仅 main 分支)
     ▼
┌──────────────────────────┐
│ 上传 Pages 产物 → 部署    │
└──────────────────────────┘
```

### 错误重定向的结构化输出

CI 在每个失败节点输出结构化注解，将报错信息直接关联到对应文档：

```yaml
# Lint 失败时的结构化输出
- name: Run ESLint
  run: |
    if ! npm run lint; then
      echo "::error file=docs/RULES.md,title=ESLint 检查未通过::\\
        请对照 docs/RULES.md 逐条修复，每条规则附有正/误代码对照。"
      echo "::error title=排查指南::\\
        完整排查步骤见 docs/CI-CD-GUIDE.md#2-eslint-报错排查"
      exit 1
    fi

# Build 失败时的结构化输出
- name: Run Build
  run: |
    if ! npm run build; then
      echo "::error title=Vite 构建失败::\\
        构建失败排查见 docs/CI-CD-GUIDE.md#3-build-失败排查"
      exit 1
    fi
```

---

## 7. 技术栈选型决策

每一项技术选型都有明确的「为什么选它」和「为什么不选别的」。

| 技术 | 版本 | 选型理由 |
|------|------|----------|
| React | 19 | 当前稳定主线版本，支持 Suspense / lazy 实现靶场异步加载，Hooks 生态成熟 |
| Vite | 8 | 零配置极速启动，原生 ESM，`?raw` 后缀安全加载 Markdown 文件，无需额外插件 |
| ESLint | 10 | 扁平配置 (Flat Config)，与 React Hooks 插件深度集成，CI 拦截的核心执行器 |
| GitHub Actions | - | 与 GitHub 仓库原生集成，`::error` 注解直接在 PR 视图高亮，零额外成本 |
| 纯 Markdown | GFM | 零构建依赖，任意平台可读，贡献者只需会写标准 Markdown |
| npm | - | Node.js 原生包管理器，`package-lock.json` 保证 CI 与本地环境一致 |

---

## 8. MVP 里程碑

项目按 5 个阶段渐进交付，每个阶段都有明确的可验证产出：

| 阶段 | 名称 | 目标 | 可验证产出 |
|------|------|------|------------|
| Phase 1 | 脚手架奠基 | 搭建 Vite + React + ESLint 工程 | `npm run dev` 可启动，`npm run lint` 通过 |
| Phase 2 | 漏斗导航 | 实现三级漏斗 + URL hash 路由 | 选中状态可分享、可后退 |
| Phase 3 | 靶场实况 | 接入 9 个靶场 + 错误边界 + 代码编辑器 | 靶场可打开、可修复、可标记完成 |
| Phase 4 | CI 拦截 | CI 流水线 + 结构化错误输出 + Pages 部署 | PR 不通过 lint 则标红并指向 RULES.md |
| Phase 5 | 协作闭环 | GitHub PR 一键提交 + 进度追踪 + 命令面板 | 靶场修复后可直接提交 PR |

---

## 9. 非功能性约束

以下约束是硬性的，不可妥协：

| 约束 | 要求 | 原因 |
|------|------|------|
| Node.js 版本 | v22 LTS | 统一运行时，CI 与本地一致 |
| 锁文件 | `package-lock.json` 必须提交 | 保证依赖版本可复现，CI 使用 `npm ci` |
| 主分支保护 | `main` 分支禁止直接 push | 所有变更必须通过 PR + CI 检查 |
| 提交规范 | Conventional Commits | `feat:` / `fix:` / `refactor:` / `docs:` / `chore:` / `test:` |
| 文档格式 | GFM only | 禁止 `!!! note` / `:::tip` 等扩展语法，保证零渲染依赖 |
| CI 超时 | 单 job 不超过 10 分钟 | 防止卡死任务占用 runner 资源 |

---

## 10. 进阶特性

在 MVP 之上，DevForge 提供以下进阶特性来提升工程体验：

### 命令面板 (Cmd+K)

按 `⌘K`（macOS）或 `Ctrl+K`（Windows/Linux）唤起全局命令面板，支持：

- 搜索并跳转到任意靶场
- 搜索并打开任意文档
- 快速切换漏斗导航层级

实现位于 `src/hooks/useKeyboard.js`，通过全局 `keydown` 事件监听 `mod+k` 组合键。

### 进度追踪 (localStorage)

用户的靶场完成状态持久化在浏览器本地，无需登录：

- 存储键：`devforge_progress`
- 数据结构：`{ [sandboxId]: 'Todo' | 'Solved' | 'Skipped' }`
- 读写函数：`loadProgress()` / `saveProgress()`

### GitHub PR 一键提交

在靶场中修复代码后，无需切换到 GitHub 网页端，直接在应用内提交 PR：

1. 用户输入 GitHub Personal Access Token（仅存于 `localStorage`，不上传服务端）
2. 通过 GitHub Contents API 获取目标文件 SHA
3. 创建新分支 `sandbox-fix/{id}-{timestamp}`
4. 更新文件内容到新分支
5. 创建 PR，自动填充标题和描述

整个流程封装在 `handleCommitWithToken` 中，所有 API 调用都在浏览器端完成，不经过任何中间服务器。

---

> 本文档遵循 GFM 规范，可在任意 Markdown 渲染器中阅读。如需修改，请提交 PR 并确保 CI 通过。
