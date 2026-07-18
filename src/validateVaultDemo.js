import path from "node:path";
import { Vault } from "./vault.js";
import { validateVault } from "./validate.js";
import { resolveVaultDir } from "./vaultPath.js";

const rootDir = resolveVaultDir("demo");
const vault = new Vault(rootDir);

await vault.init();

const report = await validateVault(vault);
console.log(JSON.stringify({
  vault: rootDir,
  valid: report.valid,
  checkedCount: report.checkedCount,
  supportedCount: report.supportedCount,
  unsupportedCount: report.unsupportedCount,
  unsupportedKinds: report.unsupportedKinds,
  invalidCount: report.invalidCount,
  corruptFileCount: report.corruptFileCount,
  corruptFiles: report.corruptFiles.slice(0, 10),
  invalid: report.invalid.slice(0, 20)
}, null, 2));

if (!report.valid) {
  process.exitCode = 1;
}
