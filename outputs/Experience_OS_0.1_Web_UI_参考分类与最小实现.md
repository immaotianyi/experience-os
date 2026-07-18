# Experience OS 0.1 Web UI 参考分类与最小实现

## 1. 最小 Web UI 的目标

最小 Web UI 不是营销页，也不是纯展示页。它的目标是把 Experience OS 的中心功能可视化：

> 将 AI 协作过程中的非线性思想，自动转译为可验证、可复用、可审查的经验资产。

因此第一版 UI 必须优先展示真实工具链中的五类对象：

- `Human Review`：让人以线性方式审查系统建议。
- `WallHit`：让工程撞墙反馈反过来修正人的思想模型。
- `Skill`：观察自动生长的 Skill 是否分层、可验证、可降级。
- `ReuseContext`：确认下一轮任务是否能自动复用经验。
- `SelfIterationRun`：确认 Skill 自迭代实验是否健康运行。

## 2. 外部 UI 参考分类

### 2.1 21st.dev：组件市场与 Agent 检索层

21st.dev 的价值不是某一个具体组件，而是它把 UI 组件变成了 Agent 可搜索、可安装、可发布、可管理的资产库。它提供组件、模板、主题、CLI、MCP 与 AI 生成路径，重点在于让 Agent 在写 UI 前先检索真实参考。

对 Experience OS 的启发：

- UI 资产也应该进入 Vault，而不是散落在代码里。
- 后续可以将 `Skill`、`ReviewPacket`、`WorkflowPattern` 做成可搜索卡片。
- Agent 生成界面前应先查已有资产，降低重复造轮子。

### 2.2 React Bits：可复制的动效组件层

React Bits 的价值在于将动效拆成可复用组件与区块，例如文字动效、背景、卡片、列表、交互、3D、shader 等。它适合用于高辨识度页面，但也容易把产品做成“动效合集”。

对 Experience OS 的启发：

- 第一版只借鉴其“组件可复制、可变体化”的思想。
- 暂不引入大面积背景动效，避免干扰工具阅读。
- 后续适合用于状态变化、空状态、等待状态、记录进入/退出等轻量反馈。

### 2.3 Motion.dev：React 状态驱动动效层

Motion 的价值在于声明式、状态驱动、适合 React 的生产级动效模型。它适合让 UI 状态变化与组件生命周期绑定，例如进入、退出、布局变化、hover、tap、drag、scroll。

对 Experience OS 的启发：

- 当前零依赖版本先用 CSS transition 模拟最小状态动效。
- 等 UI 进入 React/Vite 版本后，优先用 Motion 处理视图切换、Review 状态、Skill 升级/降级、WallHit 进入反馈。
- 动效应表达状态变化，不做装饰性噪声。

### 2.4 GSAP Showcase：复杂编排与叙事动效层

GSAP 的价值在于强时间线、复杂编排、滚动、拖拽、形变等高级动画。Showcase 更像是“高表现力案例库”，适合品牌叙事与强视觉体验。

对 Experience OS 的启发：

- 当前产品是操作型工作台，不应先走高戏剧化动效。
- GSAP 后续适合用于“过程回放”：例如一次任务从发散、抽取、验证、撞墙、修复、入库的时间线动画。
- 复杂动画必须服务于可解释性，而不是替代可解释性。

### 2.5 BentoGrids：信息密度与层级布局层

BentoGrids 的价值在于以不等宽卡片组织多种信息：指标、说明、状态、图像、列表、行动入口。它天然适合 dashboard 的总览层。

对 Experience OS 的启发：

- 总览页使用 bento 组织四个闭环与核心资产。
- 卡片用于独立信息单元，避免卡片套卡片。
- 对操作型工具保持低装饰、高扫描效率。

### 2.6 vibe-motion：Prompt -> Code -> Motion 的工程化脚手架层

vibe-motion 的价值不只是动效，而是把自然语言、代码生成、动画脚手架、Agent skills、自动视频/动效工作流连接起来。它强调从 prompt 到代码再到可渲染结果。

对 Experience OS 的启发：

- 我们的 Skill 自迭代也应从自然语言意图进入工程脚手架，而不是停留在聊天层。
- UI 动效未来可以沉淀为 `MotionSkill`：包含触发条件、输入 Schema、输出资产、降级路径与人类审查。
- 自动化不能跳过验证，尤其是涉及生成视觉或生产代码时。

## 3. 当前最小实现

当前实现采用零依赖 Node HTTP server + 静态 HTML/CSS/JS：

- `src/webServer.js`：读取本地 `work/vaults`，提供 `/api/summary` 与各类 Vault endpoint。
- `apps/web/index.html`：最小工作台结构。
- `apps/web/styles.css`：工作台布局、bento 卡片、线性审查流、轻量状态动效。
- `apps/web/app.js`：读取 API，渲染总览、Human Review、WallHit、Skill、Vault。

第一版刻意不引入 React、Motion、GSAP：

- 降低依赖面，保证当前工程验证链路稳定。
- 先验证信息架构，而不是验证视觉库。
- 让 UI 直接读取真实 Vault 数据，避免 demo 假象。

## 4. 下一步 UI 演进顺序

1. 增加 Review 决策 API，让人可以在 UI 中确认、暂缓、驳回。
2. 增加 WallHit 修复入口，让撞墙记录能生成下一步修复任务。
3. 增加 Skill 详情页，展示 trigger、schema、fallback、memory utility、来源轨迹。
4. 进入 React/Vite 版本后再引入 Motion，优先做状态变化与过程回放。
5. 将 UI 组件与动效也纳入 Vault，形成 Experience OS 自己的 UI Skill 库。
