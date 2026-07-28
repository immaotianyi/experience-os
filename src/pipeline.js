/**
 * Pipeline — EOS 2.0 核心协作管道原型，串联状态机与各领域对象的端到端执行流。
 *
 * 做什么：
 *   实现"非线性思想 → 工程对象 → 生产验证 → 入库/撞墙"的完整原型管道。runPrototype()
 *   接收一段 rawThought（用户的非线性思想文本），按 stateMachine 定义的阶段顺序推进
 *   Project 状态，依次产出 ConversationEvent、ThoughtFragment、HumanEditLog、
 *   SubgoalSegment、Rule、SkillCandidate、WorkflowPattern、PreferenceHypothesis，
 *   然后进入 PRODUCTION_VALIDATING：通过则产出 Artifact，不通过则产出 WallHit 和
 *   ReflectionMemory。每个中间产物都经过 validate.js 的校验层，最终写入 Vault。
 *   同时记录 MotherSkillTrajectory 作为母 Skill 的执行轨迹，供自我迭代回溯。
 *
 * 核心抽象：
 *   - 管道是"状态推进 + 对象派生 + 即时校验 + 持久化"的四步循环。每次状态转换都由
 *     transition() 触发，紧接着派生下一阶段的领域对象，校验通过后 vault.save()。
 *   - 每个 derive* 函数是一个纯工厂：输入 project 和上游对象，输出一个符合 domain.js
 *     Schema 的新对象，不做 IO、不修改入参。
 *   - 生产验证是管道的分水岭：validateCandidateIntoArtifact() 返回 {ok, artifact} 或
 *     {ok: false, wallHit}，决定管道走向 ARTIFACT_CREATED 还是 WALL_HIT。
 *   - MotherSkillTrajectory 记录整条路径的输入/输出 ID 链，使经验资产可溯源到
 *     原始 ConversationEvent。
 *
 * 关键不变量：
 *   1. 每个领域对象在 vault.save() 之前必须通过对应的 validate* 校验；校验失败直接
 *      throw Error，不产生半成品记录。
 *   2. 状态转换严格遵循 stateMachine.js 的 TRANSITIONS 图，不允许跳步。
 *   3. runPrototype 是原型/演示入口，使用硬编码的 project id 和派生内容，用于验证
 *      管道骨架可跑通；它不是生产环境的通用编排器（projectEngine 才是）。
 *   4. WALL_HIT 路径必须同时产出 WallHit 和 ReflectionMemory，失败不静默。
 *
 * 设计取舍：
 *   - 管道函数手工串联（而非事件驱动/责任链），因为 2.0 阶段优先保证可读性和可调试性，
 *     每一步都显式 vault.save()，便于断点观察 Vault 中的对象状态。
 *   - derive* 函数内部硬编码了"非线性思想线性化"这一特定主题的内容（signals、rule
 *     statement 等），因为本文件同时承担管道骨架验证和母 Skill 演示双重职责；通用化
 *     的派生逻辑留待 projectEngine 在 3.0 中实现。
 *   - completeSkill 参数控制 SkillCandidate 是否带完整 inputSchema/outputSchema：
 *     false 时故意缺失以触发 WALL_HIT 路径演示撞墙反馈，true 时走通到 Artifact。
 *
 * 不做什么：
 *   - 不实现通用的项目编排引擎（不解析任意用户意图来动态决定派生什么对象）。
 *   - 不做并发/异步调度（所有步骤串行 await）。
 *   - 不处理 HUMAN_REVIEW、EXPERIENCE_EXTRACTING、ASSET_STORED、REUSE_READY 等
 *     2.0 后半段状态，原型仅覆盖到 ARTIFACT_CREATED/WALL_HIT。
 *   - 不实现重试/回滚；撞墙后只记录 ReflectionMemory，不自动回到 COLLABORATING 重试。
 */
import {
  STATES,
  createArtifact,
  createConversationEvent,
  createHumanEditLog,
  createMotherSkillTrajectory,
  createPreferenceHypothesis,
  createProject,
  createReflectionMemory,
  createRule,
  createSkillCandidate,
  createSubgoalSegment,
  createThoughtFragment,
  createWallHit,
  createWorkflowPattern
} from "./domain.js";
import { transition } from "./stateMachine.js";
import {
  validateHumanEditLog,
  validatePreferenceHypothesis,
  validateProject,
  validateSkillForProduction,
  validateSubgoalSegment,
  validateWorkflowPattern,
  wallTypeForIssue
} from "./validate.js";
import { slug } from "./utils.js";

export function extractThoughtFragment({ project, event }) {
  const content = event.content;
  const themes = [];
  if (content.includes("Skill") || content.includes("skill")) themes.push("skill_growth");
  if (content.includes("自动")) themes.push("automation");
  if (content.includes("工程") || content.includes("代码") || content.includes("架构")) themes.push("production_validation");
  if (content.includes("非线性") || content.includes("线性")) themes.push("nonlinear_to_linear");

  return createThoughtFragment({
    id: `thought.${slug(project.id)}.${Date.now()}`,
    projectId: project.id,
    sourceEventId: event.id,
    summary: "用户强调人的非线性思想需要被无失真地转移为线性工程对象，并通过规则、Prompt、Skill 与脚手架实现。",
    themes,
    evidence: content
  });
}

export function captureHumanEditLog({ project, event }) {
  return createHumanEditLog({
    id: `edit.${slug(project.id)}.${Date.now()}`,
    projectId: project.id,
    sourceEventId: event.id,
    before: "把想法直接交给 AI 生成结果。",
    after: "先把人的非线性思想转成对象、状态、Schema、规则、Skill，再进入生产验证。",
    editType: "structural_refinement",
    rationale: "用户要求无失真转移思想，并强调工程约束、撞墙反馈和可落地验证。",
    capturedSignals: ["非线性到线性", "工程化", "脚手架", "撞墙反馈", "无失真"]
  });
}

export function segmentSubgoal({ project, editLog }) {
  return createSubgoalSegment({
    id: `subgoal.${slug(project.id)}.${Date.now()}`,
    projectId: project.id,
    sourceEditLogIds: [editLog.id],
    title: "将非线性思想线性化",
    intent: "turn_user_thought_into_engineering_objects",
    inputs: ["rawThought", "projectContext", "humanEditLog"],
    outputs: ["ThoughtFragment", "Rule", "SkillCandidate", "WallHit"]
  });
}

export function deriveRule({ project, thought }) {
  return createRule({
    id: `rule.${slug(project.id)}.${Date.now()}`,
    projectId: project.id,
    title: "非线性思想必须结构化落地",
    statement: "任何从协作空间产生的想法，进入生产通道前必须被转换为对象、状态、Schema、规则或 Skill，并保留来源与适用边界。",
    sourceThoughtIds: [thought.id],
    scope: "project"
  });
}

export function deriveSkillCandidate({ project, complete = false }) {
  return createSkillCandidate({
    id: `skill.${slug(project.id)}.nonlinear_transfer`,
    projectId: project.id,
    name: "非线性思想线性化转移",
    origin: "derived_from_user_workflow",
    trigger: complete
      ? {
          intent: "transfer_nonlinear_thought_to_engineering",
          signals: ["非线性", "线性", "无失真", "工程化", "Schema", "状态机"]
        }
      : {
          intent: "transfer_nonlinear_thought_to_engineering",
          signals: []
        },
    inputSchema: complete
      ? {
          type: "object",
          required: ["rawThought", "projectContext"],
          properties: {
            rawThought: { type: "string" },
            projectContext: { type: "string" }
          }
        }
      : null,
    outputSchema: complete
      ? {
          type: "object",
          required: ["thoughtFragments", "rules", "skillCandidates", "wallHits"],
          properties: {
            thoughtFragments: { type: "array" },
            rules: { type: "array" },
            skillCandidates: { type: "array" },
            wallHits: { type: "array" }
          }
        }
      : null,
    safetyLevel: "L1",
    fallback: complete ? "return_structured_markdown_mapping" : "",
    humanConfirmationRequired: true,
    skillLevel: "functional",
    memoryUtility: {
      expectedUse: "把用户抽象想法转成工程对象，降低理念到代码之间的损耗。",
      evaluationSignal: "是否生成可验证对象、WallHit 或 Artifact。"
    },
    adaptationNotes: [
      "用户强调自己是非线性的，系统必须把思想转为线性工程结构。",
      "输出应优先体现对象、状态机、Schema、撞墙反馈。"
    ]
  });
}

export function deriveWorkflowPattern({ project, subgoal, skill }) {
  return createWorkflowPattern({
    id: `workflow.${slug(project.id)}.${Date.now()}`,
    projectId: project.id,
    sourceSubgoalIds: [subgoal.id],
    name: "非线性思想到工程资产",
    pattern: "ConversationEvent -> HumanEditLog -> SubgoalSegment -> ThoughtFragment -> Rule/SkillCandidate -> ProductionValidation",
    recurrenceEvidence: ["用户多次强调非线性思想需要被完整转移到工程结构中"],
    candidateSkillIds: [skill.id]
  });
}

export function derivePreferenceHypothesis({ project, editLog }) {
  return createPreferenceHypothesis({
    id: `pref.${slug(project.id)}.${Date.now()}`,
    projectId: project.id,
    statement: "用户偏好将抽象思想映射为工程对象、状态机、Schema 和反馈机制，而不是停留在概念表达。",
    evidenceIds: [editLog.id],
    confidence: 0.72
  });
}

export function validateCandidateIntoArtifact({ project, skill }) {
  const issues = validateSkillForProduction(skill);
  if (issues.length > 0) {
    return {
      ok: false,
      wallHit: createWallHit({
        id: `wallhit.${slug(project.id)}.${Date.now()}`,
        projectId: project.id,
        wallType: wallTypeForIssue(issues[0]),
        stage: STATES.PRODUCTION_VALIDATING,
        message: "Skill 候选未通过生产通道验证，不能进入稳定工具库。",
        blockedBy: issues,
        suggestedFixes: [
          "补齐触发信号",
          "补齐 inputSchema 与 outputSchema",
          "定义 fallback 降级路径",
          "确认是否需要人类审批"
        ]
      })
    };
  }

  return {
    ok: true,
    artifact: createArtifact({
      id: `artifact.${slug(project.id)}.${Date.now()}`,
      projectId: project.id,
      title: "非线性思想线性化转移 Skill 说明",
      artifactType: "skill_spec",
      content: JSON.stringify(skill, null, 2),
      sourceIds: [skill.id]
    })
  };
}

export function reflectFromWallHit({ project, wallHit }) {
  return createReflectionMemory({
    id: `reflection.${slug(project.id)}.${Date.now()}`,
    projectId: project.id,
    sourceWallHitId: wallHit.id,
    lesson: "Skill 候选不能只来自协作层想法，必须补齐触发条件、输入输出 Schema 和降级路径才能进入生产通道。",
    avoidNextTime: [
      "不要把没有 signals 的 Skill 升级为稳定工具",
      "不要把缺少 inputSchema/outputSchema 的想法称为可运行 Skill",
      "不要静默失败，必须生成 WallHit"
    ],
    replayPointers: [wallHit.id, ...(wallHit.blockedBy ?? [])]
  });
}

export function recordMotherSkillTrajectory({ project, skill, event, thought, rule, editLog, subgoal, workflow, validation }) {
  return createMotherSkillTrajectory({
    id: `trajectory.${slug(project.id)}.${Date.now()}`,
    projectId: project.id,
    motherSkillId: "skill.mother.auto_experience_assetization",
    route: [
      "capture_conversation",
      "capture_human_edit",
      "segment_subgoal",
      "extract_thought",
      "derive_rule",
      "derive_skill_candidate",
      "validate_production"
    ],
    inputs: {
      eventId: event.id,
      thoughtId: thought.id,
      editLogId: editLog.id,
      subgoalId: subgoal.id,
      workflowId: workflow.id
    },
    outputs: {
      ruleId: rule.id,
      skillId: skill.id,
      resultKind: validation.ok ? "Artifact" : "WallHit",
      resultId: validation.ok ? validation.artifact.id : validation.wallHit.id
    },
    wallHitIds: validation.ok ? [] : [validation.wallHit.id],
    fallbackUsed: !validation.ok
  });
}

export async function runPrototype({ vault, rawThought, completeSkill = false }) {
  let project = createProject({
    id: "project.experience_os_0_1",
    name: "Experience OS 0.1 工程化",
    goal: "把自动经验资产化理念转化为可运行的工程骨架。",
    constraints: ["零依赖优先", "先跑通状态机与 Vault", "生产通道必须有撞墙反馈"],
    acceptanceCriteria: ["能记录思想", "能提取规则", "能生成 Skill 候选", "能验证或撞墙", "能写入 Vault"]
  });

  const projectIssues = validateProject(project);
  if (projectIssues.length > 0) throw new Error(`Invalid project: ${projectIssues.join(", ")}`);

  await vault.save(project);

  project = transition(project, STATES.COLLABORATING, "用户输入非线性思想");
  await vault.save(project);

  const event = createConversationEvent({
    id: `event.${slug(project.id)}.${Date.now()}`,
    projectId: project.id,
    actor: "user",
    content: rawThought
  });
  await vault.save(event);

  project = transition(project, STATES.DIVERGING, "进入发散漏斗");
  await vault.save(project);

  const thought = extractThoughtFragment({ project, event });
  await vault.save(thought);

  project = transition(project, STATES.CANDIDATE_EXTRACTED, "提取 ThoughtFragment、HumanEditLog、Subgoal、Rule 和 Skill 候选");
  await vault.save(project);

  const editLog = captureHumanEditLog({ project, event });
  const editIssues = validateHumanEditLog(editLog);
  if (editIssues.length > 0) throw new Error(`Invalid edit log: ${editIssues.join(", ")}`);
  await vault.save(editLog);

  const subgoal = segmentSubgoal({ project, editLog });
  const subgoalIssues = validateSubgoalSegment(subgoal);
  if (subgoalIssues.length > 0) throw new Error(`Invalid subgoal: ${subgoalIssues.join(", ")}`);
  await vault.save(subgoal);

  const rule = deriveRule({ project, thought });
  await vault.save(rule);

  const skill = deriveSkillCandidate({ project, complete: completeSkill });
  await vault.save(skill);

  const workflow = deriveWorkflowPattern({ project, subgoal, skill });
  const workflowIssues = validateWorkflowPattern(workflow);
  if (workflowIssues.length > 0) throw new Error(`Invalid workflow pattern: ${workflowIssues.join(", ")}`);
  await vault.save(workflow);

  const preference = derivePreferenceHypothesis({ project, editLog });
  const preferenceIssues = validatePreferenceHypothesis(preference);
  if (preferenceIssues.length > 0) throw new Error(`Invalid preference hypothesis: ${preferenceIssues.join(", ")}`);
  await vault.save(preference);

  project = transition(project, STATES.PRODUCTION_VALIDATING, "进入生产通道验证");
  await vault.save(project);

  const validation = validateCandidateIntoArtifact({ project, skill });
  const trajectory = recordMotherSkillTrajectory({
    project,
    skill,
    event,
    thought,
    rule,
    editLog,
    subgoal,
    workflow,
    validation
  });
  await vault.save(trajectory);

  if (!validation.ok) {
    project = transition(project, STATES.WALL_HIT, "生产验证撞墙");
    await vault.save(project);
    await vault.save(validation.wallHit);
    const reflection = reflectFromWallHit({ project, wallHit: validation.wallHit });
    await vault.save(reflection);
    return { project, event, thought, editLog, subgoal, workflow, preference, rule, skill, trajectory, wallHit: validation.wallHit, reflection };
  }

  project = transition(project, STATES.ARTIFACT_CREATED, "Skill 候选通过验证并生成制品");
  await vault.save(project);
  await vault.save(validation.artifact);
  return { project, event, thought, editLog, subgoal, workflow, preference, rule, skill, trajectory, artifact: validation.artifact };
}
