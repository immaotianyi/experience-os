/**
 * Centralized vault path resolution for Experience OS.
 *
 * Why this exists (3.0 阶段 0):
 *   Before this module, every demo/verify script wrote directly into
 *   `work/vaults/` — the same vault the web UI and real projects use.
 *   That meant simulated transactions, demo skills and test wall-hits
 *   polluted marketplace stats, quality ratings and revenue numbers,
 *   making it impossible to tell prototype noise from real adoption.
 *
 *   Now demo/verify scripts default to `work/fixtures/` (isolated), while
 *   the web server and real project entry points default to `work/vaults/`.
 *   Either can be overridden with the `EOS_VAULT_DIR` environment variable.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Resolve the vault directory.
 *
 * @param {"demo"|"real"} [scope="demo"]
 *   - "demo":  used by demo/verify scripts → defaults to `work/fixtures`
 *   - "real":  used by web server / real project entry → defaults to `work/vaults`
 * @returns {string} absolute path to the vault directory
 */
export function resolveVaultDir(scope = "demo") {
  const env = process.env.EOS_VAULT_DIR;
  if (env && env.trim()) {
    return path.resolve(env);
  }
  if (scope === "real") {
    return path.join(projectRoot, "work", "vaults");
  }
  return path.join(projectRoot, "work", "fixtures");
}

/**
 * Resolve the archive directory for archived vaults.
 * Defaults to `work/vault-archive` but can be overridden with `EOS_VAULT_ARCHIVE_DIR`.
 */
export function resolveArchiveDir() {
  const env = process.env.EOS_VAULT_ARCHIVE_DIR;
  if (env && env.trim()) {
    return path.resolve(env);
  }
  return path.join(projectRoot, "work", "vault-archive");
}

export { projectRoot };
