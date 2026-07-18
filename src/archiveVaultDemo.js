import path from "node:path";
import { GitVault } from "./gitVault.js";
import { archiveVaultCandidates, buildVaultMaintenancePreview } from "./vaultMaintenance.js";
import { resolveVaultDir, resolveArchiveDir } from "./vaultPath.js";

const rootDir = resolveVaultDir("demo");
const vault = new GitVault(rootDir);
const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const limit = readLimit(process.argv.slice(2));

await vault.init();

if (!apply) {
  const preview = await buildVaultMaintenancePreview(vault);
  console.log(JSON.stringify({
    mode: "preview",
    vault: rootDir,
    totalRecords: preview.totalRecords,
    totalArchiveCandidates: preview.totalArchiveCandidates,
    topPlans: preview.plans
      .filter((plan) => plan.archiveCandidateCount > 0)
      .slice(0, 10)
  }, null, 2));
} else {
  const result = await archiveVaultCandidates({
    vault,
    limit,
    reason: "cli controlled archive"
  });
  console.log(JSON.stringify({
    mode: "archive",
    vault: rootDir,
    manifestPath: result.manifestPath,
    movedCount: result.manifest.movedCount,
    skippedCount: result.manifest.skippedCount,
    remainingArchiveCandidates: result.after.totalArchiveCandidates
  }, null, 2));
}

function readLimit(values) {
  const raw = values.find((value) => value.startsWith("--limit="));
  const parsed = Number(raw?.split("=")[1] ?? 10);
  return Math.max(1, Math.min(parsed || 10, 100));
}
