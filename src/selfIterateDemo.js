import path from "node:path";
import { GitVault } from "./gitVault.js";
import { runSelfIteration } from "./selfIterationEngine.js";
import { resolveVaultDir } from "./vaultPath.js";

const rootDir = resolveVaultDir("demo");
const vault = new GitVault(rootDir);

await vault.init();

const run = await runSelfIteration({ vault });

console.log(JSON.stringify({
  vault: rootDir,
  selfIterationRunId: run.id,
  summary: run.summary,
  sourceRecordIds: run.sourceRecordIds,
  candidateSkillIds: run.candidateSkillIds,
  acceptedSkillIds: run.acceptedSkillIds,
  wallHitIds: run.wallHitIds,
  artifactIds: run.artifactIds
}, null, 2));
