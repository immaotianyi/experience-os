import path from "node:path";
import { createSelfIterationRun, createSkillCandidate } from "./domain.js";
import { validateSelfGeneratedSkill } from "./selfIterationEngine.js";
import { GitVault } from "./gitVault.js";
import { resolveVaultDir } from "./vaultPath.js";

const rootDir = resolveVaultDir("demo");
const vault = new GitVault(rootDir);
const projectId = "project.experience_os_self_iteration_failure_probe";

await vault.init();

const invalidSkill = createSkillCandidate({
  id: "skill.project_experience_os_self_iteration_failure_probe.invalid_auto_skill",
  projectId,
  name: "失败路径探针 Skill",
  origin: "self_iteration",
  trigger: {
    intent: "probe_self_iteration_failure_path",
    signals: []
  },
  inputSchema: null,
  outputSchema: null,
  safetyLevel: "L1",
  fallback: "",
  humanConfirmationRequired: true,
  skillLevel: "atomic",
  memoryUtility: {
    expectedUse: "验证自迭代失败候选不会污染 Skill 库。",
    evaluationSignal: "必须生成 WallHit，且不保存 invalid Skill。"
  },
  adaptationNotes: ["failure_probe", "do_not_persist_invalid_skill"]
});

const validation = validateSelfGeneratedSkill({ projectId, skill: invalidSkill });
if (validation.ok) {
  throw new Error("Failure probe unexpectedly passed production validation.");
}

await vault.save(validation.wallHit);

const run = createSelfIterationRun({
  id: `self_iteration.project_experience_os_self_iteration_failure_probe.${Date.now()}`,
  projectId,
  sourceRecordIds: [],
  candidateSkillIds: [invalidSkill.id],
  acceptedSkillIds: [],
  rejectedSkillIds: [invalidSkill.id],
  wallHitIds: [validation.wallHit.id],
  artifactIds: [],
  summary: [
    "候选 Skill: 1",
    "通过验证: 0",
    "拒绝入库: 1",
    "撞墙: 1",
    "来源资产: 0"
  ].join("\n")
});

await vault.save(run);

const persistedInvalidSkill = await vault.load("Skill", invalidSkill.id).catch(() => null);
if (persistedInvalidSkill) {
  throw new Error("Invalid self-iteration Skill was persisted to the Skill vault.");
}

console.log(JSON.stringify({
  vault: rootDir,
  selfIterationRunId: run.id,
  candidateSkillIds: run.candidateSkillIds,
  acceptedSkillIds: run.acceptedSkillIds,
  rejectedSkillIds: run.rejectedSkillIds,
  wallHitIds: run.wallHitIds,
  invalidSkillPersisted: false,
  wallHit: {
    id: validation.wallHit.id,
    wallType: validation.wallHit.wallType,
    blockedBy: validation.wallHit.blockedBy
  }
}, null, 2));
