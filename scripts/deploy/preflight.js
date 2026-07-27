import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const failures = [];
const vaultDir = process.env.EOS_VAULT_DIR;
const mode = process.env.EOS_DEPLOYMENT_MODE ?? "local";

if (!existsSync("apps/web/index.html")) failures.push("缺少 apps/web/index.html；请先运行 npm run web:build。");
if (!vaultDir || !vaultDir.startsWith("/")) failures.push("EOS_VAULT_DIR 必须是容器/服务器中的绝对持久化路径。");
if (mode !== "private_beta") failures.push("外部体验阶段仅允许 EOS_DEPLOYMENT_MODE=private_beta，不能用共享公开 Vault 冒充多用户服务。");

try {
  execFileSync("git", ["--version"], { stdio: "ignore" });
} catch {
  failures.push("未检测到 git；GitVault 无法保留经验资产的版本历史。");
}

if (failures.length > 0) {
  console.error("EOS deployment preflight failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    ok: true,
    mode,
    vaultDir,
    archiveDir: process.env.EOS_VAULT_ARCHIVE_DIR ?? null,
    llmProvider: process.env.LLM_PROVIDER ?? "agent_hosted_or_unconfigured",
    note: "仅部署到受邀请测试者；真实协作数据不得进入共享演示 Vault。"
  }, null, 2));
}
