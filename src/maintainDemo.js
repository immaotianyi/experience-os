import path from "node:path";
import { GitVault } from "./gitVault.js";
import { archiveVaultCandidates, buildVaultMaintenancePreview } from "./vaultMaintenance.js";
import { resolveVaultDir } from "./vaultPath.js";

const rootDir = resolveVaultDir("demo");
const vault = new GitVault(rootDir);
await vault.init();

const before = await buildVaultMaintenancePreview(vault);
const limit = Math.max(0, Math.min(Number(process.argv[2] ?? 50) || 0, 100));

console.log(JSON.stringify({
  vault: rootDir,
  before: {
    totalRecords: before.totalRecords,
    totalArchiveCandidates: before.totalArchiveCandidates
  },
  requestedLimit: limit
}, null, 2));

if (limit < 1) {
  console.log(JSON.stringify({ skipped: "limit must be between 1 and 100" }, null, 2));
  process.exit(0);
}

const result = await archiveVaultCandidates({ vault, limit, reason: "npm run maintain" });

console.log(JSON.stringify({
  movedCount: result.manifest.movedCount,
  skippedCount: result.manifest.skippedCount,
  manifestId: result.manifest.id,
  manifestPath: result.manifestPath,
  after: {
    totalRecords: result.after.totalRecords,
    totalArchiveCandidates: result.after.totalArchiveCandidates
  }
}, null, 2));
