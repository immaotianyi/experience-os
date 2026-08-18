/**
 * EOS Preset Skills — factory skill pack installed at workspace bootstrap.
 *
 * Format follows the skill-central Universal Skill v1 authoring contract
 * (skillcentral.dev/v1): id/name/description/type/tags/arguments/prompt,
 * mapped onto EOS Skill records (trigger/schemas/safetyLevel/instructions).
 *
 * Presets are installed as candidates on purpose: reviewing the preset pack
 * is the user's first hands-on tour of the EOS review flow, and nothing
 * becomes a reusable stable asset without a human decision.
 */

import { importSkill } from "./skillRegistry.js";

export const PRESET_SCHEMA_VERSION = "skillcentral.dev/v1";

export const PRESET_SKILLS = [
  {
    name: "Commit Conventions",
    description: "生成或校验符合 Conventional Commmits 规范的 git 提交信息",
    schemaVersion: PRESET_SCHEMA_VERSION,
    type: "tool",
    tags: ["git", "workflow", "commit"],
    trigger: { intent: "写一条规范的 git commit message", signals: ["git", "commit"] },
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", description: "feat / fix / chore / docs / refactor / test / style" },
        scope: { type: "string", description: "改动范围（可选）" },
        summary: { type: "string", description: "祈使句短语，小写，不以句号结尾" }
      },
      required: ["type", "summary"]
    },
    outputSchema: { type: "object", properties: { message: { type: "string" } } },
    safetyLevel: "L1",
    humanConfirmationRequired: false,
    skillLevel: "functional",
    instructions: [
      "按 Conventional Commits 生成提交信息：{{type}}({{scope}}): {{summary}}",
      "规则：type ∈ feat|fix|chore|docs|refactor|test|style；summary 小写祈使句、结尾无句号；scope 可省略但括号成对删除。"
    ].join("\n")
  },
  {
    name: "Session Recap",
    description: "把一段工作会话的观察事件整理成一页复盘：做了什么、卡在哪、下次注意什么",
    schemaVersion: PRESET_SCHEMA_VERSION,
    type: "prompt",
    tags: ["review", "session", "recap"],
    trigger: { intent: "复盘今天/这段会话的工作", signals: ["recap", "复盘", "session"] },
    inputSchema: {
      type: "object",
      properties: {
        period: { type: "string", description: "时间窗口，如 today / this-session" },
        focus: { type: "string", description: "重点关注的问题（可选）" }
      },
      required: ["period"]
    },
    outputSchema: { type: "object", properties: { recap: { type: "string" } } },
    safetyLevel: "L1",
    humanConfirmationRequired: false,
    skillLevel: "functional",
    instructions: [
      "输入：会话观察事件（会话开始/结束、工具调用、阻塞与权限事件）+ 时间窗口。",
      "输出固定四段：①做了什么（按时间序的事件摘要，不引用任何提示词或代码内容）；②卡点（阻塞/权限等待集中在哪里）；③信号（哪些值得沉淀为经验）；④下次动作（不超过 3 条）。",
      "只使用元数据；不推断、不复述任何私密内容。"
    ].join("\n")
  },
  {
    name: "Experience Distill",
    description: "从撞墙记录（WallHit）提炼可复用的技能候选：当时什么情境、踩了什么坑、正确做法是什么",
    schemaVersion: PRESET_SCHEMA_VERSION,
    type: "workflow",
    tags: ["wallhit", "distill", "skill"],
    trigger: { intent: "把踩过的坑变成技能", signals: ["wallhit", "撞墙", "提炼"] },
    inputSchema: {
      type: "object",
      properties: {
        wallHitIds: { type: "array", items: { type: "string" }, description: "撞墙记录 ID 列表" }
      },
      required: ["wallHitIds"]
    },
    outputSchema: { type: "object", properties: { skillCandidates: { type: "array", items: { type: "object" } } } },
    safetyLevel: "L2",
    humanConfirmationRequired: true,
    skillLevel: "functional",
    instructions: [
      "对每条撞墙记录提取四要素：情境（什么条件下触发）、症状（表象是什么）、根因（真实原因）、解法（验证过的正确做法）。",
      "同一根因的多条记录合并为一个技能候选；解法必须有结果验证支撑，没有的标记『待验证』。",
      "输出为 EOS Skill candidate 草案，等待人工审查，不自动入库为 stable。"
    ].join("\n")
  },
  {
    name: "Code Graph Orientation",
    description: "为新接手的代码库生成一页导读：结构、枢纽文件、循环依赖和改动影响面",
    schemaVersion: PRESET_SCHEMA_VERSION,
    type: "tool",
    tags: ["codegraph", "orientation", "onboarding"],
    trigger: { intent: "快速看懂一个代码库的结构", signals: ["codegraph", "代码图", "导读"] },
    inputSchema: {
      type: "object",
      properties: {
        projectPath: { type: "string", description: "项目根目录" },
        depth: { type: "integer", description: "导读深度 1-3，默认 1" }
      },
      required: ["projectPath"]
    },
    outputSchema: { type: "object", properties: { briefing: { type: "string" } } },
    safetyLevel: "L1",
    humanConfirmationRequired: false,
    skillLevel: "functional",
    instructions: [
      "调用 /api/code-graph/parse-project 解析项目，取 hub（被依赖最多）、cycle（循环依赖）、bridge（跨模块桥）模式。",
      "输出：①一句话架构判断；②Top 枢纽文件及其被依赖数；③循环依赖链（有则列出，改这些要小心）；④如果要改 X，影响面多大（blast radius）。",
      "只报告结构事实，不给重构建议。"
    ].join("\n")
  },
  {
    name: "Skill Review Checklist",
    description: "审查一个技能候选时的检查清单：指令是否可执行、边界是否清楚、降级是否安全",
    schemaVersion: PRESET_SCHEMA_VERSION,
    type: "policy",
    tags: ["review", "checklist", "governance"],
    trigger: { intent: "审查技能候选", signals: ["review", "审查", "skill"] },
    inputSchema: {
      type: "object",
      properties: {
        skillId: { type: "string", description: "待审查的 Skill ID" }
      },
      required: ["skillId"]
    },
    outputSchema: { type: "object", properties: { verdict: { type: "string" }, issues: { type: "array", items: { type: "string" } } } },
    safetyLevel: "L1",
    humanConfirmationRequired: false,
    skillLevel: "functional",
    instructions: [
      "逐项检查：①指令是否无歧义可执行；②输入/输出 schema 与指令是否一致；③失败时的 fallback 是否明确且安全；④safetyLevel 与 humanConfirmationRequired 是否匹配动作风险；⑤是否复述了不该存的内容。",
      "任何一项不通过 → 列出 issue 并给 approve / revise / reject 建议；全部通过才建议 promote_stable。"
    ].join("\n")
  },
  {
    name: "Host Connection Guide",
    description: "把某个 AI 宿主（Codex/Claude/Cursor/TRAE/VS Code）接入 EOS 的分步引导",
    schemaVersion: PRESET_SCHEMA_VERSION,
    type: "prompt",
    tags: ["host", "connection", "platform"],
    trigger: { intent: "连接一个 AI 工具到 EOS", signals: ["connect", "宿主", "连接"] },
    inputSchema: {
      type: "object",
      properties: {
        host: { type: "string", description: "codex / claude / cursor / trae / vscode" }
      },
      required: ["host"]
    },
    outputSchema: { type: "object", properties: { steps: { type: "array", items: { type: "string" } } } },
    safetyLevel: "L1",
    humanConfirmationRequired: false,
    skillLevel: "functional",
    instructions: [
      "按宿主给出对应接入路径：Codex/Claude → 官方 CLI 命令注册 MCP + Hook；Cursor → 工作台自动写入 .cursor/mcp.json 与 hooks.json；TRAE → 界面手动配 MCP（EOS 无公开配置可写）+ 会话日志观察器自动盯状态；VS Code → .vscode/mcp.json。",
      "每条路径给：前置条件 / 具体步骤 / 如何确认成功（三灯或平台页证据）。",
      "强调：所有观察都需要显式许可，EOS 不静默监控。"
    ].join("\n")
  },
  {
    name: "Release Preflight",
    description: "打包发布 EOS 前的预检清单：测试、构建、签名、冒烟一步不落",
    schemaVersion: PRESET_SCHEMA_VERSION,
    type: "workflow",
    tags: ["release", "preflight", "checklist"],
    trigger: { intent: "准备发一个版本", signals: ["release", "发布", "preflight"] },
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "string", description: "macOS / Windows / both" }
      },
      required: ["target"]
    },
    outputSchema: { type: "object", properties: { report: { type: "string" } } },
    safetyLevel: "L1",
    humanConfirmationRequired: false,
    skillLevel: "functional",
    instructions: [
      "按 docs/RELEASING.md 十步清单执行：全量测试 → 版本号与 CHANGELOG → npm run verify:release → 构建 DMG → codesign 校验 → /api/health 冒烟 → beta 包检查 → 真实使用一轮 → 目标平台证据齐全才打 tag。",
      "输出：每步 pass/fail + 阻塞项。任何一步 fail 即停止并报告。"
    ].join("\n")
  }
];

export async function listPresetSkills() {
  return PRESET_SKILLS.map((skill, index) => ({
    index,
    name: skill.name,
    description: skill.description,
    type: skill.type,
    tags: skill.tags,
    safetyLevel: skill.safetyLevel,
    schemaVersion: skill.schemaVersion
  }));
}

export async function installPresetSkills({ vault, projectId, skillNames = null }) {
  if (!vault) throw new Error("vault is required");
  if (typeof projectId !== "string" || !projectId.trim()) throw new Error("projectId is required");

  const existing = await vault.list("Skill");
  const existingNames = new Set(existing.map((s) => s.name));
  const wanted = skillNames
    ? PRESET_SKILLS.filter((s) => skillNames.includes(s.name))
    : PRESET_SKILLS;

  const installed = [];
  const skipped = [];
  for (const preset of wanted) {
    if (existingNames.has(preset.name)) {
      skipped.push({ name: preset.name, reason: "already-present" });
      continue;
    }
    const skill = await importSkill({
      vault,
      skillData: preset,
      projectId,
      source: `preset:${preset.schemaVersion}`
    });
    installed.push({ id: skill.id, name: skill.name, status: skill.status });
  }
  return { installed, skipped, total: PRESET_SKILLS.length };
}
