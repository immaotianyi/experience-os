import path from "node:path";
import { GitVault } from "./gitVault.js";
import { runPrototype } from "./pipeline.js";
import { resolveVaultDir } from "./vaultPath.js";

const validateOnly = process.argv.includes("--validate-only");
const rootDir = resolveVaultDir("demo");
const vault = new GitVault(rootDir);

const rawThought = [
  "我需要把非线性的思想无失真转移成线性的工程系统。",
  "云端 LLM 的约束主要来自 rules、system instructions、prompts、skills。",
  "协作阶段可以发散，但生产阶段必须进入脚手架、Schema、架构、防御性编程和降级验证。",
  "如果 AI 撞到工程墙壁，必须反馈给人，让人也调整思想。"
].join("\n");

await vault.init();

const result = await runPrototype({
  vault,
  rawThought,
  completeSkill: validateOnly
});

console.log(JSON.stringify({
  vault: rootDir,
  finalState: result.project.state,
  records: Object.fromEntries(
    Object.entries(result).map(([key, value]) => [key, value?.id ?? null])
  ),
  wallHit: result.wallHit
    ? {
        wallType: result.wallHit.wallType,
        message: result.wallHit.message,
        blockedBy: result.wallHit.blockedBy,
        suggestedFixes: result.wallHit.suggestedFixes
      }
    : null
}, null, 2));
