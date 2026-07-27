/**
 * Quality Rating — C1: Experience Asset Quality Rating.
 *
 * Extends the Skill registry's quality scoring with marketplace dimensions
 * (downloads, ratings, revenue) and provides rating submission + auto-flag
 * for low-grade Skills.
 *
 * Scoring dimensions (market-aware):
 * - Usage frequency (25%): reuseCount + downloadCount
 * - Approval rate (20%): review approval percentage
 * - Review depth (20%): reviewCount + ratingCount
 * - Market traction (20%): downloads + revenue
 * - Activity (15%): recent updates + git commits
 *
 * Grade thresholds: S (90+) / A (80+) / B (70+) / C (60+) / D (<60)
 * Skills below C grade are auto-flagged as needs_revision.
 */

import { createSkillRating } from "./domain.js";
import { slug } from "./utils.js";
import { randomBytes } from "node:crypto";
const nonce = (n = 4) => randomBytes(n).toString("hex");
import { syncListingRatings } from "./marketplace.js";

const TRIAL_RATING_WEIGHT = 0.5;

/**
 * Submit a user rating for a Skill.
 * One rating per (skillId, userId) — re-rating replaces the previous score.
 *
 * @param {Object} vault - GitVault instance
 * @param {Object} params
 * @param {string} params.skillId
 * @param {string} params.userId
 * @param {number} params.score - 1 to 5
 * @param {string} [params.review]
 * @param {string} [params.projectId]
 * @returns {Promise<Object>} The created SkillRating record
 */
export async function submitRating(vault, { skillId, userId, score, review = "", projectId = "marketplace" }) {
  if (!skillId || typeof skillId !== "string") {
    throw new Error("skillId is required");
  }
  if (!userId || typeof userId !== "string") {
    throw new Error("userId is required");
  }
  if (!Number.isFinite(score) || score < 1 || score > 5) {
    throw new Error("score must be a number between 1 and 5");
  }

  // All check-then-act logic inside the write lock to prevent TOCTOU race conditions
  // where two concurrent requests could both pass the "no prior rating" check
  // and create duplicate ratings.
  const doSubmit = async () => {
    // Check for existing rating by same user on same skill — replace if found
    const existing = await vault.list("SkillRating");
    const prior = existing.find(
      (r) => r.skillId === skillId && r.userId === userId
    );

    if (prior) {
      // Preserve original createdAt; update review fields
      prior.score = score;
      prior.review = review;
      prior.updatedAt = new Date().toISOString();
      await vault.save(prior);
      await syncListingRatings(vault, skillId);
      return prior;
    }

    const id = `rating.${slug(skillId)}.${slug(userId)}.${Date.now()}.${nonce()}`;
    const rating = createSkillRating({ id, projectId, skillId, userId, score, review });
    await vault.save(rating);
    await syncListingRatings(vault, skillId);
    return rating;
  };

  if (typeof vault.withWriteLock === "function") {
    return vault.withWriteLock(doSubmit);
  }
  return doSubmit();
}

/**
 * Get rating summary for a Skill.
 *
 * @param {Object} vault
 * @param {string} skillId
 * @returns {Promise<Object>} { average, count, distribution, ratings }
 */
export async function getRatingSummary(vault, skillId) {
  if (!skillId || typeof skillId !== "string") {
    throw new Error("skillId is required");
  }
  const all = await vault.list("SkillRating");
  const ratings = all.filter((r) => r.skillId === skillId);

  if (ratings.length === 0) {
    return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, ratings: [] };
  }

  const sum = ratings.reduce((acc, r) => acc + r.score, 0);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings) {
    // Clamp score to integer 1-5 for distribution to handle non-integer scores
    const bucket = Math.max(1, Math.min(5, Math.round(r.score)));
    distribution[bucket] = (distribution[bucket] || 0) + 1;
  }

  return {
    average: Math.round((sum / ratings.length) * 100) / 100,
    count: ratings.length,
    distribution,
    ratings: ratings.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  };
}

/**
 * Compute market-aware quality score for a Skill.
 * Combines registry signals (usage, approval, reviews) with marketplace
 * signals (downloads, ratings, revenue).
 *
 * @param {Object} params
 * @param {number} params.reuseCount
 * @param {number} params.approvalPct - 0 to 1
 * @param {number} params.reviewCount
 * @param {number} params.downloadCount
 * @param {number} params.ratingCount
 * @param {number} params.ratingAverage - 0 to 5
 * @param {number} params.revenue
 * @param {number} [params.gitCommits]
 * @returns {number} score 0-100
 */
export function computeMarketQualityScore({
  reuseCount,
  approvalPct,
  reviewCount,
  downloadCount,
  ratingCount,
  ratingAverage,
  revenue,
  gitCommits = 0
}) {
  // Usage frequency (25%): reuse + downloads
  const usageScore = Math.min((reuseCount * 5 + downloadCount * 0.5), 25);

  // Approval rate (20%) — clamp to [0,1] to prevent scores exceeding 100
  const clampedApproval = Math.max(0, Math.min(1, approvalPct || 0));
  const approvalScore = clampedApproval * 20;

  // Review depth (20%): reviews + ratings
  const reviewDepthScore = Math.min((reviewCount * 3 + ratingCount * 2), 20);

  // Market traction (20%): downloads + revenue + rating quality
  const ratingQuality = ratingCount > 0 ? (ratingAverage / 5) * 10 : 0;
  const tractionScore = Math.min((downloadCount * 0.2 + Math.log10(revenue + 1) * 5 + ratingQuality), 20);

  // Activity (15%): git commits + recent interaction
  const activityScore = Math.min((gitCommits * 2 + reviewCount + ratingCount), 15);

  return Math.round(usageScore + approvalScore + reviewDepthScore + tractionScore + activityScore);
}

/**
 * Compute quality grade from score.
 */
export function computeQualityGrade(score) {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

/**
 * Build a market-aware quality report for a single Skill.
 *
 * @param {Object} vault
 * @param {string} skillId
 * @returns {Promise<Object>} { skillId, score, grade, signals, shouldFlag }
 */
export async function getSkillQualityReport(vault, skillId) {
  if (!skillId || typeof skillId !== "string") {
    throw new Error("skillId is required");
  }
  const skill = await vault.load("Skill", skillId).catch(() => null);
  if (!skill) return null;

  // Registry signals
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
  const approvalPct = reviewDecisions.length > 0 ? approved / reviewDecisions.length : 0;

  // Marketplace signals — read from ALL listings (not just active) for downloads/revenue
  const allListings = (await vault.list("MarketplaceListing")).filter(
    (l) => l.skillId === skillId
  );
  const downloadCount = allListings.reduce((acc, l) => acc + (l.downloads || 0), 0);
  const revenue = allListings.reduce((acc, l) => acc + (l.revenue || 0), 0);

  // Ratings — read directly from SkillRating records for accuracy (not listing cache)
  const ratings = (await vault.list("SkillRating")).filter((r) => r.skillId === skillId);
  const ratingCount = ratings.length;
  const ratingSum = ratings.reduce((acc, r) => acc + r.score, 0);
  const ratingAverage = ratingCount > 0 ? ratingSum / ratingCount : 0;

  const gitHistory = vault.history ? vault.history(skillId) : [];

  const score = computeMarketQualityScore({
    reuseCount: reuseContexts.length,
    approvalPct,
    reviewCount: reviewPackets.length,
    downloadCount,
    ratingCount,
    ratingAverage,
    revenue,
    gitCommits: gitHistory.length
  });

  const grade = computeQualityGrade(score);

  return {
    skillId,
    skillName: skill.name,
    skillStatus: skill.status,
    score,
    grade,
    shouldFlag: grade === "D" && skill.status === "stable",
    signals: {
      reuseCount: reuseContexts.length,
      reviewCount: reviewPackets.length,
      approvalRate: Math.round(approvalPct * 100),
      downloadCount,
      ratingCount,
      ratingAverage: Math.round(ratingAverage * 100) / 100,
      revenue,
      gitCommits: gitHistory.length
    }
  };
}

/**
 * Scan all stable Skills and flag those with D grade as needs_revision.
 * Returns the list of flagged Skills.
 *
 * @param {Object} vault
 * @returns {Promise<Array<Object>>} flagged skills
 */
export async function autoFlagLowQuality(vault) {
  const skills = await vault.list("Skill");
  const stable = skills.filter((s) => s.status === "stable");

  const flagged = [];

  const doFlag = async () => {
    for (const skill of stable) {
      const report = await getSkillQualityReport(vault, skill.id);
      if (report && report.shouldFlag) {
        skill.status = "needs_revision";
        skill.promotionGate = "quality_below_threshold";
        skill.updatedAt = new Date().toISOString();
        await vault.save(skill);
        flagged.push({ skillId: skill.id, skillName: skill.name, score: report.score, grade: report.grade });
      }
    }
  };

  if (typeof vault.withTransaction === "function") {
    await vault.withTransaction(doFlag, { message: "[Quality] auto-flag low quality" });
  } else if (typeof vault.withWriteLock === "function") {
    await vault.withWriteLock(doFlag);
  } else {
    await doFlag();
  }

  return flagged;
}

/**
 * Get quality leaderboard — top Skills by market quality score.
 *
 * @param {Object} vault
 * @param {number} [limit=10]
 * @returns {Promise<Array<Object>>}
 */
export async function getQualityLeaderboard(vault, limit = 10) {
  const safeLimit = Math.max(1, Math.min(500, Math.floor(Number(limit) || 10)));
  const skills = await vault.list("Skill");
  const stable = skills.filter((s) => s.status === "stable" || s.status === "needs_revision");

  const reports = [];
  for (const skill of stable) {
    const report = await getSkillQualityReport(vault, skill.id);
    if (report) reports.push(report);
  }

  return reports
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit);
}
