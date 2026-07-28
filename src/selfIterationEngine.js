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

  const seen = new Set();
  const skills = [];

  for (const pattern of patterns) {
    const skillType = pattern.suggestedSkillType || `pattern_${pattern.patternType}`;
    if (seen.has(skillType)) continue;
    seen.add(skillType);

    switch (pattern.patternType) {
      case "hub":
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
            `来源: CodeGraphPattern ${pattern.id}`,
            `枢纽节点 ${pattern.label} 的 fanIn=${pattern.metrics?.fanIn ?? "unknown"}`,
            "变更前必须枚举全部调用方并评估影响",
            pattern.applicabilityBounds?.join("；") || "无适用边界声明"
          ]
        }));
        break;

      case "hotspot":
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
            `来源: CodeGraphPattern ${pattern.id}`,
            `热点 ${pattern.label} fanOut=${pattern.metrics?.fanOut ?? "?"} complexity=${pattern.metrics?.complexity ?? "?"}`,
            "重构前必须先补齐测试覆盖并拆分耦合点",
            pattern.applicabilityBounds?.join("；") || "无适用边界声明"
          ]
        }));
        break;

      case "cycle":
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
            `来源: CodeGraphPattern ${pattern.id}`,
            `循环: ${pattern.label}`,
            `环长度: ${pattern.metrics?.cycleLength ?? "?"}`,
            "通过接口抽象或依赖注入打破循环",
            pattern.applicabilityBounds?.join("；") || "无适用边界声明"
          ]
        }));
        break;

      case "leaf":
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
            `来源: CodeGraphPattern ${pattern.id}`,
            `叶子节点 ${pattern.label} 被 ${pattern.metrics?.fanIn ?? "?"} 处引用`,
            "叶子节点影响范围可控，适合提取为可复用原子 Skill",
            pattern.applicabilityBounds?.join("；") || "无适用边界声明"
          ]
        }));
        break;

      case "bridge":
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
            `来源: CodeGraphPattern ${pattern.id}`,
            `桥节点 ${pattern.label} 连接 ${pattern.metrics?.clusterASize ?? "?"}+${pattern.metrics?.clusterBSize ?? "?"} 节点`,
            "桥节点是架构关键路径，修改前必须有替代通信方案",
            pattern.applicabilityBounds?.join("；") || "无适用边界声明"
          ]
        }));
        break;
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
