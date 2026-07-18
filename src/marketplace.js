/**
 * Marketplace — C3: Skill Marketplace Publishing.
 *
 * Lets stable Skills be published to a local marketplace with version
 * tracking, search, download counting, and rating aggregation.
 *
 * Flow:
 *   stable Skill → publishSkill() → MarketplaceListing (active)
 *                → searchMarketplace() → discovery
 *                → recordDownload() → traction
 *                → unpublishSkill() → MarketplaceListing (unpublished)
 */

import { createMarketplaceListing } from "./domain.js";
import { validatePricing } from "./pricingEngine.js";
import { slug } from "./utils.js";

/**
 * Publish a stable Skill to the marketplace.
 *
 * @param {Object} vault - GitVault instance
 * @param {Object} params
 * @param {string} params.skillId
 * @param {string} [params.sellerId]
 * @param {Object} params.pricing - { model, price, currency, subscriptionPrice? }
 * @param {string} params.license - "MIT" | "Commercial" | "Team"
 * @param {boolean} [params.trialEnabled]
 * @param {string} [params.version]
 * @param {string} [params.summary]
 * @returns {Promise<Object>} The created MarketplaceListing
 */
export async function publishSkill(vault, {
  skillId,
  sellerId = "system",
  pricing,
  license,
  trialEnabled = false,
  version = "1.0.0",
  summary = ""
}) {
  const skill = await vault.load("Skill", skillId).catch(() => null);
  if (!skill) {
    throw new Error(`Skill not found: ${skillId}`);
  }
  if (skill.status !== "stable") {
    throw new Error(`Skill must be stable to publish, current status: ${skill.status}`);
  }

  const pricingIssues = validatePricing(pricing);
  if (pricingIssues.length > 0) {
    throw new Error(`Invalid pricing: ${pricingIssues.join("; ")}`);
  }

  // Check for existing active listing — bump version instead of duplicating
  const existing = await vault.list("MarketplaceListing");
  const priorActive = existing.find(
    (l) => l.skillId === skillId && l.status === "active"
  );
  if (priorActive) {
    throw new Error(`Skill ${skillId} already has an active listing: ${priorActive.id}. Unpublish or bump version first.`);
  }

  const id = `marketplace_listing.${slug(skillId)}.${slug(version)}.${Date.now()}`;
  const listing = createMarketplaceListing({
    id,
    projectId: skill.projectId,
    skillId,
    sellerId,
    version,
    pricing,
    license,
    trialEnabled,
    status: "active",
    summary: summary || skill.name
  });

  await vault.save(listing);
  return listing;
}

/**
 * Unpublish a listing (set status to "unpublished").
 *
 * @param {Object} vault
 * @param {string} listingId
 * @returns {Promise<Object>} updated listing
 */
export async function unpublishSkill(vault, listingId) {
  const listing = await vault.load("MarketplaceListing", listingId).catch(() => null);
  if (!listing) {
    throw new Error(`Listing not found: ${listingId}`);
  }
  listing.status = "unpublished";
  listing.updatedAt = new Date().toISOString();
  await vault.save(listing);
  return listing;
}

/**
 * Suspend a listing (platform action).
 */
export async function suspendListing(vault, listingId) {
  const listing = await vault.load("MarketplaceListing", listingId).catch(() => null);
  if (!listing) {
    throw new Error(`Listing not found: ${listingId}`);
  }
  listing.status = "suspended";
  listing.updatedAt = new Date().toISOString();
  await vault.save(listing);
  return listing;
}

/**
 * Search the marketplace for published listings.
 *
 * @param {Object} vault
 * @param {Object} [options]
 * @param {string} [options.query] - full-text on skill name, summary, tags
 * @param {string} [options.license] - filter by license type
 * @param {string} [options.pricingModel] - filter by pricing model
 * @param {string} [options.sellerId]
 * @param {string} [options.sortBy] - "recent" (default), "downloads", "rating", "revenue", "price"
 * @param {number} [options.limit=20]
 * @returns {Promise<Array<Object>>} listings enriched with skill metadata
 */
export async function searchMarketplace(vault, options = {}) {
  const { query, license, pricingModel, sellerId, sortBy = "recent", limit = 20 } = options;

  let listings = await vault.list("MarketplaceListing");
  listings = listings.filter((l) => l.status === "active");

  // Enrich with skill data for search
  const skills = await vault.list("Skill");
  const skillMap = new Map(skills.map((s) => [s.id, s]));

  if (query) {
    const q = query.toLowerCase();
    listings = listings.filter((l) => {
      const skill = skillMap.get(l.skillId);
      const haystack = [
        l.summary,
        l.skillId,
        skill?.name,
        skill?.trigger?.intent,
        ...(skill?.trigger?.signals || [])
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }

  if (license) {
    listings = listings.filter((l) => l.license === license);
  }
  if (pricingModel) {
    listings = listings.filter((l) => l.pricing?.model === pricingModel);
  }
  if (sellerId) {
    listings = listings.filter((l) => l.sellerId === sellerId);
  }

  // Compute average rating
  listings = listings.map((l) => ({
    ...l,
    averageRating: l.ratingCount > 0 ? Math.round((l.ratingSum / l.ratingCount) * 100) / 100 : 0,
    skillName: skillMap.get(l.skillId)?.name || l.skillId
  }));

  switch (sortBy) {
    case "downloads":
      listings.sort((a, b) => b.downloads - a.downloads);
      break;
    case "rating":
      listings.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      break;
    case "revenue":
      listings.sort((a, b) => b.revenue - a.revenue);
      break;
    case "price":
      listings.sort((a, b) => (a.pricing?.price || 0) - (b.pricing?.price || 0));
      break;
    case "recent":
    default:
      listings.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
      break;
  }

  return listings.slice(0, limit);
}

/**
 * Get full details for a single listing.
 *
 * @param {Object} vault
 * @param {string} listingId
 * @returns {Promise<Object|null>} listing with skill + rating summary
 */
export async function getListingDetails(vault, listingId) {
  const listing = await vault.load("MarketplaceListing", listingId).catch(() => null);
  if (!listing) return null;

  const skill = await vault.load("Skill", listing.skillId).catch(() => null);

  const ratings = (await vault.list("SkillRating")).filter((r) => r.skillId === listing.skillId);
  const ratingSum = ratings.reduce((acc, r) => acc + r.score, 0);
  const ratingCount = ratings.length;
  const averageRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 100) / 100 : 0;

  return {
    ...listing,
    skill,
    averageRating,
    ratingCount,
    effectivePrice: listing.pricing?.model === "subscription"
      ? (listing.pricing.subscriptionPrice || 0)
      : (listing.pricing?.price || 0)
  };
}

/**
 * List all published versions of a Skill (version tracking).
 *
 * @param {Object} vault
 * @param {string} skillId
 * @returns {Promise<Array<Object>>} sorted by publishedAt descending
 */
export async function listPublishedVersions(vault, skillId) {
  const listings = await vault.list("MarketplaceListing");
  return listings
    .filter((l) => l.skillId === skillId)
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
}

/**
 * Record a download / install for a listing.
 *
 * @param {Object} vault
 * @param {string} listingId
 * @returns {Promise<Object>} updated listing
 */
export async function recordDownload(vault, listingId) {
  const listing = await vault.load("MarketplaceListing", listingId).catch(() => null);
  if (!listing) {
    throw new Error(`Listing not found: ${listingId}`);
  }
  listing.downloads = (listing.downloads || 0) + 1;
  listing.updatedAt = new Date().toISOString();
  await vault.save(listing);
  return listing;
}

/**
 * Sync a listing's cached ratingSum/ratingCount from SkillRating records.
 * Called after a rating is submitted to keep listing aggregates fresh.
 *
 * @param {Object} vault
 * @param {string} skillId
 * @returns {Promise<void>}
 */
export async function syncListingRatings(vault, skillId) {
  const ratings = (await vault.list("SkillRating")).filter((r) => r.skillId === skillId);
  const ratingSum = ratings.reduce((acc, r) => acc + r.score, 0);
  const ratingCount = ratings.length;

  const listings = await vault.list("MarketplaceListing");
  const forSkill = listings.filter((l) => l.skillId === skillId);
  for (const listing of forSkill) {
    listing.ratingSum = ratingSum;
    listing.ratingCount = ratingCount;
    listing.updatedAt = new Date().toISOString();
    await vault.save(listing);
  }
}

/**
 * Get marketplace summary stats.
 *
 * @param {Object} vault
 * @returns {Promise<Object>}
 */
export async function getMarketplaceStats(vault) {
  const listings = await vault.list("MarketplaceListing");
  const active = listings.filter((l) => l.status === "active");
  const transactions = await vault.list("Transaction");
  const completed = transactions.filter((t) => t.status === "completed");

  const totalDownloads = active.reduce((acc, l) => acc + (l.downloads || 0), 0);
  const totalRevenue = completed.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalCommission = completed.reduce((acc, t) => acc + (t.commission || 0), 0);

  return {
    totalListings: listings.length,
    activeListings: active.length,
    totalDownloads,
    totalTransactions: completed.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCommission: Math.round(totalCommission * 100) / 100,
    sellerPayouts: Math.round((totalRevenue - totalCommission) * 100) / 100,
    pricingModels: {
      free: active.filter((l) => l.pricing?.model === "free").length,
      one_time: active.filter((l) => l.pricing?.model === "one_time").length,
      subscription: active.filter((l) => l.pricing?.model === "subscription").length
    }
  };
}
