/**
 * Read-only Alpha evidence report for one bootstrapped EOS workspace.
 *
 * This is deliberately not a score. It reports what happened, separates
 * direct-API and agent-hosted real-model evidence from rehearsal data, and
 * says which proof is missing.
 */

import { fileURLToPath } from "node:url";
import { GitVault } from "./gitVault.js";
import { getProjectTrialEvidence } from "./projectEngine.js";
import { resolveWorkspaceWorkbench } from "./eosWorkbench.js";

export async function collectAlphaEvidence({ workspaceDir } = {}) {
  const config = await resolveWorkspaceWorkbench({ workspaceDir });
  const vault = new GitVault(config.vaultDir);
  await vault.init();

  const [project, events, checkpoints, drafts, assets, evidence] = await Promise.all([
    vault.load("Project", config.projectId),
    vault.list("ConversationEvent"),
    vault.list("WorkCheckpoint"),
    vault.list("ExperienceReceiptDraft"),
    vault.list("ExperienceAsset"),
    getProjectTrialEvidence(vault, config.projectId)
  ]);
  const projectEvents = events.filter((record) => record.projectId === config.projectId);
  const projectCheckpoints = checkpoints.filter((record) => record.projectId === config.projectId);
  const projectDrafts = drafts.filter((record) => record.projectId === config.projectId);
  const projectAssets = assets.filter((record) => record.projectId === config.projectId);
  const draftStatuses = Object.fromEntries(
    ["pending_review", "deferred", "accepted", "rejected"].map((status) => [
      status,
      projectDrafts.filter((draft) => draft.status === status).length
    ])
  );
  const liveDrafts = projectDrafts.filter((draft) => draft.generatedBy?.mode === "live").length;
  const agentHostedDrafts = projectDrafts.filter((draft) => draft.generatedBy?.mode === "agent_hosted").length;
  const rehearsalDrafts = projectDrafts.filter((draft) => draft.generatedBy?.mode === "rehearsal" || !draft.generatedBy?.mode).length;
  const realAiDrafts = liveDrafts + agentHostedDrafts;
  const strictPermitBackedCheckpoints = projectCheckpoints.filter((checkpoint) => typeof checkpoint.capturePermitId === "string" && checkpoint.capturePermitId.trim()).length;

  const missingEvidence = [
    ...(projectCheckpoints.length === 0 ? ["尚无工作节点：无法验证捕获入口是否降低了记录成本。"] : []),
    ...(realAiDrafts === 0 ? ["尚无真实 AI 草案：离线演练不能证明真实模型质量。"] : []),
    ...(draftStatuses.accepted + draftStatuses.rejected + draftStatuses.deferred === 0 ? ["尚无人工处理过的草案：无法验证审查成本或人类判断路径。"] : []),
    ...(evidence.verification.approvedAssets === 0 ? ["尚无经真实结果验证并升级的经验资产。"] : []),
    ...(evidence.reuseTrials?.total === 0 ? ["尚无跨项目经验被采用到具体任务的复用试验。"] : []),
    ...(evidence.reuseTrials?.reducedRepeatedDecision === 0 ? ["尚无已完成的复用试验证明减少了重复判断。"] : [])
  ];

  return {
    kind: "EOSAlphaEvidenceReport",
    generatedAt: new Date().toISOString(),
    workspace: config.workspace,
    project: project ? { id: project.id, name: project.name, goal: project.goal } : null,
    capture: {
      consentedEvents: projectEvents.filter((event) => event.consented === true).length,
      workCheckpoints: projectCheckpoints.length,
      strictPermitBackedCheckpoints
    },
    modelDrafts: {
      total: projectDrafts.length,
      live: liveDrafts,
      agentHosted: agentHostedDrafts,
      rehearsal: rehearsalDrafts,
      byStatus: draftStatuses
    },
    verification: evidence.verification,
    reuseFeedback: evidence.reuseFeedback,
    reuseTrials: evidence.reuseTrials,
    valueClaimAllowed: evidence.interpretation.isSufficientForValueClaim && realAiDrafts > 0,
    missingEvidence
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [workspaceDir] = process.argv.slice(2);
  collectAlphaEvidence({ workspaceDir })
    .then((report) => console.log(JSON.stringify(report, null, 2)))
    .catch((error) => {
      console.error(`EOS Alpha evidence check failed: ${error.message}`);
      process.exitCode = 1;
    });
}
