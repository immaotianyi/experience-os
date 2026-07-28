/**
 * Self-Iteration Engine — 自我迭代引擎，从历史运行轨迹中提取并生成新的 Skill 候选。
 *
 * 做什么：
 *   runSelfIteration() 读取 Vault 中最近的 ReuseContext、WorkflowPattern、ReflectionMemory、
 *   MotherSkillTrajectory 和 CodeGraphPattern，基于这些"历史经验证据"生成一批 SkillCandidate，
 *   逐个通过 validateSkillForProduction() 生产验证：通过的 Skill 连同 Artifact 入库，
 *   不通过的生成 WallHit。整次迭代打包为 SelfIterationRun 记录，包含候选/通过/拒绝/撞墙
 *   的完整清单，并正确回填 ReuseContext 中实际被消费的 contributionCandidates 的使用结果。
 *
 * 核心抽象：
 *   - 两类 Skill 来源：
 *     1) 工作流内生 Skill（4 个固定模板）：reuse_context_builder、wallhit_reflection_builder、
 *        preference_hypothesis_review_gate、auto_skill_growth_orchestrator。它们来自
 *        2.0 管道中已验证成功/必要的操作模式，代表"系统自己学会做自己正在做的事"。
 *     2) 代码图谱派生 Skill（generateCodeGraphSkills）：从 CodeGraphPattern 的 5 种拓扑
 *        类型（hub/hotspot/cycle/leaf/bridge）各映射到一个专用 Skill，将架构反模式/
 *        结构特征转化为可复用的工程守卫或重构操作。
 *   - createValidatedSkill() 统一填充安全级别（L1）、降级路径（return_wallhit_with_repair_steps）、
 *     人类确认要求（true）等生产通道最低门槛字段，确保自我迭代不绕过安全护栏。
 *   - 每次迭代使用时间戳后缀构造 ID，避免覆盖之前已审查/升级的同名 Skill。
 *
 * 关键不变量：
 *   1. 自我迭代生成的 Skill 必须和人工创建的 Skill 走同一个生产验证通道
 *      （validateSkillForProduction），不允许自我生成的 Skill 绕过校验直接入库。
 *   2. 所有生成的 Skill 都强制 safetyLevel=L1、humanConfirmationRequired=true、
 *      fallback 非空，确保 AI 自我进化不会脱离人类监督。
 *   3. updateReuseContextOutcomes() 只标记实际被本次 run 消费（出现在 sourceRecordIds/
 *      candidateSkillIds/acceptedSkillIds 中）的 contributionCandidate 为 used，
 *      不会像早期版本那样把整个 ReuseContext 的所有候选都标记为已使用——那样会污染
 *      复用反馈信号。
 *   4. CodeGraphPattern.list() 失败时（.catch(() => [])）静默降级为空列表，不阻塞
 *      自我迭代主流程，因为代码图谱是 3.0 增量能力。
 *
 * 设计取舍：
 *   - 工作流内生 Skill 采用硬编码模板而非从轨迹自动归纳，因为 2.0/3.0 阶段训练数据
 *     （SelfIterationRun 数量）极少，自动归纳容易产生幻觉 Skill；固定模板保证质量，
 *     数据充足后再切换到归纳模式。
 *   - 从每类历史记录中只取 latest 2 条（CodeGraphPattern 取 5 条）作为证据来源，
 *     避免单次迭代吸入过多上下文导致 Skill 候选发散；迭代是持续的，不需要一次吃成胖子。
 *   - code graph 模式按 patternType 分组聚合（grouped Map），同类型多个 pattern 合并
 *     指标（取 max fanIn/fanOut/complexity 等）生成一个 Skill 而非多个重复 Skill。
 *   - 自我迭代不自动提升 Skill 状态（不设 status=promoted），生成的 Skill 仍需经
 *     HUMAN_REVIEW 阶段确认后才能成为稳定工具。
 *
 * 不做什么：
 *   - 不自动执行生成的 Skill（只生成规格，不触发副作用）。
 *   - 不做 Skill 版本管理/差异对比（新旧同名 Skill 通过时间戳后缀共存，由人工审查淘汰）。
 *   - 不跨项目迁移 Skill（所有生成的 Skill 绑定 projectId，跨项目复用由 ReuseContext 机制
 *     在未来版本支持）。
 *   - 不删除或归档旧的 Skill 候选（淘汰由 vaultMaintenance 处理）。
 */
import {
  STATES,
  createArtifact,
  createSelfIterationRun,
  createSkillCandidate,
  createWallHit
} from "./domain.js";
import { validateSkillForProduction, wallTypeForIssue } from "./validate.js";
import { slug, latest } from "./utils.js";

function schema(properties, required = Object.keys(properties)) {
  return { type: "object", required, properties };
}

function createValidatedSkill({ id, projectId, name, intent, signals, inputProperties, outputProperties, skillLevel, notes }) {
  return createSkillCandidate({
    id,
    projectId,
    name,
    origin: "self_iteration",
    trigger: { intent, signals },
    inputSchema: schema(inputProperties),
    outputSchema: schema(outputProperties),
    safetyLevel: "L1",
    fallback: "return_wallhit_with_repair_steps",
    humanConfirmationRequired: true,
    skillLevel,
    memoryUtility: {
      expectedUse: `自我迭代生成的 ${name}，用于减少下一轮工具开发中的重复人工判断。`,
      evaluationSignal: "是否被 ReuseContext 推荐，且是否通过生产验证。"
    },
    adaptationNotes: notes
  });
}

export async function proposeSelfIterationSkills({ vault, projectId }) {
  const [reuseContexts, workflows, reflections, trajectories, codeGraphPatterns] = await Promise.all([
    vault.list("ReuseContext"),
    vault.list("WorkflowPattern"),
    vault.list("ReflectionMemory"),
    vault.list("MotherSkillTrajectory"),
    vault.list("CodeGraphPattern").catch(() => [])
  ]);

  const sourceRecords = [
    ...latest(reuseContexts, 2),
    ...latest(workflows, 2),
    ...latest(reflections, 2),
    ...latest(trajectories, 2),
    ...latest(codeGraphPatterns, 5)
  ];
  const sourceRecordIds = sourceRecords.map((record) => record.id);

  // Use timestamp suffix to prevent overwriting previously reviewed/upgraded Skills
  const ts = Date.now();
  const idSuffix = `${ts}`;

  // 方案C: Generate Skills from code graph patterns
  const codeGraphSkills = generateCodeGraphSkills(codeGraphPatterns, projectId, idSuffix);

  return [
    createValidatedSkill({
      id: `skill.${slug(projectId)}.reuse_context_builder.${idSuffix}`,
      projectId,
      name: "复用上下文构建",
      intent: "build_reuse_context_from_vault",
      signals: ["复用", "下一次项目", "历史经验", "ReuseContext", "Vault"],
      inputProperties: {
        query: { type: "string" },
        projectId: { type: "string" },
        assetKinds: { type: "array" }
      },
      outputProperties: {
        reuseContextId: { type: "string" },
        recommendedRuleIds: { type: "array" },
        recommendedSkillIds: { type: "array" },
        recommendedReflectionIds: { type: "array" }
      },
      skillLevel: "functional",
      notes: ["来自 reuse demo 的成功路径", "按资产类型配额检索，避免重复 Rule 淹没上下文"]
    }),
    createValidatedSkill({
      id: `skill.${slug(projectId)}.wallhit_reflection_builder.${idSuffix}`,
      projectId,
      name: "撞墙反思沉淀",
      intent: "turn_wallhit_into_reflection_memory",
      signals: ["撞墙", "WallHit", "反思", "失败", "下次避免"],
      inputProperties: {
        wallHitId: { type: "string" },
        blockedBy: { type: "array" },
        suggestedFixes: { type: "array" }
      },
      outputProperties: {
        reflectionMemoryId: { type: "string" },
        lesson: { type: "string" },
        avoidNextTime: { type: "array" }
      },
      skillLevel: "atomic",
      notes: ["来自 WALL_HIT 路径", "失败轨迹必须可重放并反哺规则库"]
    }),
    createValidatedSkill({
      id: `skill.${slug(projectId)}.preference_hypothesis_review_gate.${idSuffix}`,
      projectId,
      name: "偏好假设人工确认",
      intent: "review_preference_hypothesis",
      signals: ["偏好", "假设", "确认", "驳回", "Human Review"],
      inputProperties: {
        preferenceHypothesisId: { type: "string" },
        humanDecision: { type: "string" },
        revision: { type: "string" }
      },
      outputProperties: {
        updatedPreferenceHypothesisId: { type: "string" },
        status: { type: "string" },
        confidence: { type: "number" }
      },
      skillLevel: "functional",
      notes: ["偏好不能直接固化，必须先作为假设", "下一步 Human Review 的入口 Skill"]
    }),
    createValidatedSkill({
      id: `skill.${slug(projectId)}.auto_skill_growth_orchestrator.${idSuffix}`,
      projectId,
      name: "自动 Skill 生长编排",
      intent: "orchestrate_auto_skill_growth",
      signals: ["自动 Skill", "自我迭代", "HumanEditLog", "WorkflowPattern", "MotherSkillTrajectory"],
      inputProperties: {
        humanEditLogIds: { type: "array" },
        workflowPatternIds: { type: "array" },
        reflectionMemoryIds: { type: "array" }
      },
      outputProperties: {
        candidateSkillIds: { type: "array" },
        motherSkillTrajectoryId: { type: "string" },
        wallHitIds: { type: "array" }
      },
      skillLevel: "strategic",
      notes: ["母 Skill 只负责编排，不直接绕过生产验证", "每次运行必须保存 MotherSkillTrajectory"]
    }),
    ...codeGraphSkills
  ].map((skill) => ({ skill, sourceRecordIds }));
}

/**
 * 方案C: Generate Skills from extracted code graph patterns.
 *
 * Each pattern type maps to a specific Skill:
 *   hub      → hub_change_impact_assessment (assess downstream before modifying)
 *   hotspot  → hotspot_refactor_guard (guard fragile coupling points)
 *   cycle    → cycle_break_strategy (break circular dependencies)
 *   leaf     → leaf_extract_to_atomic_skill (extract reusable atomic logic)
 *   bridge   → bridge_protection_guard (protect critical connectors)
 */
function generateCodeGraphSkills(patterns, projectId, idSuffix) {
  if (!patterns || patterns.length === 0) return [];

  // Group patterns by patternType so we aggregate metrics instead of skipping duplicates
  const grouped = new Map();
  for (const pattern of patterns) {
    if (!grouped.has(pattern.patternType)) grouped.set(pattern.patternType, []);
    grouped.get(pattern.patternType).push(pattern);
  }

  const skills = [];
  for (const [patternType, group] of grouped) {
    const labels = group.map((p) => p.label).join(", ");
    const patternIds = group.map((p) => p.id);
    const bounds = [...new Set(group.flatMap((p) => p.applicabilityBounds || []))];

    switch (patternType) {
      case "hub": {
        const maxFanIn = Math.max(...group.map((p) => p.metrics?.fanIn ?? 0));
        skills.push(createValidatedSkill({
          id: `skill.${slug(projectId)}.hub_change_impact.${idSuffix}`,
          projectId,
          name: "枢纽变更影响评估",
          intent: "assess_hub_change_impact",
          signals: ["枢纽", "hub", "fan-in", "核心依赖", "变更评估"],
          inputProperties: {
            nodeId: { type: "string" },
            fanIn: { type: "number" },
            changeDescription: { type: "string" },
            codeGraphPatternId: { type: "string" }
          },
          outputProperties: {
            affectedNodeIds: { type: "array" },
            riskLevel: { type: "string" },
            recommendedActions: { type: "array" }
          },
          skillLevel: "functional",
          notes: [
            `来源: ${group.length} 个 CodeGraphPattern (${patternIds.join(", ")})`,
            `枢纽节点: ${labels}`,
            `最高 fanIn=${maxFanIn}`,
            "变更前必须枚举全部调用方并评估影响",
            ...bounds
          ]
        }));
        break;
      }

      case "hotspot": {
        const maxFanOut = Math.max(...group.map((p) => p.metrics?.fanOut ?? 0));
        const maxComplexity = Math.max(...group.map((p) => p.metrics?.complexity ?? 0));
        skills.push(createValidatedSkill({
          id: `skill.${slug(projectId)}.hotspot_refactor_guard.${idSuffix}`,
          projectId,
          name: "热点重构守卫",
          intent: "guard_hotspot_refactor",
          signals: ["热点", "hotspot", "脆弱耦合", "高复杂度", "高扇出"],
          inputProperties: {
            nodeId: { type: "string" },
            fanOut: { type: "number" },
            complexity: { type: "number" },
            refactorPlan: { type: "string" }
          },
          outputProperties: {
            approvedToRefactor: { type: "boolean" },
            prerequisites: { type: "array" },
            recommendedSplitStrategy: { type: "string" }
          },
          skillLevel: "functional",
          notes: [
            `来源: ${group.length} 个 CodeGraphPattern (${patternIds.join(", ")})`,
            `热点节点: ${labels}`,
            `最高 fanOut=${maxFanOut} complexity=${maxComplexity}`,
            "重构前必须先补齐测试覆盖并拆分耦合点",
            ...bounds
          ]
        }));
        break;
      }

      case "cycle": {
        const maxCycleLen = Math.max(...group.map((p) => p.metrics?.cycleLength ?? 0));
        skills.push(createValidatedSkill({
          id: `skill.${slug(projectId)}.cycle_break_strategy.${idSuffix}`,
          projectId,
          name: "循环依赖打破策略",
          intent: "break_circular_dependency",
          signals: ["循环依赖", "cycle", "circular", "依赖环", "打破"],
          inputProperties: {
            nodeIds: { type: "array" },
            cycleLength: { type: "number" },
            codeGraphPatternId: { type: "string" }
          },
          outputProperties: {
            recommendedBreakPoint: { type: "string" },
            breakStrategy: { type: "string" },
            expectedPostBreakStructure: { type: "string" }
          },
          skillLevel: "functional",
          notes: [
            `来源: ${group.length} 个 CodeGraphPattern (${patternIds.join(", ")})`,
            `循环: ${labels}`,
            `最长环长度: ${maxCycleLen}`,
            "通过接口抽象或依赖注入打破循环",
            ...bounds
          ]
        }));
        break;
      }

      case "leaf": {
        const totalFanIn = group.reduce((sum, p) => sum + (p.metrics?.fanIn ?? 0), 0);
        skills.push(createValidatedSkill({
          id: `skill.${slug(projectId)}.leaf_extract_atomic.${idSuffix}`,
          projectId,
          name: "叶子节点原子 Skill 提取",
          intent: "extract_leaf_to_atomic_skill",
          signals: ["叶子", "leaf", "原子", "提取", "可复用"],
          inputProperties: {
            nodeId: { type: "string" },
            fanIn: { type: "number" },
            sourceFilePath: { type: "string" }
          },
          outputProperties: {
            extractedSkillId: { type: "string" },
            inputSchema: { type: "object" },
            outputSchema: { type: "object" }
          },
          skillLevel: "atomic",
          notes: [
            `来源: ${group.length} 个 CodeGraphPattern (${patternIds.join(", ")})`,
            `叶子节点: ${labels}`,
            `总被引用次数: ${totalFanIn}`,
            "叶子节点影响范围可控，适合提取为可复用原子 Skill",
            ...bounds
          ]
        }));
        break;
      }

      case "bridge": {
        const totalClusterA = group.reduce((sum, p) => sum + (p.metrics?.clusterASize ?? 0), 0);
        const totalClusterB = group.reduce((sum, p) => sum + (p.metrics?.clusterBSize ?? 0), 0);
        skills.push(createValidatedSkill({
          id: `skill.${slug(projectId)}.bridge_protection_guard.${idSuffix}`,
          projectId,
          name: "桥节点保护守卫",
          intent: "protect_bridge_node",
          signals: ["桥", "bridge", "关键路径", "模块连接", "保护"],
          inputProperties: {
            nodeId: { type: "string" },
            clusterASize: { type: "number" },
            clusterBSize: { type: "number" },
            proposedChange: { type: "string" }
          },
          outputProperties: {
            safeToModify: { type: "boolean" },
            alternativePaths: { type: "array" },
            requiredPrecautions: { type: "array" }
          },
          skillLevel: "functional",
          notes: [
            `来源: ${group.length} 个 CodeGraphPattern (${patternIds.join(", ")})`,
            `桥节点: ${labels}`,
            `连接节点总数: ${totalClusterA}+${totalClusterB}`,
            "桥节点是架构关键路径，修改前必须有替代通信方案",
            ...bounds
          ]
        }));
        break;
      }
    }
  }

  return skills;
}

export function validateSelfGeneratedSkill({ projectId, skill }) {
  const issues = validateSkillForProduction(skill);
  if (issues.length > 0) {
    return {
      ok: false,
      wallHit: createWallHit({
        id: `wallhit.${slug(projectId)}.${slug(skill.id)}.${Date.now()}`,
        projectId,
        wallType: wallTypeForIssue(issues[0]),
        stage: STATES.PRODUCTION_VALIDATING,
        message: "自我迭代生成的 Skill 未通过生产验证。",
        blockedBy: issues,
        suggestedFixes: ["补齐 Skill Schema", "补齐触发信号", "补齐降级路径", "保留人类确认"]
      })
    };
  }

  return {
    ok: true,
    artifact: createArtifact({
      id: `artifact.${slug(projectId)}.${slug(skill.id)}.${Date.now()}`,
      projectId,
      title: `${skill.name} Skill Spec`,
      artifactType: "self_generated_skill_spec",
      content: JSON.stringify(skill, null, 2),
      sourceIds: [skill.id]
    })
  };
}

export async function runSelfIteration({ vault, projectId = "project.experience_os_self_iteration" }) {
  const proposals = await proposeSelfIterationSkills({ vault, projectId });
  const existingRuns = await vault.list("SelfIterationRun").catch(() => []);
  const iteration = existingRuns.length + 1;
  const acceptedSkillIds = [];
  const rejectedSkillIds = [];
  const wallHitIds = [];
  const artifactIds = [];
  const candidateSkillIds = [];
  const sourceRecordIds = new Set();

  for (const proposal of proposals) {
    const { skill } = proposal;
    proposal.sourceRecordIds.forEach((id) => sourceRecordIds.add(id));
    candidateSkillIds.push(skill.id);

    const validation = validateSelfGeneratedSkill({ projectId, skill });
    if (validation.ok) {
      acceptedSkillIds.push(skill.id);
      await vault.save(skill);
      artifactIds.push(validation.artifact.id);
      await vault.save(validation.artifact);
    } else {
      rejectedSkillIds.push(skill.id);
      wallHitIds.push(validation.wallHit.id);
      await vault.save(validation.wallHit);
    }
  }

  const run = createSelfIterationRun({
    id: `self_iteration.${slug(projectId)}.${Date.now()}`,
    projectId,
    iteration,
    sourceRecordIds: [...sourceRecordIds],
    candidateSkillIds,
    acceptedSkillIds,
    rejectedSkillIds,
    wallHitIds,
    artifactIds,
    summary: [
      `候选 Skill: ${candidateSkillIds.length}`,
      `通过验证: ${acceptedSkillIds.length}`,
      `拒绝入库: ${rejectedSkillIds.length}`,
      `撞墙: ${wallHitIds.length}`,
      `来源资产: ${sourceRecordIds.size}`
    ].join("\n")
  });
  await vault.save(run);
  await updateReuseContextOutcomes({ vault, run });
  return run;
}

async function updateReuseContextOutcomes({ vault, run }) {
  const reuseContextIds = run.sourceRecordIds.filter((id) => id.startsWith("reuse."));
  // A contribution candidate is only "used" if the run actually consumed its
  // underlying record. The previous implementation stamped every candidate on
  // the reuse context as used_as_self_iteration_context, even records the run
  // never touched — corrupting the reuse feedback signal.
  const consumedIds = new Set([
    ...run.sourceRecordIds,
    ...run.candidateSkillIds,
    ...run.acceptedSkillIds
  ]);

  for (const reuseContextId of reuseContextIds) {
    const context = await vault.load("ReuseContext", reuseContextId).catch(() => null);
    if (!context?.contributionCandidates?.length) continue;
    await vault.save({
      ...context,
      contributionCandidates: context.contributionCandidates.map((candidate) => {
        if (!consumedIds.has(candidate.id)) return candidate;
        return {
          ...candidate,
          usedInRunIds: [...new Set([...(candidate.usedInRunIds ?? []), run.id])],
          outcome: "used_as_self_iteration_context"
        };
      }),
      updatedAt: new Date().toISOString()
    });
  }
}
