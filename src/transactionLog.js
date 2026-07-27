/**
 * Transaction Log — C4: Purchase & Revenue Tracking.
 *
 * Records every marketplace transaction (purchase / subscription / trial),
 * issues license keys, updates listing revenue & download counts, and
 * provides revenue accounting per seller.
 *
 * Purchase flow:
 *   listing + buyer → checkPurchasable → resolvePrice → calculateCommission
 *                  → generateLicenseKey → createTransaction → update listing
 */

import { createTransaction, TRANSACTION_TYPES } from "./domain.js";
import {
  calculateCommission,
  resolvePrice,
  checkPurchasable,
  generateLicenseKey,
  checkTrial,
  TRIAL_LIMIT
} from "./pricingEngine.js";
import { slug } from "./utils.js";
import { randomBytes } from "node:crypto";
const nonce = (n = 4) => randomBytes(n).toString("hex");

/**
 * Process a full purchase for a listing.
 *
 * @param {Object} vault - GitVault instance
 * @param {Object} params
 * @param {string} params.listingId
 * @param {string} params.buyerId
 * @param {string} [params.purchaseType] - "purchase" | "subscription" | "trial"
 * @returns {Promise<Object>} { transaction, listing, licenseKey, breakdown }
 */
export async function processPurchase(vault, { listingId, buyerId, purchaseType = "purchase" }) {
  if (!listingId || typeof listingId !== "string") {
    throw new Error("listingId is required");
  }
  if (!buyerId || typeof buyerId !== "string") {
    throw new Error("buyerId is required");
  }
  if (!TRANSACTION_TYPES.includes(purchaseType)) {
    throw new Error(`purchaseType must be one of: ${TRANSACTION_TYPES.join(", ")}`);
  }

  // All check-then-act logic inside the write lock to prevent TOCTOU race conditions
  const doPurchase = async () => {
    const listing = await vault.load("MarketplaceListing", listingId).catch(() => null);
    if (!listing) {
      throw new Error(`Listing not found: ${listingId}`);
    }

    const blockers = checkPurchasable(listing);
    if (blockers.length > 0) {
      throw new Error(`Listing not purchasable: ${blockers.join("; ")}`);
    }

    // Trial path — check eligibility
    if (purchaseType === "trial") {
      if (!listing.trialEnabled) {
        throw new Error("Trial not enabled for this listing");
      }
      const trialStatus = await checkTrial(vault, listingId, buyerId);
      if (!trialStatus.eligible) {
        throw new Error(`Trial limit reached (${trialStatus.used}/${trialStatus.limit})`);
      }
    } else {
      // For one_time and subscription models, check if buyer already holds a
      // license (prevent double charge). Free listings don't need this check
      // since they cost 0, but we still prevent duplicate license issuance.
      if (listing.pricing?.model === "one_time" || listing.pricing?.model === "subscription") {
        const existingLicense = await verifyBuyerLicense(vault, listingId, buyerId);
        if (existingLicense.hasLicense) {
          throw new Error(`Buyer ${buyerId} already holds a license for this listing. Use the existing license key: ${existingLicense.licenseKey}`);
        }
      }
    }

    const amount = resolvePrice(listing, purchaseType);
    const split = calculateCommission(amount);
    const licenseKey = generateLicenseKey({
      licenseType: listing.license,
      listingId,
      buyerId
    });

    const id = `transaction.${slug(listingId)}.${slug(buyerId)}.${Date.now()}.${nonce()}`;
    const transaction = createTransaction({
      id,
      projectId: listing.projectId,
      listingId,
      skillId: listing.skillId,
      buyerId,
      sellerId: listing.sellerId,
      type: purchaseType,
      amount: split.amount,
      commission: split.commission,
      netToSeller: split.netToSeller,
      licenseKey,
      licenseType: listing.license,
      status: "completed"
    });

    await vault.save(transaction);

    // Update listing revenue + downloads
    if (purchaseType !== "trial") {
      listing.revenue = Math.round(((listing.revenue || 0) + split.amount) * 100) / 100;
    }
    listing.downloads = (listing.downloads || 0) + 1;
    listing.updatedAt = new Date().toISOString();
    await vault.save(listing);

    return {
      transaction,
      listing,
      licenseKey,
      breakdown: {
        gross: split.amount,
        platformCommission: split.commission,
        authorNet: split.netToSeller,
        type: purchaseType
      }
    };
  };

  if (typeof vault.withTransaction === "function") {
    return vault.withTransaction(doPurchase, { message: `[Transaction] purchase: ${listingId}` });
  }
  if (typeof vault.withWriteLock === "function") {
    return vault.withWriteLock(doPurchase);
  }
  return doPurchase();
}

/**
 * Process a trial use (no charge, counts against TRIAL_LIMIT).
 */
export async function processTrial(vault, { listingId, buyerId }) {
  return processPurchase(vault, { listingId, buyerId, purchaseType: "trial" });
}

/**
 * Refund a transaction.
 * Reverses revenue on the listing and marks transaction as refunded.
 *
 * @param {Object} vault
 * @param {string} transactionId
 * @returns {Promise<Object>} updated transaction
 */
export async function refundTransaction(vault, transactionId) {
  if (!transactionId || typeof transactionId !== "string") {
    throw new Error("transactionId is required and must be a non-empty string");
  }

  // All check-then-act logic inside the write lock to prevent double-refund race conditions
  const doRefund = async () => {
    const transaction = await vault.load("Transaction", transactionId).catch(() => null);
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }
    if (transaction.status === "refunded") {
      throw new Error("Transaction already refunded");
    }
    if (transaction.type === "trial") {
      throw new Error("Trial transactions cannot be refunded");
    }

    transaction.status = "refunded";
    transaction.refundedAt = new Date().toISOString();
    transaction.updatedAt = new Date().toISOString();
    await vault.save(transaction);

    // Reverse revenue and downloads on listing
    const listing = await vault.load("MarketplaceListing", transaction.listingId).catch(() => null);
    if (listing) {
      if (transaction.type !== "trial") {
        listing.revenue = Math.max(0, Math.round(((listing.revenue || 0) - transaction.amount) * 100) / 100);
      }
      listing.downloads = Math.max(0, (listing.downloads || 0) - 1);
      listing.updatedAt = new Date().toISOString();
      await vault.save(listing);
    }

    return transaction;
  };

  if (typeof vault.withTransaction === "function") {
    return vault.withTransaction(doRefund, { message: `[Transaction] refund: ${transactionId}` });
  }
  if (typeof vault.withWriteLock === "function") {
    return vault.withWriteLock(doRefund);
  }
  return doRefund();
}

/**
 * Get transaction history.
 *
 * @param {Object} vault
 * @param {Object} [options]
 * @param {string} [options.buyerId]
 * @param {string} [options.listingId]
 * @param {string} [options.sellerId]
 * @param {number} [options.limit=50]
 * @returns {Promise<Array<Object>>}
 */
export async function getTransactionHistory(vault, options = {}) {
  const { buyerId, listingId, sellerId, limit = 50 } = options;
  const safeLimit = Math.max(1, Math.min(500, Math.floor(Number(limit) || 50)));
  let transactions = await vault.list("Transaction");

  if (buyerId) {
    transactions = transactions.filter((t) => t.buyerId === buyerId);
  }
  if (listingId) {
    transactions = transactions.filter((t) => t.listingId === listingId);
  }
  if (sellerId) {
    transactions = transactions.filter((t) => t.sellerId === sellerId);
  }

  return transactions
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, safeLimit);
}

/**
 * Get revenue summary for a seller.
 *
 * @param {Object} vault
 * @param {string} sellerId
 * @returns {Promise<Object>} { totalRevenue, totalCommission, netRevenue, transactionCount, byType }
 */
export async function getRevenueSummary(vault, sellerId) {
  if (!sellerId || typeof sellerId !== "string") {
    throw new Error("sellerId is required");
  }
  const transactions = await vault.list("Transaction");
  const sellerTx = transactions.filter(
    (t) => t.sellerId === sellerId && t.status === "completed" && t.type !== "trial"
  );

  const totalRevenue = sellerTx.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalCommission = sellerTx.reduce((acc, t) => acc + (t.commission || 0), 0);
  const netRevenue = totalRevenue - totalCommission;

  const byType = {
    purchase: sellerTx.filter((t) => t.type === "purchase").length,
    subscription: sellerTx.filter((t) => t.type === "subscription").length,
    trial: transactions.filter((t) => t.sellerId === sellerId && t.type === "trial").length
  };

  // Top earning skills — revenue uses gross (t.amount) to match totalRevenue;
  // netRevenue provides the net (post-commission) figure for display.
  const bySkill = new Map();
  for (const t of sellerTx) {
    const entry = bySkill.get(t.skillId) || { skillId: t.skillId, revenue: 0, netRevenue: 0, count: 0 };
    entry.revenue += t.amount || 0;
    entry.netRevenue += t.netToSeller || 0;
    entry.count += 1;
    bySkill.set(t.skillId, entry);
  }
  const topSkills = [...bySkill.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    sellerId,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCommission: Math.round(totalCommission * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
    transactionCount: sellerTx.length,
    byType,
    topSkills: topSkills.map((s) => ({
      ...s,
      revenue: Math.round(s.revenue * 100) / 100,
      netRevenue: Math.round(s.netRevenue * 100) / 100
    }))
  };
}

/**
 * Verify a buyer's license for a listing.
 * Checks if a completed (non-trial) transaction exists.
 *
 * @param {Object} vault
 * @param {string} listingId
 * @param {string} buyerId
 * @returns {Promise<Object>} { hasLicense, licenseKey, licenseType, transactionId }
 */
export async function verifyBuyerLicense(vault, listingId, buyerId) {
  if (!listingId || typeof listingId !== "string") {
    throw new Error("listingId is required");
  }
  if (!buyerId || typeof buyerId !== "string") {
    throw new Error("buyerId is required");
  }
  const transactions = await vault.list("Transaction");
  const license = transactions.find(
    (t) => t.listingId === listingId &&
           t.buyerId === buyerId &&
           t.status === "completed" &&
           t.type !== "trial"
  );

  if (!license) {
    return { hasLicense: false };
  }

  return {
    hasLicense: true,
    licenseKey: license.licenseKey,
    licenseType: license.licenseType,
    transactionId: license.id,
    purchasedAt: license.createdAt
  };
}

/**
 * Get a single transaction by ID.
 */
export async function getTransaction(vault, transactionId) {
  return vault.load("Transaction", transactionId).catch(() => null);
}
