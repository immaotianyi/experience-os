/**
 * Pricing Engine — C2: Pricing & Licensing Model.
 *
 * Lets Skill authors set prices and license types for marketplace listings.
 * Supports free / one-time / subscription pricing, MIT / Commercial / Team
 * licenses, trial mechanism (3 tries), and platform commission (15%).
 *
 * Business model (per 2.0 PRD):
 * - Individual: free
 * - Team: ¥99/user/month
 * - Marketplace commission: 15%, author receives 85%
 * - Entry point: ¥9.9 one-time personalized reports (e.g. 捡漏雷达)
 */

import { PRICING_MODELS, LICENSE_TYPES } from "./domain.js";
import { randomBytes } from "node:crypto";

export const COMMISSION_RATE = 0.15;
export const AUTHOR_SHARE = 1 - COMMISSION_RATE;
export const TRIAL_LIMIT = 3;
export const PRICE_FLOOR = 0;
export const ONE_TIME_PRICE_MIN = 9.9;
export const ONE_TIME_PRICE_MAX = 99;
export const SUBSCRIPTION_PRICE_MIN = 3;
export const SUBSCRIPTION_PRICE_MAX = 19;
export const TEAM_PLAN_PRICE = 99;

/**
 * Validate a pricing configuration.
 *
 * @param {Object} pricing - { model, price, currency, subscriptionPrice? }
 * @returns {Array<string>} issues (empty = valid)
 */
export function validatePricing(pricing) {
  const issues = [];
  if (!pricing || typeof pricing !== "object") {
    return ["pricing must be an object"];
  }
  if (!PRICING_MODELS.includes(pricing.model)) {
    issues.push(`pricing.model must be one of: ${PRICING_MODELS.join(", ")}`);
  }
  if (typeof pricing.price !== "number" || pricing.price < PRICE_FLOOR) {
    issues.push("pricing.price must be a non-negative number");
  }
  if (pricing.model === "one_time") {
    if (pricing.price > 0 && (pricing.price < ONE_TIME_PRICE_MIN || pricing.price > ONE_TIME_PRICE_MAX)) {
      issues.push(`one_time price must be between ${ONE_TIME_PRICE_MIN} and ${ONE_TIME_PRICE_MAX} (or 0 for free)`);
    }
  }
  if (pricing.model === "subscription") {
    if (typeof pricing.subscriptionPrice !== "number" ||
        pricing.subscriptionPrice < SUBSCRIPTION_PRICE_MIN ||
        pricing.subscriptionPrice > SUBSCRIPTION_PRICE_MAX) {
      issues.push(`subscription.subscriptionPrice must be between ${SUBSCRIPTION_PRICE_MIN} and ${SUBSCRIPTION_PRICE_MAX}`);
    }
  }
  return issues;
}

/**
 * Validate a license type.
 */
export function validateLicenseType(license) {
  return LICENSE_TYPES.includes(license);
}

/**
 * Calculate commission split for a given amount.
 *
 * @param {number} amount - gross amount in CNY
 * @returns {{ amount, commission, netToSeller, platformShare }}
 */
export function calculateCommission(amount) {
  const safeAmount = Math.max(0, Number(amount) || 0);
  // Use integer cents to avoid floating-point precision errors:
  // 9.9 * 0.15 = 1.484999... in IEEE 754, which rounds to 1.48 instead of 1.49.
  // Converting to cents first ensures exact arithmetic.
  const cents = Math.round(safeAmount * 100);
  const commissionCents = Math.round(cents * COMMISSION_RATE);
  const netCents = cents - commissionCents;
  return {
    amount: safeAmount,
    commission: commissionCents / 100,
    netToSeller: netCents / 100,
    platformShare: commissionCents / 100
  };
}

/**
 * Generate a license key.
 * Format: EOS-{licenseType}-{listingId-hash}-{random}
 *
 * @param {Object} params
 * @param {string} params.licenseType
 * @param {string} params.listingId
 * @param {string} params.buyerId
 * @returns {string} license key
 */
export function generateLicenseKey({ licenseType, listingId, buyerId }) {
  const listingHash = hashStr(listingId).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
  const buyerHash = hashStr(buyerId).toString(36).toUpperCase().padStart(4, "0").slice(0, 4);
  // Crypto-secure random segment: 8 hex chars = 32 bits of entropy
  const random = randomBytes(4).toString("hex").toUpperCase();
  return `EOS-${licenseType.toUpperCase()}-${listingHash}-${buyerHash}-${random}`;
}

/**
 * Parse a license key format and extract metadata.
 * NOTE: This only validates FORMAT, not authenticity.
 * For authenticity verification, use transactionLog.verifyBuyerLicense().
 *
 * @param {string} licenseKey
 * @returns {{ valid, licenseType?, listingHash?, buyerHash? }}
 */
export function verifyLicenseKey(licenseKey) {
  if (typeof licenseKey !== "string") return { valid: false };
  // Strict regex: EOS-{TYPE}-{6 hex}-{4 hex}-{8 hex}
  const match = licenseKey.match(/^EOS-([A-Z]+)-([A-Z0-9]{6})-([A-Z0-9]{4})-([A-Z0-9]{8})$/);
  if (!match) return { valid: false };
  const [, licenseType, listingHash, buyerHash] = match;
  if (!LICENSE_TYPES.map((l) => l.toUpperCase()).includes(licenseType)) {
    return { valid: false };
  }
  return { valid: true, licenseType, listingHash, buyerHash };
}

/**
 * Check trial eligibility for a buyer on a listing.
 * Trial allows TRIAL_LIMIT (3) uses, each limited to 1 input.
 *
 * @param {Object} vault
 * @param {string} listingId
 * @param {string} buyerId
 * @returns {Promise<Object>} { eligible, used, remaining, limit }
 */
export async function checkTrial(vault, listingId, buyerId) {
  const transactions = await vault.list("Transaction");
  const trials = transactions.filter(
    (t) => t.listingId === listingId && t.buyerId === buyerId && t.type === "trial"
  );
  const used = trials.length;
  const remaining = Math.max(0, TRIAL_LIMIT - used);
  return {
    eligible: remaining > 0,
    used,
    remaining,
    limit: TRIAL_LIMIT
  };
}

/**
 * Determine the effective price for a buyer given a listing.
 * Free skills cost 0. Subscriptions use subscriptionPrice.
 * One-time uses price.
 *
 * @param {Object} listing - MarketplaceListing
 * @param {string} purchaseType - "purchase" | "subscription" | "trial"
 * @returns {number} amount in CNY
 */
export function resolvePrice(listing, purchaseType = "purchase") {
  if (!listing || !listing.pricing) return 0;
  if (listing.pricing.model === "free") return 0;
  if (purchaseType === "trial") return 0;
  if (listing.pricing.model === "subscription") {
    return listing.pricing.subscriptionPrice || 0;
  }
  return listing.pricing.price || 0;
}

/**
 * Check if a listing is purchasable given its pricing and status.
 *
 * @param {Object} listing
 * @returns {Array<string>} blocking reasons (empty = purchasable)
 */
export function checkPurchasable(listing) {
  const issues = [];
  if (!listing) return ["listing not found"];
  if (listing.status !== "active") {
    issues.push(`listing status is ${listing.status}, must be active`);
  }
  const pricingIssues = validatePricing(listing.pricing);
  issues.push(...pricingIssues);
  return issues;
}

/**
 * Compute the full purchase breakdown for a listing + buyer.
 *
 * @param {Object} listing
 * @param {string} purchaseType
 * @returns {Object} { amount, commission, netToSeller, licenseType, breakdown }
 */
export function computePurchaseBreakdown(listing, purchaseType = "purchase") {
  const amount = resolvePrice(listing, purchaseType);
  const split = calculateCommission(amount);
  return {
    amount: split.amount,
    commission: split.commission,
    netToSeller: split.netToSeller,
    licenseType: listing.license || "MIT",
    breakdown: {
      gross: split.amount,
      platformCommission: `${(COMMISSION_RATE * 100)}%`,
      platformAmount: split.commission,
      authorAmount: split.netToSeller
    }
  };
}

// ============================================================================
// Helpers
// ============================================================================

function hashStr(str) {
  let hash = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
