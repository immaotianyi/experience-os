# Experience OS 0.1 纲领与产品定义

## 0. 一句话定义

Experience OS 是一套面向 AI 协作时代的自动经验资产化系统。

它不把 AI 当成一次性回答机器，而是把每一次项目、对话、修改、失败、判断和成果，自动转化为可复用的制品、规则、模板、记忆与工具，使人的经验能够持续积累，并在下一次任务中被自动调用。

它的产品灵魂是：

> 你只管自然工作，系统在背后长出工具。

## 1. 核心问题

当前大多数 AI 产品的问题，不是模型不够聪明，而是经验无法积累。

一次对话结束后，真正有价值的内容往往散落在聊天记录里：

- 用户为什么否定某个方案；
- 哪些表达被认为空泛；
- 哪些结构以后可以复用；
- 哪些错误下次必须避免；
- 哪些流程可以变成工具；
- 哪些项目经验可以沉淀为模板；
- 哪些业务判断可以变成规则。

如果这些东西不能被系统自动提取、整理、复用，那么 AI 每次都会像一个“临时实习生”一样重新开始。

Experience OS 要解决的核心问题是：

> 如何让 AI 协作过程中的人类经验不再流失，而是自动变成下一次工作的资产。

第二个核心问题是：

> 如何让 AI 不是要求人去适应工具，而是让工具逐步适应人的生产过程、表达习惯和判断方式。

## 2. 第一性原理

### 2.1 经验优先于回答

AI 的单次回答不是最终资产。真正的资产是回答背后被验证过的经验。

一个好答案如果不能复用，它只是一次消耗；一个被沉淀的判断规则，才会成为系统能力。

### 2.2 项目优先于聊天

聊天是线性的，项目是结构化的。

Experience OS 不应该以“聊天窗口”为中心，而应该以“项目”为中心。每一次 AI 协作都应该落在某个项目、任务、制品或工具上。

### 2.3 制品优先于记录

聊天记录太长、太散、太难复用。

系统应该把过程转化为制品，例如：

- 项目说明书；
- PRD；
- 架构草图；
- Prompt 模板；
- 代码脚手架；
- 复盘报告；
- 错误模式库；
- 可调用 Skill；
- 决策记录。

### 2.4 脚手架优先于生成

AI 编程和 AI 产出不能依靠自由发挥。

人要先定义结构、边界、规则、Schema、验收标准和降级方案，然后让 AI 在脚手架里填充。

这对应你的 3D 打印类比：

- 传统开发像 FDM 3D 打印，程序员一层一层堆；
- AI 协作像搭好脚手架后浇筑，AI 负责填充，人负责结构和验收。

### 2.5 辩证优先于赞同

AI 不应该只顺着用户说。

系统必须保留“否定之否定”的机制：

1. 生成方案；
2. 批判方案；
3. 暴露风险；
4. 修正方案；
5. 人类确认；
6. 沉淀经验。

辩证不是文风，而是质量控制机制。

### 2.6 降维优先于堆叠

WPS/Word 的本质，是把复杂的底层代码降维成可操作的 2D 界面。

AI 时代也一样。模型、向量、Agent、工具调用、上下文、记忆都是高维底层，人需要一个可视化、可编辑、可确认的操作界面来统筹它们。

Experience OS 的 UI 不应该只是聊天框，而应该是经验、制品、项目和工具的工作台。

### 2.7 自动优先于手动

产品的目的之一，是顺应人的惰性，把高价值动作压缩成低成本动作。

Word/WPS 的价值不在于让人学习排版代码，而在于把复杂排版变成按钮、样式、模板和快捷键。Ctrl+C、Ctrl+V、自动编号、标题样式、目录生成，本质上都是把高门槛动作压缩成低门槛动作。

Experience OS 也必须遵守同一条产品规律：

- 不要求用户手动创建 Skill；
- 不要求用户手动分类经验；
- 不要求用户手动搜索过去资产；
- 不要求用户手动判断该调用哪个工具；
- 不要求用户每次重新喂上下文。

系统应该观察用户的自然工作过程，自动识别重复动作、稳定偏好、可复用结构和可工具化流程。

### 2.8 个人适配优先于通用 Skill

Skill 不是孤立工具，而是依赖人的生产过程、语言习惯、表达偏好、项目上下文和审美判断。

张三分享的 Skill 可以成为参考，但它不天然适合李四。因为在 AI 协作时代，生产过程不再只是“人操作机器”，而是“人和 AI 两个不完全透明的主体互相交流”。

传统 Word 模板之所以可以高度通用，是因为机器是线性的、确定的，变量主要在人身上。AI 协作不同：人是非线性的，AI 也是近似黑箱的、生成式的、会受上下文影响的。因此真正高效的 Skill 必须逐步适配个人，而不是只靠市场下载。

Experience OS 的目标不是拥有最多公共 Skill，而是让每个人的 Skill 越用越贴合自己。

## 3. 产品中心功能

Experience OS 的中心功能不是聊天，不是知识库，也不是 Agent 商店。

它的中心功能是：

> 自动把项目过程中的有效经验转化为可复用资产。

更短地说：

> 自动经验资产化。

所有模块都必须服务于这个中心：

- 对话服务于提取经验；
- 文档服务于固化经验；
- 记忆服务于调用经验；
- Skill 服务于工具化经验；
- UI 服务于修改和确认经验；
- Schema 服务于约束 AI 填充；
- 审查服务于保护经验资产；
- 复盘服务于让经验继续进化。

如果某个功能不能帮助经验自动沉淀、自动复用、自动工具化或自动适配个人，它就不是 0.1 版本的核心功能。

Experience OS 与传统 Skill 产品的根本区别是：

| 类型 | 用户负担 | 产品逻辑 |
|---|---:|---|
| 传统 Skill 产品 | 手动创建、手动找、手动调用 | 人管理工具 |
| 普通知识库产品 | 手动整理、手动分类、手动检索 | 人管理知识 |
| 普通 AI 聊天产品 | 手动喂上下文、手动复述偏好 | 人管理 AI |
| Experience OS | 系统观察、提炼、推荐、调用、适配 | 工具适应人 |

## 4. 协作-生产双层模型

Experience OS 必须区分两个空间：

1. 协作空间；
2. 生产通道。

这两个空间使用不同法则。

协作空间负责让人的思想被 AI 读取、理解、延伸和适配。它应该开放、弹性、允许发散。

生产通道负责把协作结果变成真实可用的制品、代码、工具和系统。它必须受限、结构化、可验证、可回滚。

### 4.1 协作空间：开放、适配、长出 Skill

协作空间发生在人与 AI 的交流过程中：

- 人用自然语言表达想法；
- AI 读取人的思想；
- 人通过修改、否定、补充来调整 AI；
- 系统观察这些交流和修改；
- 系统自动提炼偏好、规则、模板和 Skill。

这一层的目标不是立刻产出工程结果，而是让 AI 越来越懂这个人如何思考、如何表达、如何判断、如何生产。

协作空间应该允许：

- 发散；
- 辩证；
- 类比；
- 追问；
- 试错；
- 个人化；
- 自动提炼 Skill；
- 自动更新适配库。

协作空间的核心问题是：

> 系统如何越来越懂这个人？

### 4.2 生产通道：受限、结构化、验证工程

生产通道发生在 AI 开始生成可交付结果时：

- 代码；
- 架构；
- PRD；
- 接口；
- 数据结构；
- Skill 实现；
- 部署方案；
- 安全策略；
- 测试用例；
- 可运行工具。

这一层不能任由 AI 自由发挥。

生产通道必须具备清晰的“墙壁”：

- 产品架构；
- 技术栈选择；
- 目录结构；
- Schema；
- 类型约束；
- 权限边界；
- 错误处理；
- 防御性编程；
- 降级方案；
- 测试与验收；
- 日志与追踪；
- 安全与隐私；
- 部署约束。

生产通道的核心问题是：

> 这个东西能不能真实运行、稳定复用、安全交付？

### 4.3 工程是协作的验证环节

协作空间可以产生很多想法、Skill、规则和模板，但它们只有进入生产通道后，才会被验证。

工程不是协作的附属品，而是协作结果的现实检验。

一个 Skill 在聊天里听起来有用，不代表它在工程里可用。它必须经过：

- 输入是否清楚；
- 输出是否结构化；
- 边界是否明确；
- 错误是否可处理；
- 权限是否安全；
- 失败是否可降级；
- 用户是否能理解反馈；
- 是否能在项目中稳定复用。

只有通过这些检查，Skill 才能从“想法”升级为“工具”。

### 4.4 撞墙反馈：AI 必须把工程约束反馈给人

生产通道中的墙壁不是为了惩罚 AI，而是为了产生反馈。

当 AI 撞到工程墙壁时，不能只在内部失败，也不能假装成功。它必须把问题反馈给人。

例如：

- “这个 Skill 的输入不稳定，无法形成 Schema。”
- “当前需求缺少验收标准，不能进入生产。”
- “这个设计会导致敏感数据外发，需要改成私有化处理。”
- “这个工具调用失败率高，建议先做降级路径。”
- “当前技术栈不适合这个性能目标。”
- “这个功能在协作层成立，但在工程层不可复用。”

这种反馈有两个作用：

1. 让 AI 修正生产路径；
2. 让人修正自己的思想模型。

这很关键：工程反馈不仅训练 AI，也训练人。

### 4.5 迷宫与墙壁

可以把 Experience OS 理解为一个迷宫。

协作空间允许人和 AI 在迷宫上方讨论方向、战略、可能性和 Skill。

生产通道则是迷宫内部真实可走的路径。

墙壁代表工程约束：

- 类型；
- 架构；
- 权限；
- 安全；
- 性能；
- 成本；
- 可维护性；
- 可测试性；
- 可部署性。

AI 如果撞墙，必须告诉人撞到了哪堵墙，为什么撞墙，如何绕路，是否需要重新定义目标。

这样，人不会停留在空想里，AI 也不会停留在幻觉里。

### 4.6 双层流转

Experience OS 的完整流转应是：

```text
协作空间
  -> 人提出想法
  -> AI 理解、延伸、辩证
  -> 系统提炼潜在经验和 Skill
  -> 进入生产通道
  -> 架构/Schema/安全/测试/部署约束验证
  -> 撞墙则反馈给人
  -> 人调整思想或目标
  -> AI 修正实现路径
  -> 形成可用制品
  -> 反向沉淀经验
```

这说明 Experience OS 不是单向生成系统，而是一个双向修正系统。

协作让思想变丰富，生产让思想变真实。

### 4.7 双漏斗模型：发散漏斗与验证漏斗

协作-生产双层模型可以进一步具象化为“双漏斗模型”。

第一只漏斗是发散漏斗。

它发生在写作、构想、讨论、产品设想、Skill 萌芽阶段。这里允许更高温度、更大胆的联想、更开放的类比和更多候选方案。

这一阶段的目标不是立刻判断能不能做，而是尽可能产生足够丰富的候选：

- 新话题；
- 新 Skill；
- 新产品形态；
- 新工作流；
- 新交互方式；
- 新写作风格；
- 新自动化场景；
- 新架构假设。

第二只漏斗是验证漏斗。

它发生在生产、开发、交付、部署、工具化阶段。这里必须降低温度，进入结构化脚手架，通过工程约束验证前面发散出来的东西。

这一阶段的目标不是继续想更多，而是严格判断：

- 能不能定义输入；
- 能不能定义输出；
- 能不能写成 Schema；
- 能不能接入现有架构；
- 能不能测试；
- 能不能降级；
- 能不能保护数据；
- 能不能被用户理解；
- 能不能稳定复用。

双漏斗的完整形态是：

```text
发散漏斗
  高温度
  多候选
  大胆设想
  写作/讨论/协作/Skill 萌芽
        ↓
验证漏斗
  低温度
  强约束
  Schema/架构/测试/安全/部署
        ↓
可落地制品 / 可运行工具 / 稳定 Skill
```

它的价值在于：

> 前半段保证创意性，后半段保证可落地性。

如果只有发散漏斗，系统会变成空想机器。

如果只有验证漏斗，系统会变成僵硬的工程流水线。

Experience OS 必须同时保留两者：先让想法充分生长，再让工程严格筛选。

### 4.8 不同阶段使用不同温度

AI 在不同阶段应该使用不同的生成策略。

协作/写作/构想阶段：

- 温度可以更高；
- 允许多方案；
- 允许类比和隐喻；
- 允许不成熟想法；
- 允许提出反直觉方向；
- 允许 Skill 草案快速萌芽。

生产/开发/交付阶段：

- 温度必须降低；
- 输出必须结构化；
- 必须遵守 Schema；
- 必须给出边界；
- 必须显式处理错误；
- 必须说明降级路径；
- 必须接受测试与验收。

这不是矛盾，而是分工。

高温负责探索可能性，低温负责把可能性变成可靠现实。

### 4.9 辩证看待双漏斗

双漏斗模型成立，但不能被绝对化。

正题：

> 发散阶段需要自由，生产阶段需要约束。

反题：

> 如果发散完全不受限制，会产生大量无价值噪音；如果生产完全只看约束，会把真正有价值的新想法提前杀死。

合题：

> 发散阶段要保留轻约束，生产阶段要保留解释性弹性。

因此，Experience OS 不应该让两个漏斗完全割裂。

发散阶段也需要最小边界：

- 不脱离产品中心功能；
- 不制造无法验证的空概念；
- 不忽略用户真实惰性；
- 不把 Skill 当成纯概念；
- 不把所有想法都自动升级为工具。

生产阶段也需要保留创造空间：

- 允许提出替代架构；
- 允许指出当前脚手架不合理；
- 允许建议重新定义目标；
- 允许把撞墙结果反向变成新想法；
- 允许人类决定是否突破某些旧约束。

真正成熟的系统不是“发散后机械验证”，而是：

```text
发散产生候选
  -> 验证筛选候选
  -> 撞墙产生反馈
  -> 反馈修正思想
  -> 思想再次发散
  -> 再次验证
```

这就是 Experience OS 的创意-工程循环。

### 4.10 具象例子：一个 Skill 如何通过双漏斗

假设用户在多个项目中反复要求 AI：

“把这段想法整理成有中心功能、第一性原理、最小闭环和工程验证的产品定义。”

在发散漏斗中，系统可以大胆生成候选 Skill：

- 产品中心功能提炼 Skill；
- 第一性原理拆解 Skill；
- 双漏斗验证 Skill；
- PRD 骨架生成 Skill；
- 撞墙反馈生成 Skill。

这些 Skill 草案先不急着进入工具库。

进入验证漏斗后，系统必须逐个检查：

- 这个 Skill 的触发条件是什么？
- 输入需要哪些字段？
- 输出结构是否稳定？
- 与已有 Skill 是否重复？
- 是否需要人类确认？
- 失败时怎么降级？
- 是否会错误理解用户思想？
- 生成结果如何被用户修改和评价？

通过验证后，它才可以成为稳定 Skill。

否则，它只能留在草案区、模板区或灵感区。

## 5. 最小闭环

Experience OS 0.1 必须先跑通一个最小闭环：

```text
创建项目
  -> 输入目标与约束
  -> AI 生成初版制品
  -> 系统进行辩证审查
  -> 人类修改和确认
  -> 系统提取经验
  -> 存入经验库/制品库/规则库
  -> 新项目自动调用
  -> 使用反馈继续修正个人适配
```

这个闭环成立，系统就有生命。

否则，再多 Agent、插件、模型和 UI 都只是堆料。

## 6. 五大核心资产库

### 6.1 Project Vault：项目库

保存每一次项目的结构化信息：

- 项目目标；
- 背景材料；
- 输入约束；
- 关键过程；
- 最终交付物；
- 决策记录；
- 人类修改；
- 复盘结论。

项目库回答的问题是：

> 我们以前做过什么？

### 6.2 Artifact Vault：制品库

保存项目中真正可复用的产物：

- PRD；
- SOP；
- 架构文档；
- Prompt；
- 模板；
- UI 原型；
- 代码脚手架；
- 分析报告；
- 检查清单。

制品库回答的问题是：

> 哪些成果可以直接拿来改？

### 6.3 Rule Vault：规则库

保存从项目中抽象出来的判断规则：

- 不要再使用某类空泛表达；
- 某类项目必须先定义验收标准；
- 涉及敏感数据必须先脱敏；
- 生成代码前必须先定义目录结构；
- 输出 PRD 时必须包含边界条件和降级方案。

规则库回答的问题是：

> 下次遇到类似情况，系统应该遵守什么？

### 6.4 Skill Vault：工具库

把高频经验工具化，并区分公共 Skill、个人 Skill 与项目 Skill：

- 文档解析 Skill；
- 项目复盘 Skill；
- Prompt 提炼 Skill；
- 架构审查 Skill；
- 安全检查 Skill；
- PRD 生成 Skill；
- 代码脚手架生成 Skill；
- 错误模式检测 Skill。

工具库回答的问题是：

> 哪些经验已经可以变成可调用能力？

Skill Vault 不能只是“商店”，更应该是“生长系统”：

- 公共 Skill：别人分享的通用能力，可以下载、参考、改造；
- 个人 Skill：从个人长期工作习惯里长出来的能力；
- 项目 Skill：从某个项目中临时形成，经过验证后可升级为个人 Skill；
- 组织 Skill：多人反复验证后沉淀为团队或公司能力。

Skill 的生命周期应该是：

```text
重复行为
  -> 系统识别
  -> 建议沉淀
  -> 人类确认
  -> 生成 Skill 草案
  -> 小范围试用
  -> 根据反馈修正
  -> 升级为稳定 Skill
```

### 6.5 Memory Vault：记忆库

保存偏好、背景、实体、术语和长期上下文：

- 用户偏好；
- 常用概念；
- 项目关系；
- 重要人物或组织；
- 反复出现的问题；
- 长期目标。

记忆库回答的问题是：

> 系统应该长期记住什么？

记忆库还必须支持“个人适配”：

- 记住用户喜欢的表达密度；
- 记住用户讨厌的空泛话术；
- 记住用户常用的产品类比；
- 记住用户对结构、深度、语气和证据的偏好；
- 记住用户过去否定过的方向；
- 记住哪些 Skill 在此人身上有效，哪些无效。

这不是为了让 AI 显得亲密，而是为了让系统越用越精。

### 6.6 Adaptation Vault：适配库

保存系统对“这个人如何工作”的持续理解。

它不同于普通记忆。普通记忆回答“用户说过什么”，适配库回答“用户如何生产”。

适配库保存：

- 写作风格；
- 思考路径；
- 修改习惯；
- 证据偏好；
- 常见犹豫点；
- 常见否定原因；
- 常用隐喻体系；
- 常用工作流；
- Skill 调用成功率；
- 不同场景下的输出偏好。

适配库回答的问题是：

> 系统如何越来越适合这个人？

## 7. 系统角色

Experience OS 不是一个单 Agent，而是一组角色协作。

### 7.1 Builder：生成者

负责根据项目目标生成初版制品。

### 7.2 Critic：批判者

负责找漏洞、找空话、找风险、找未验证假设。

### 7.3 Extractor：提炼者

负责从项目过程里提取规则、模板、错误模式和可复用结构。

### 7.4 Librarian：归档者

负责把制品、规则、记忆、项目记录放入正确资产库。

### 7.5 Router：调度者

负责判断当前任务应该调用哪个 Skill、哪类记忆、哪种审查强度。

### 7.6 Guardian：守门者

负责权限、隐私、脱敏、安全等级和输出边界。

### 7.7 Adaptor：适配者

负责观察用户的长期行为变化，更新个人偏好、工作流、Skill 排序和输出策略。

Adaptor 不直接替用户决定，而是提出“我观察到你经常这样修改，是否将其沉淀为规则或 Skill？”这样的低打扰建议。

## 8. 0.1 产品形态

Experience OS 0.1 不需要一开始做成复杂平台。

最小产品可以只有四个界面：

### 8.1 项目创建页

让用户输入：

- 项目名称；
- 项目目标；
- 背景资料；
- 期望交付物；
- 约束条件；
- 验收标准。

### 8.2 项目工作台

展示：

- 当前任务；
- AI 生成的制品；
- 人类修改区；
- 审查意见；
- 相关记忆；
- 可调用 Skill。

### 8.3 复盘沉淀页

项目阶段结束或完成时，系统自动生成：

- 本项目做成了什么；
- 哪些内容可复用；
- 哪些错误要避免；
- 哪些规则应加入规则库；
- 哪些内容应变成模板或 Skill。

### 8.4 资产库页面

用户可以查看和管理：

- 项目；
- 制品；
- 规则；
- Skill；
- 记忆。

### 8.5 自动建议层

自动建议层不是单独页面，而是贯穿整个产品的轻提示机制。

当系统观察到重复模式时，应该给出轻量建议：

- “你连续 3 次把这类回答改成同一种结构，是否保存为模板？”
- “这个流程本周出现了 5 次，是否生成一个 Skill 草案？”
- “你每次都删除这类开头，是否加入写作规则？”
- “这个项目和上次项目高度相似，是否加载上次的复盘经验？”

用户不应该被迫管理系统，但应该随时拥有确认、拒绝、编辑和删除的权力。

## 9. 工程脚手架原则

### 9.1 Schema 约束

所有 AI 输出进入系统前，都必须通过结构化 Schema。

例如：

- Project Schema；
- Artifact Schema；
- Rule Schema；
- Skill Schema；
- Memory Schema；
- Review Schema。

AI 可以填内容，但不能随意改变结构。

### 9.2 防御性编程

系统必须默认 AI 会失败：

- 模型会超时；
- JSON 会格式错误；
- 工具调用会失败；
- 检索会为空；
- 生成内容会跑偏；
- 用户输入会模糊。

因此必须提供：

- 重试；
- 降级；
- 错误提示；
- 人类接管；
- 日志追踪；
- 回滚机制。

### 9.3 优雅降级

当高级能力失败时，系统不能崩。

降级路径：

```text
生成式 UI 失败 -> Markdown 展示
结构化输出失败 -> 请求模型修正
模型修正失败 -> 人类手动编辑
工具调用失败 -> 输出原因与替代路径
记忆检索失败 -> 明确声明未检索到
```

### 9.4 安全与隐私

经验资产本身也是资产，必须保护。

基本原则：

- 敏感信息默认不进入长期记忆；
- 外发模型调用前必须脱敏；
- 每个 Skill 必须声明权限等级；
- 每次工具调用必须有日志；
- 高风险操作必须人类确认；
- 默认最小权限。

### 9.5 人类最高优先级

当系统经验与人类当下判断冲突时，人类判断优先。

但系统必须记录这次冲突，并询问是否更新规则库。

### 9.6 自动化必须可解释

自动化不是黑箱替人做决定。

系统自动调用 Skill、推荐模板、更新规则或引用记忆时，必须能解释：

- 为什么触发；
- 用了哪些记忆；
- 参考了哪些项目；
- 调用了哪个 Skill；
- 置信度是多少；
- 用户如何关闭或修改。

越自动，越要可控。

### 9.7 撞墙反馈必须显性化

生产通道里的失败不能被吞掉。

当 AI 受到架构、Schema、安全、权限、性能、部署、测试等约束而无法继续时，必须输出撞墙反馈：

- 撞到了哪类墙；
- 为什么撞墙；
- 当前方案哪里不成立；
- 可选绕路方案；
- 需要人补充什么信息；
- 是否应该更新规则库或项目目标。

撞墙反馈必须同时服务于 AI 修正和人类认知修正。

### 9.8 母 Skill 必须站在防火墙后面

母 Skill 是经验路由核心，不能依赖模型自觉遵守流程。

它必须经过：

- Trigger Firewall：确保正确时间触发；
- Content Firewall：确保输入内容相关、脱敏、带证据；
- Output Schema Firewall：确保输出结构正确；
- Policy Firewall：确保内部/外部分流符合规则；
- Permission Guard：确保高风险更新需要人类确认；
- Merge Firewall：确保子 Skill 反馈合并前不冲突、不污染；
- Audit Logger：确保每次触发、分流、合并、拒绝都可追踪。

母 Skill 的职责是调度、路由、生成提案，而不是直接修改稳定资产。

### 9.9 母 Skill 必须有降级策略

母 Skill 一旦异常，不能让系统失去分流能力。

降级等级：

```text
L0 正常模式：自动判断、分流、合并反馈
L1 保守模式：只观察和记录，不自动分流
L2 规则模式：不用 LLM，只用固定 policy 路由
L3 手动模式：生成候选，由人选择 internal / external / both
L4 停机保护：禁止迭代，只允许读取历史版本和回滚
```

最坏情况下，母 Skill 必须退回规则系统，而不是退回“让模型随便判断”。

### 9.10 母 Skill 必须留存 Git 库

母 Skill 是系统大脑，必须像代码一样被版本管理。

至少需要版本化：

- system instructions；
- trigger policy；
- routing policy；
- permission policy；
- prompt templates；
- output schemas；
- child skill registry；
- degradation policy；
- rollback policy；
- eval cases；
- changelog。

母 Skill 不允许在线直接覆盖旧版本。每次迭代都必须产生提案、diff、测试和版本记录。

### 9.11 母 Skill 必须可回退

母 Skill 的每次迭代都必须带着回家的路。

回退能力包括：

- 快照；
- stable tag；
- rollback proposal；
- git revert；
- 局部回退；
- shadow mode；
- dry run；
- canary；
- regression eval；
- negative memory。

失败版本不能直接删除，而要沉淀为反例经验。

这条原则非常重要：

> 母 Skill 可以进化，但不能不可逆。

## 10. 与外部思想的关系

Experience OS 可以吸收外部思想，但不能被外部名词牵着走。

### 10.1 Andrew Ng 的 Agentic Workflow

Reflection、Tool Use、Planning、Multi-agent 都是 Experience OS 的执行机制。

但 Experience OS 更进一步：

> 不只让 Agent 做得更好，还要让 Agent 的做法被沉淀。

### 10.2 LangChain 的 Cognitive Architecture

Cognitive Architecture 说明系统不只是 Prompt，而是思考流程、状态、工具和控制逻辑。

Experience OS 的脚手架就是一种认知架构。

### 10.3 Anthropic Artifacts

Artifacts 说明对话要变成可编辑制品。

Experience OS 更进一步：

> 制品不仅要可编辑，还要可归档、可复用、可提炼为规则和 Skill。

### 10.4 MCP

MCP 提供工具连接协议。

Experience OS 应该把 Skill Vault 设计成可插拔工具层，使经验最终能变成可调用能力。

### 10.5 Structured Outputs

结构化输出是防止 AI 乱填的核心工程手段。

Experience OS 中所有关键对象都应该 Schema 化。

### 10.6 Reflexion

Reflexion 说明语言反馈可以成为 Agent 的经验。

Experience OS 应该把每次失败、批判、修改、确认都转成可检索的反思记忆。

### 10.7 Apple Shortcuts：低门槛自动化

Apple Shortcuts 的启发是，复杂动作可以被拆成 action，再被组合成 shortcut。它降低了自动化门槛，但仍然主要依赖用户手动创建、查找、组合。

Experience OS 应该继承“动作组合”的思想，但进一步自动化：

> 不是让用户从零搭快捷指令，而是从用户反复做的项目过程中自动长出快捷指令。

### 10.8 Programming by Demonstration：通过行为教会系统

Programming by Demonstration / Programming by Example 的核心思想是，用户不写程序，而是通过示范动作让系统学习可复用流程。

Experience OS 与它高度相似，但对象从“界面动作”扩展为“AI 协作过程”：

- 用户如何改 AI 的回答；
- 用户如何重组结构；
- 用户如何否定某类表达；
- 用户如何完成项目；
- 用户如何验收结果。

系统应从这些行为中学习，而不是要求用户手动写规则。

### 10.9 SECI 与隐性知识管理

Nonaka-Takeuchi 的 SECI 模型强调隐性知识与显性知识之间的转化。

Experience OS 可以理解为 AI 时代的个人 SECI 引擎：

```text
隐性经验
  -> 工作过程外化
  -> 系统提炼为规则/制品/Skill
  -> 在新项目中组合调用
  -> 用户再次内化为更强能力
```

它真正处理的不是普通文件管理，而是隐性经验的自动显性化。

### 10.10 ChatGPT Memory：自动记忆与用户控制

ChatGPT Memory 的启发是，系统可以自动从对话中记住有用上下文，并让用户查看、修改、删除。它证明“自动记忆 + 用户控制”是必要方向。

Experience OS 要更进一步：

> 不只记住用户偏好，还要记住项目过程、修改动作、Skill 成败和经验演化。

### 10.11 Adaptive UI：界面也应适配人

自适应界面的研究强调，系统可以根据用户行为调整布局、内容优先级和交互方式。

Experience OS 的适配不应只发生在回答内容上，也应发生在界面和工作流上：

- 常用 Skill 自动前置；
- 常用模板自动浮现；
- 常见项目类型自动预填；
- 用户不看的面板自动弱化；
- 高价值复盘提示自动出现。

### 10.12 DevForge：工程化训练与真实拦截

DevForge 的价值在于，它不是只讲工程化，而是把工程化变成真实可运行、可拦截、可修复的训练场。

它提供了几个对 Experience OS 很重要的验证点：

- All-in-One 单体仓库：文档、源码、CI、规范同仓共存；
- 三类资产模型：拦截层、法典层、源码层职责分明；
- 物理拦截 vs 知识呈现：CI 负责阻断，文档负责解释；
- 漏斗式导航：L1/L2/L3 逐层收敛，避免入口信息过载；
- 结构化错误输出：失败时直接指向规则和排查指南；
- AI 工程化规范：Provider 抽象、多 Agent 消息协议、工具调用确认、输入校验、输出过滤、降级提示。

这能强化 Experience OS 的生产通道：

> 用生产通道拦截幻觉，用 WallHit 解释原因，用项目闭环验证 Skill。

DevForge 也提醒我们：真正的工程化不是“写一份规范”，而是让规范能够拦截错误、解释错误、引导修复。

### 10.13 自动 Skill 库研究：Skill 应该分层、可组合、可验证

AutoSkills、Voyager、BOSS、SkillCenter 等研究都指向一个共同结论：Agent 能力的长期增长，不来自一次性 Prompt，而来自持续增长、可组合、可复用的 Skill Library。

这些研究对 Experience OS 的补强是：

- Skill 不应该是平铺列表，而应分层；
- Skill 必须有来源证据；
- Skill 必须经过质量门；
- Skill 必须可检索、可组合、可复用；
- Skill 的失败和成功都应反向更新 Skill Library。

因此，Experience OS 的 Skill Vault 应区分：

```text
Strategic Skill  战略级：决定方向和调度，例如母 Skill
Functional Skill 功能级：完成一类工作流，例如 PRD 生成、代码审查
Atomic Skill     原子级：可执行动作，例如 lint、检索、摘要、格式转换
```

母 Skill 不是普通 Skill，而是战略级 Skill。

### 10.14 个性化 Agent 研究：偏好是“假设”，不是永久结论

PAHF、RUMS、MemoryArena 等研究说明：个性化不是简单保存用户说过的话，而是要持续判断哪些记忆真的改善了后续任务表现。

这对内部子 Skill 很重要。

Experience OS 不应把一次用户偏好直接固化为长期规则，而应形成：

```text
PreferenceHypothesis
  -> evidence
  -> confidence
  -> drift detection
  -> promotion / rollback
```

也就是说，偏好要有证据、有置信度、有漂移检测、有回退。

记忆也不能只按相似度检索，还要记录“是否真的有用”：

- memory_relevance_score；
- memory_response_utility；
- memory_last_success；
- memory_value_score；
- memory_used_in_task。

### 10.15 Programming by Demonstration：先分段，再生成 Skill

通过示范学习的研究提醒我们：用户行为日志不能直接变 Skill。真实行为往往混杂、跳跃、不完整，必须先切分为子目标。

Experience OS 应采用：

```text
HumanEditLog
  -> SubgoalSegment
  -> WorkflowPattern
  -> SkillCandidate
  -> ProductionValidation
```

这可以防止系统把噪音、偶然操作或短期偏好误学成稳定 Skill。

### 10.16 Reflexion 与 SWE-agent：失败轨迹必须可重放

Reflexion 说明失败可以转成语言记忆，SWE-agent 的 trajectory 机制说明一次 Agent 运行必须可记录、可检查、可回放。

Experience OS 应把每一次母 Skill 路由保存为可重放轨迹：

```text
MotherSkillTrajectory
  -> trigger event
  -> context slice
  -> routing decision
  -> child skill outputs
  -> wall hits
  -> human review
  -> final commit / rollback
```

这能回答一个关键问题：

> 当时系统为什么把这条经验分给 internal、external 或 both？

### 10.17 研究校准后的独特组合

这些研究分别覆盖自动 Skill、个性化记忆、行为示范、失败反思、轨迹留存和工程评测。

Experience OS 的独特组合是：

```text
自动经验资产化
  + 母 Skill 路由
  + 内部个人化
  + 外部 DevForge 验证
  + 工程防火墙
  + Git 版本化
  + 降级与回退
```

因此，我们不是单纯复刻某个研究方向，而是在把这些方向组合成一个可落地的产品与工程系统。

## 11. 版本演化路径

### 11.1 0.1：能沉淀

目标：

- 创建项目；
- 生成制品；
- 人类修改；
- 自动复盘；
- 提取规则；
- 下次复用；
- 记录个人修改偏好。

判断标准：

> 系统能否从一次真实项目中沉淀出 3 条可复用经验。

### 11.2 0.2：能复用

目标：

- 新项目自动检索旧项目；
- 自动推荐模板；
- 自动加载相关规则；
- 自动提示过去错误。

判断标准：

> 新项目是否明显少走弯路。

### 11.3 0.3：能工具化

目标：

- 高频流程自动建议变成 Skill；
- Skill 可注册、调用、审查；
- 人类可以组合 Skill 完成项目；
- 系统可以按个人习惯排序 Skill。

判断标准：

> 系统是否能把一个重复流程变成可调用工具。

### 11.4 0.4：能协作

目标：

- 多 Agent 角色协作；
- Builder、Critic、Extractor、Guardian 分工明确；
- 项目过程有状态机。

判断标准：

> 系统是否能稳定完成生成、审查、提炼、归档闭环。

### 11.5 1.0：经验操作系统

目标：

- 项目、制品、规则、Skill、记忆形成飞轮；
- 每次使用都增强系统；
- 用户的个人方法论被系统承托；
- 系统越用越贴合个人工作方式。

判断标准：

> 系统是否真的比一个新 AI 更懂用户、更懂项目、更懂过去经验。

## 12. 最重要的边界

Experience OS 不追求一开始无所不能。

它的 0.1 版本只追求一件事：

> 让一次 AI 协作结束后，不再只剩聊天记录，而是留下可复用资产。

只要这个成立，体系就能继续长。

## 13. 0.1 开工清单

第一阶段只需要定义 6 个对象：

```text
Project   项目
Artifact  制品
Rule      规则
Memory    记忆
Skill     工具
Review    审查
```

每个对象都需要：

- 字段定义；
- 示例；
- 创建方式；
- 更新方式；
- 复用方式；
- 与其他对象的关系。

第二阶段只需要跑通 3 个动作：

```text
生成制品
提炼经验
复用经验
```

第三阶段再考虑：

- 前端 UI；
- Skill 插件；
- 多 Agent；
- 权限系统；
- 私有化部署；
- 高级可视化。

## 14. 工程映射：从非线性思想到线性系统

Experience OS 必须解决一个根本问题：

> 如何把人的非线性思想，无失真地转移成 AI 和工程系统可以执行的线性结构。

人是非线性的。人的想法会跳跃、类比、反复、修正、否定、突然联想到别处。

AI 和软件系统需要线性结构。它们需要状态、对象、字段、流程、接口、约束、日志和结果。

因此，Experience OS 的工程本质是：

> 建立一套从非线性思想到线性工程的转换器。

### 14.1 云端 LLM 的四类约束

无论接入哪个云端 LLM，对它的约束主要来自四类：

1. System Instructions；
2. Rules；
3. Prompts；
4. Skills / Tools。

这四类约束在工程里不能混在一起。

它们应该被拆成不同对象：

| 约束类型 | 作用 | 工程形态 |
|---|---|---|
| System Instructions | 定义身份、边界、最高原则 | `system_profile` / `agent_policy` |
| Rules | 定义必须遵守的判断规则 | `Rule` 对象 / policy engine |
| Prompts | 定义具体任务的输入模板 | `PromptTemplate` / prompt compiler |
| Skills / Tools | 定义可调用能力 | `Skill` / tool registry / MCP server |

真正的系统不是把这些写成一大段 Prompt，而是把它们结构化、版本化、可检索、可组合。

### 14.2 代码层的核心对象

0.1 版本至少需要这些核心对象：

```text
Project
ConversationEvent
ThoughtFragment
Artifact
Rule
PromptTemplate
Skill
Review
WallHit
Memory
AdaptationProfile
```

它们分别承担：

- `Project`：承载一次任务或产品过程；
- `ConversationEvent`：记录人和 AI 的交流片段；
- `ThoughtFragment`：从交流中提取出的思想片段；
- `Artifact`：固化出来的文档、代码、PRD、图表、模板；
- `Rule`：从过程里沉淀出的约束；
- `PromptTemplate`：可复用的任务提示结构；
- `Skill`：可调用的工具化能力；
- `Review`：批判、审查、验证结果；
- `WallHit`：撞墙反馈；
- `Memory`：长期上下文和事实；
- `AdaptationProfile`：这个人如何工作、表达、判断。

### 14.3 最小数据结构示例

一个 `Skill` 不应该只是名字和描述，而应该包含触发条件、输入输出、权限、失败处理和适配记录。

```json
{
  "id": "skill.product_center_extractor",
  "name": "产品中心功能提炼",
  "origin": "derived_from_user_workflow",
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

一个 `WallHit` 必须让人看懂 AI 为什么过不去：

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

这就是思想转工程的关键：不是让 AI 说“我不行”，而是让它指出卡在哪个结构上。

### 14.4 状态机：系统如何线性运行

Experience OS 的核心不是聊天流，而是项目状态机。

最小状态机如下：

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

每个状态都有明确职责：

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

### 14.5 目录结构映射

在代码层，0.1 可以采用这样的目录结构：

```text
experience-os/
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
```

这份结构对应前面的哲学：

- `core` 承载线性状态机；
- `schemas` 承载生产通道的墙壁；
- `prompts` 承载自然语言到任务的桥；
- `skills` 承载工具化经验；
- `memory` 承载长期记忆；
- `adaptations` 承载越用越精；
- `review` 承载辩证和撞墙反馈。

### 14.6 运行流程：一次思想如何进入工程

例如用户说：

> 我觉得 Skill 应该从人的生产过程里自动长出来，而不是手动安装。

系统线性处理如下：

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

这就是“非线性思想向线性系统的无失真转移”。

无失真不是逐字保存，而是保留思想的结构、来源、上下文、适用边界和后续用途。

### 14.7 工程上的关键结论

Experience OS 在代码层不是一个聊天应用。

它更接近：

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

如果未来要开发，第一步不是做漂亮 UI，而是先实现：

1. `Project` 对象；
2. `ConversationEvent` 记录；
3. `ThoughtFragment` 提取；
4. `Rule / Skill / Artifact` Schema；
5. 状态机；
6. WallHit 撞墙反馈；
7. Vault 存储；
8. 简单复用检索。

这 8 个东西跑通，Experience OS 的骨架就成立。

## 15. 最终判断

你的思想不是在做一个普通 AI 产品。

你真正要做的是一套新的 AI 协作范式：

> 人给方向，AI 做填充，系统自动沉淀经验，下一次项目继承经验，并逐步适配这个人的工作方式。

这就是 Experience OS 的核心。

它不是“更聪明的聊天机器人”，而是“让经验持续复利、让工具自动生长、让 AI 逐步适配人的工具母体”。

## 16. 资料来源与相似思想

以下资料用于校准 Experience OS 的外部思想来源：

- Andrew Ng / DeepLearning.AI 关于 Agentic Workflow 的四类模式：Reflection、Tool Use、Planning、Multi-agent。参考：<https://www.deeplearning.ai/the-batch/how-agents-can-improve-llm-performance/>
- LangChain 关于 Cognitive Architecture 的解释：Agent 系统不只是模型调用，而是思考流程、状态、工具和控制逻辑。参考：<https://www.langchain.com/blog/what-is-a-cognitive-architecture>
- Anthropic / Claude Artifacts：对话产物需要变成可编辑制品。参考：<https://www.anthropic.com/news/artifacts>
- Model Context Protocol：把 AI 应用连接到外部数据、工具和工作流的开放标准。参考：<https://modelcontextprotocol.io/docs/getting-started/intro>
- OpenAI Structured Outputs：让模型输出严格符合 JSON Schema，避免关键结构缺失或枚举幻觉。参考：<https://developers.openai.com/api/docs/guides/structured-outputs>
- OpenAI Memory FAQ：自动记忆、用户控制、记忆来源解释与可删除机制。参考：<https://help.openai.com/en/articles/8590148-memory-faq>
- Reflexion：语言反馈可以成为 Agent 的反思记忆。参考：<https://arxiv.org/abs/2303.11366>
- Apple Shortcuts：把复杂任务拆成 action 并组合成 shortcut，体现低门槛自动化。参考：<https://support.apple.com/guide/shortcuts/welcome/ios>
- Programming by Demonstration / Programming by Example：用户通过示范动作教系统形成可复用流程。参考：<https://en.wikipedia.org/wiki/Programming_by_demonstration>
- Nonaka-Takeuchi SECI 模型：隐性知识与显性知识之间的持续转化。参考：<https://en.wikipedia.org/wiki/SECI_model_of_knowledge_dimensions>
- DevForge 工程化训练平台：真实代码、规范、CI、靶场与 AI 工程化规范。参考：<https://immaotianyi.github.io/devforge/>
- AutoSkills：自动构建分层 Skill Library 与迭代 refinement。参考：<https://openreview.net/forum?id=rJS7Z3Oaw1>
- Learning Personalized Agents from Human Feedback：通过人类反馈学习个性化偏好。参考：<https://ai.meta.com/research/publications/learning-personalized-agents-from-human-feedback/>
- Response-Aware User Memory Selection：个性化记忆选择要看对回答质量的贡献，而不只是语义相似度。参考：<https://www.microsoft.com/en-us/research/publication/response-aware-user-memory-selection-for-llm-personalization/>
- How Should Agents Read Demonstrations：通过层级子目标读取用户示范。参考：<https://openreview.net/forum?id=gUmd0H0g7t>
- Voyager：开放式 Agent 通过可执行 Skill Library 持续学习。参考：<https://arxiv.org/abs/2305.16291>
- BOSS：Bootstrap Your Own Skills，通过 LLM guidance 学习新任务 Skill。参考：<https://research.google/pubs/bootstrap-your-own-skills-learning-to-solve-new-tasks-with-large-language-model-guidance/>
- SWE-agent Trajectories：保存 agent 运行轨迹用于检查与回放。参考：<https://github.com/SWE-agent/SWE-agent/blob/main/docs/usage/trajectories.md>
