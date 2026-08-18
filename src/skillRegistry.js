/**
 * Skill Registry — local and remote Skill discovery, indexing, and import.
 *
 * The registry maintains an index of all stable Skills in the Vault,
 * with metadata for search, filtering, and marketplace operations.
 *
 * Features:
 * - buildLocalIndex(): scans Vault for all stable Skills, returns indexed entries
 * - search(query): searches by name, tags, skillLevel, origin
 * - importSkill(skillData): imports an external Skill as a candidate
 * - getSkillMetadata(skillId): returns usage stats, review history summary
 * - listCategories(): returns unique tags/categories across all Skills
 *
 * The registry does NOT store data itself — it reads from the Vault
 * and computes indices on demand. Results are cached per-session.
 */

import { slug } from "./utils.js";
import { inspectSkillPortability } from "./skillCompiler.js";

/**
 * Build a local index of all stable Skills in the Vault.
 *
 * @param {Object} vault - GitVault instance
 * @returns {Promise<Array<SkillIndexEntry>>}
 */
export async function buildLocalIndex(vault) {
  const skills = await vault.list("Skill");
  const wallHits = await vault.list("WallHit");
  const reviewPackets = await vault.list("ReviewPacket");
  const reviewDecisions = await vault.list("ReviewDecision");
  const reuseContexts = await vault.list("ReuseContext");

  const wallHitCount = new Map();
  for (const w of wallHits) {
    if (w.projectId) {
      // Count wallhits per project for skill health
    }
  }

  const reviewCount = new Map();
  const approvalRate = new Map();
  for (const rp of reviewPackets) {
    if (rp.targetKind === "Skill") {
      reviewCount.set(rp.targetId, (reviewCount.get(rp.targetId) || 0) + 1);
    }
  }
  for (const rd of reviewDecisions) {
    if (rd.targetKind === "Skill") {
      const key = rd.targetId;
      if (!approvalRate.has(key)) {
        approvalRate.set(key, { approved: 0, total: 0 });
      }
      const rate = approvalRate.get(key);
      rate.total += 1;
      if (rd.decision === "approve_candidate" || rd.decision === "promote_stable") {
        rate.approved += 1;
      }
    }
  }

  const usageCount = new Map();
  for (const rc of reuseContexts) {
    for (const rec of (rc.recommendedSkillIds || [])) {
      usageCount.set(rec, (usageCount.get(rec) || 0) + 1);
    }
  }

  return skills.map((skill) => {
    const reviews = reviewCount.get(skill.id) || 0;
    const rate = approvalRate.get(skill.id) || { approved: 0, total: 0 };
    const usage = usageCount.get(skill.id) || 0;
    const approvalPct = rate.total > 0 ? rate.approved / rate.total : 0;
    const portability = inspectSkillPortability(skill);

    return {
      id: skill.id,
      name: skill.name,
      status: skill.status,
      skillLevel: skill.skillLevel,
      origin: skill.origin,
      safetyLevel: skill.safetyLevel,
      humanConfirmationRequired: skill.humanConfirmationRequired,
      tags: extractTags(skill),
      triggerIntent: skill.trigger?.intent || "",
      signals: skill.trigger?.signals || [],
      reviewCount: reviews,
      approvalRate: Math.round(approvalPct * 100),
      usageCount: usage,
      ...(() => {
        const score = computeQualityScore({ reviews, approvalPct, usage });
        return { qualityScore: score, qualityGrade: computeQualityGrade(score) };
      })(),
      mcpExportable: portability.ready,
      distributionReady: portability.ready,
      distributionBlockers: portability.blockers,
      distributionWarnings: portability.warnings,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
      projectId: skill.projectId
    };
  });
}

/**
 * Search the skill index by query and filters.
 *
 * @param {Array<SkillIndexEntry>} index - Pre-built index
 * @param {Object} options
 * @param {string} [options.query] - Full-text search on name, tags, triggerIntent
 * @param {string} [options.skillLevel] - Filter by skillLevel
 * @param {string} [options.status] - Filter by status
 * @param {number} [options.limit] - Max results (default 20)
 * @param {string} [options.sortBy] - "quality" (default), "usage", "recent", "name"
 * @returns {Array<SkillIndexEntry>}
 */
export function searchIndex(index, options = {}) {
  const { query, skillLevel, status, limit = 20, sortBy = "quality" } = options;

  let results = [...index];

  if (query) {
    const q = query.toLowerCase();
    results = results.filter((entry) => {
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.triggerIntent.toLowerCase().includes(q) ||
        entry.tags.some((t) => t.toLowerCase().includes(q)) ||
        entry.signals.some((s) => s.toLowerCase().includes(q))
      );
    });
  }

  if (skillLevel) {
    results = results.filter((e) => e.skillLevel === skillLevel);
  }

  if (status) {
    results = results.filter((e) => e.status === status);
  }

  switch (sortBy) {
    case "usage":
      results.sort((a, b) => b.usageCount - a.usageCount);
      break;
    case "recent":
      results.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
      break;
    case "name":
      results.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "quality":
    default:
      results.sort((a, b) => b.qualityScore - a.qualityScore);
      break;
  }

  return results.slice(0, limit);
}

/**
 * Import an external Skill as a candidate.
 * The imported Skill goes through the normal review process.
 *
 * @param {Object} params
 * @param {Object} params.vault - GitVault instance
 * @param {Object} params.skillData - External skill data (from MCP marketplace or JSON)
 * @param {string} params.projectId - Target project
 * @param {string} [params.source] - Source description (e.g., "mcp:claude-marketplace")
 * @returns {Promise<Object>} The created candidate Skill record
 */
export async function importSkill({ vault, skillData, projectId, source = "external" }) {
  if (!skillData || typeof skillData !== "object" || Array.isArray(skillData)) {
    throw new Error("skillData must be a non-null object");
  }
  if (typeof skillData.name !== "string" || !skillData.name.trim()) {
    throw new Error("skillData.name must be a non-empty string");
  }
  if (typeof projectId !== "string" || !projectId.trim()) {
    throw new Error("projectId is required and must be a non-empty string");
  }

  const { createSkillCandidate } = await import("./domain.js");

  const id = `skill.imported.${slug(skillData.name)}.${Date.now()}`;
  const skill = createSkillCandidate({
    id,
    projectId,
    name: skillData.name,
    origin: source,
    trigger: skillData.trigger || { intent: skillData.description || skillData.name, signals: [] },
    inputSchema: skillData.inputSchema || { type: "object", properties: {} },
    outputSchema: skillData.outputSchema || { type: "object", properties: {} },
    safetyLevel: skillData.safetyLevel || "L2",
    fallback: skillData.fallback || "Return error message to caller",
    humanConfirmationRequired: skillData.humanConfirmationRequired ?? true,
    skillLevel: skillData.skillLevel || "functional",
    version: skillData.version || "0.1.0",
    instructions: skillData.instructions || skillData.prompt || null,
    evidenceLinkIds: skillData.evidenceLinkIds || [],
    appliesTo: skillData.appliesTo,
    activation: skillData.activation,
    capabilities: skillData.capabilities,
    targetOverrides: skillData.targetOverrides || {},
    degradation: skillData.degradation,
    executionBinding: skillData.executionBinding || null,
    validationPlan: skillData.validationPlan,
    compatibilityReceipts: []
  });

  // Imported skills start as candidates and must go through review
  skill.adaptationNotes = [`Imported from ${source} at ${new Date().toISOString()}`];
  skill.candidateReason = "imported";

  await vault.save(skill);
  return skill;
}

/**
 * Get detailed metadata for a single Skill.
 *
 * @param {Object} vault - GitVault instance
 * @param {string} skillId
 * @returns {Promise<Object|null>}
 */
export async function getSkillMetadata(vault, skillId) {
  const skill = await vault.load("Skill", skillId).catch(() => null);
  if (!skill) return null;

  const reviewPackets = (await vault.list("ReviewPacket")).filter(
    (rp) => rp.targetKind === "Skill" && rp.targetId === skillId
  );
  const reviewDecisions = (await vault.list("ReviewDecision")).filter(
    (rd) => rd.targetKind === "Skill" && rd.targetId === skillId
  );

  const reuseContexts = (await vault.list("ReuseContext")).filter(
    (rc) => (rc.recommendedSkillIds || []).includes(skillId)
  );

  const approved = reviewDecisions.filter(
    (rd) => rd.decision === "approve_candidate" || rd.decision === "promote_stable"
  ).length;

  const gitHistory = vault.history(skillId);

  return {
    skill,
    reviewHistory: reviewPackets.map((rp) => ({
      packet: rp,
      decision: reviewDecisions.find((rd) => rd.reviewPacketId === rp.id) || null
    })),
    stats: {
      totalReviews: reviewPackets.length,
      totalDecisions: reviewDecisions.length,
      approvalRate: reviewDecisions.length > 0 ? Math.round((approved / reviewDecisions.length) * 100) : 0,
      reuseCount: reuseContexts.length,
      gitCommits: gitHistory.length,
      lastModified: gitHistory[0]?.date || skill.updatedAt
    },
    gitHistory: gitHistory.slice(0, 10)
  };
}

/**
 * List all unique tags/categories across the skill index.
 *
 * @param {Array<SkillIndexEntry>} index
 * @returns {Array<{tag: string, count: number}>}
 */
export function listCategories(index) {
  const counts = new Map();
  for (const entry of index) {
    for (const tag of entry.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// ============================================================================
// Helpers
// ============================================================================

function extractTags(skill) {
  const tags = new Set();
  if (skill.skillLevel) tags.add(skill.skillLevel);
  if (skill.safetyLevel) tags.add(skill.safetyLevel);
  if (skill.origin) tags.add(skill.origin);
  for (const signal of (skill.trigger?.signals || [])) {
    tags.add(signal);
  }
  return [...tags];
}

function computeQualityScore({ reviews, approvalPct, usage }) {
  // Weighted: usage (30%) + approval (25%) + reviews (25%) + activity (20%)
  const usageScore = Math.min(usage * 10, 30);
  const approvalScore = approvalPct * 25;
  const reviewScore = Math.min(reviews * 5, 25);
  const activityScore = Math.min((reviews + usage) * 2, 20);
  return Math.round(usageScore + approvalScore + reviewScore + activityScore);
}

function computeQualityGrade(score) {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}
