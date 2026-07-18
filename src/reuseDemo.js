import path from "node:path";
import { GitVault } from "./gitVault.js";
import { buildReuseContext } from "./reuseEngine.js";
import { resolveVaultDir } from "./vaultPath.js";

const rootDir = resolveVaultDir("demo");
const vault = new GitVault(rootDir);
const query = process.argv.slice(2).join(" ") || "非线性 思想 工程化 Skill Schema 撞墙反馈";

await vault.init();

const reuseContext = await buildReuseContext({
  vault,
  projectId: "project.next_experience_os_iteration",
  query
});

await vault.save(reuseContext);

console.log(JSON.stringify({
  vault: rootDir,
  reuseContextId: reuseContext.id,
  query,
  summary: reuseContext.summary,
  matchedRecordIds: reuseContext.matchedRecordIds,
  recommendedRuleIds: reuseContext.recommendedRuleIds,
  recommendedSkillIds: reuseContext.recommendedSkillIds,
  recommendedReflectionIds: reuseContext.recommendedReflectionIds,
  recommendedWorkflowIds: reuseContext.recommendedWorkflowIds
}, null, 2));
