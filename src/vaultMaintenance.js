/**
 * Vault Maintenance — Vault 归档预览与执行，基于按类型配额的保留策略控制磁盘增长。
 *
 * 做什么：
 *   提供两个操作：buildVaultMaintenancePreview() 非破坏性地统计各类记录总数和超出
 *   保留配额的归档候选数量；archiveVaultCandidates() 将超出配额的最旧记录从 Vault
 *   主目录移动（rename，非删除）到归档目录，并写入一份 JSON manifest 记录本次归档的
 *   全部细节（移动了哪些、跳过了哪些、前后总数对比）。归档是 move 而非 delete，
 *   归档目录可随时查阅或恢复；manifest 自身存在 archiveRootDir/manifests/ 下。
 *
 * 核心抽象：
 *   - 保留策略（retention map）：kind → 保留条数（不是天数）。按 updatedAt/createdAt
 *     倒序排列，保留最新的 N 条，更早的进入归档候选。未在 retention 中出现的 kind
 *     默认 Infinity（永不归档）。
 *   - 两阶段操作：先 preview 生成计划，再 archive 执行。preview 是纯只读的，UI/CLI
 *     可以先展示"将归档 X 条记录"让用户确认后再执行。
 *   - 归档粒度限制：单次 archive 受 limit 参数（默认 10，上限 100）约束，避免一次性
 *     移动大量文件阻塞 IO 或误操作；分批归档更安全。
 *   - VaultArchiveManifest：每次归档生成一个不可变的清单，包含 before/after 快照、
 *     movedRecords（from/to 路径）、skippedRecords（失败原因），作为审计轨迹。
 *
 * DEFAULT_RETENTION 配额依据（按记录信息价值的半衰期分层，假设日均活跃使用）：
 *   - 最易腐的运行时快照（10-12 条，≈1-2 周）：
 *     SelfIterationRun=10：每次自我迭代都产生，记录的是候选/通过/拒绝的批处理结果，
 *       超过 10 轮后早期 run 的候选 Skill 已被后续 run 覆盖或沉淀为正式 Skill。
 *     ReuseContext=12：检索快照，强依赖 query 语境，两周后复用价值急剧衰减。
 *   - 审计轨迹（20 条，≈2-3 周）：
 *     MotherSkillTrajectory=20：母 Skill 编排轨迹，主要用于近因回溯和自我迭代输入，
 *       超过 20 条后可通过归档文件按需查阅，无需常驻主 Vault。
 *   - 经验主干（25 条，≈3-4 周）：
 *     Rule / ReflectionMemory / WorkflowPattern / PreferenceHypothesis /
 *     ThoughtFragment / ConversationEvent / HumanEditLog / SubgoalSegment / WallHit=25：
 *       这些是构成"经验层"的核心记录，是 reuseEngine 检索的主要素材。25 条约覆盖
 *       一个月的有效经验窗口，超出后最旧的经验要么已被沉淀为稳定 Skill，要么已过时。
 *   - 审查周期记录（30 条，≈1 个月）：
 *     ReviewPacket / ReviewDecision=30：人审记录，需要覆盖典型的月度审查周期，
 *       且经常需要回溯"这个 Skill 上次 review 的决定是什么"。
 *   - 持久产物（40 条，≈5-6 周）：
 *     Artifact=40：Skill spec、文档等可交付产物是 Vault 中价值最高的记录，保留最久；
 *       40 条给正式产物留出足够的累积空间，同时仍防止无限增长。
 *
 * 关键不变量：
 *   1. 归档是文件 move（rename），不是 delete；磁盘上数据不丢失，只是移出 Vault 主目录。
 *   2. preview 绝不修改文件系统，archive 不删除数据；归档后仍可通过归档目录恢复。
 *   3. 归档候选按 kind 内时间排序（最新的保留，最旧的归档），不同 kind 之间不做全局 LRU。
 *   4. manifest 一定写入磁盘（即使 movedCount=0，也会记录本次空操作），保证归档历史可审计。
 *   5. vault 实现了 commitAll 时，归档结束后会以 "[VaultArchive]" 前缀提交一次变更。
 *
 * 设计取舍：
 *   - 采用"条数配额"而非"TTL/天数"，因为 Vault 中的时间戳是 ISO 字符串但不保证时钟
 *     完全可靠（手动导入/迁移可能改变 mtime），按条数排序更可预测；条数也直接控制
 *     磁盘使用量。
 *   - 不做压缩/打包归档（如 tar.gz），保持归档目录与 Vault 主目录结构一致（按 kind
 *     分目录存放 JSON 文件），便于人工检查和单条恢复。
 *   - 归档过程中单条失败不中断整体流程（try/catch 记录到 skippedRecords），避免因
 *     一个文件权限问题导致整个归档批次回滚。
 *   - 未提供"从归档恢复"的反向操作，因为 2.0/3.0 阶段恢复场景极少，可通过手动
 *     rename 回来；正式恢复工具留待有明确需求时再加。
 *
 * 不做什么：
 *   - 不自动触发归档（不做定时任务/守护进程），由外部 CLI 或 UI 显式调用。
 *   - 不做内容级 deduplication（相同内容的记录不合并），去重是 reuseEngine 的职责。
 *   - 不做跨 kind 的全局保留策略（例如"Vault 总大小不超过 100MB"），只按 kind 配额。
 *   - 不删除归档文件（归档目录的清理需要人工决策，避免误删不可恢复）。
 */
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
