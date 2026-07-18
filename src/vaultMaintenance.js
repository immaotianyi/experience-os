import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { latest } from "./utils.js";
import { resolveArchiveDir } from "./vaultPath.js";

const DEFAULT_RETENTION = Object.freeze({
  ReviewPacket: 30,
  ReviewDecision: 30,
  Artifact: 40,
  WallHit: 25,
  ReuseContext: 12,
  SelfIterationRun: 10,
  MotherSkillTrajectory: 20,
  WorkflowPattern: 25,
  PreferenceHypothesis: 25,
  ThoughtFragment: 25,
  ConversationEvent: 25,
  HumanEditLog: 25,
  SubgoalSegment: 25,
  Rule: 25,
  ReflectionMemory: 25
});

export async function buildVaultMaintenancePreview(vault, retention = DEFAULT_RETENTION) {
  const records = await vault.listAll();
  const byKind = groupBy(records, (record) => record.kind);
  const plans = Object.entries(byKind)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([kind, kindRecords]) => {
      const keep = retention[kind] ?? Infinity;
      const sorted = latest(kindRecords);
      const candidates = Number.isFinite(keep) ? sorted.slice(keep) : [];
      return {
        kind,
        count: kindRecords.length,
        keep,
        archiveCandidateCount: candidates.length,
        archiveCandidateIds: candidates.map((record) => record.id)
      };
    });

  return {
    destructive: false,
    policy: "preview_only",
    retention,
    totalRecords: records.length,
    totalArchiveCandidates: plans.reduce((sum, plan) => sum + plan.archiveCandidateCount, 0),
    plans
  };
}

export async function archiveVaultCandidates({
  vault,
  retention = DEFAULT_RETENTION,
  archiveRootDir = resolveArchiveDir(),
  limit = 10,
  reason = "manual_archive"
} = {}) {
  const preview = await buildVaultMaintenancePreview(vault, retention);
  const archiveId = `archive.${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`;
  const manifestDir = path.join(archiveRootDir, "manifests");
  const maxMoves = Math.max(0, Math.min(Number(limit) || 0, 100));
  const candidates = preview.plans
    .flatMap((plan) => plan.archiveCandidateIds.map((id) => ({ kind: plan.kind, id })))
    .slice(0, maxMoves);

  await mkdir(manifestDir, { recursive: true });

  const movedRecords = [];
  const skippedRecords = [];
  for (const candidate of candidates) {
    try {
      const record = await vault.load(candidate.kind, candidate.id);
      const sourcePath = vault.fileFor(record);
      const collectionDir = path.basename(path.dirname(sourcePath));
      const targetDir = path.join(archiveRootDir, collectionDir);
      const targetPath = path.join(targetDir, path.basename(sourcePath));
      await mkdir(targetDir, { recursive: true });
      await rename(sourcePath, targetPath);
      movedRecords.push({
        kind: candidate.kind,
        id: candidate.id,
        from: sourcePath,
        to: targetPath
      });
    } catch (error) {
      skippedRecords.push({
        kind: candidate.kind,
        id: candidate.id,
        reason: error.code ?? error.message
      });
    }
  }

  const manifest = {
    id: archiveId,
    kind: "VaultArchiveManifest",
    policy: "move_to_archive",
    destructive: false,
    createdAt: new Date().toISOString(),
    reason,
    requestedLimit: limit,
    appliedLimit: maxMoves,
    retention,
    before: {
      totalRecords: preview.totalRecords,
      totalArchiveCandidates: preview.totalArchiveCandidates
    },
    movedCount: movedRecords.length,
    skippedCount: skippedRecords.length,
    movedRecords,
    skippedRecords
  };

  const manifestPath = path.join(manifestDir, `${archiveId}.json`);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  if (movedRecords.length > 0 && typeof vault.commitAll === "function") {
    await vault.commitAll(`[VaultArchive] move ${movedRecords.length} records: ${archiveId}`);
  }

  return {
    ok: true,
    manifestPath,
    manifest,
    after: await buildVaultMaintenancePreview(vault, retention)
  };
}

function groupBy(items, getKey) {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    groups[key] ??= [];
    groups[key].push(item);
    return groups;
  }, {});
}
