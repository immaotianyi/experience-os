/**
 * Test suite for transactionLog.js — purchase, refund, revenue, license.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { GitVault } from "../src/gitVault.js";
import { createSkillCandidate } from "../src/domain.js";
import { publishSkill } from "../src/marketplace.js";
import { TRIAL_LIMIT } from "../src/pricingEngine.js";
import {
  processPurchase,
  processTrial,
  refundTransaction,
  getTransactionHistory,
  getRevenueSummary,
  verifyBuyerLicense,
  getTransaction
} from "../src/transactionLog.js";

let tempDir;
let vault;
let freeListingId;
let paidListingId;
let trialListingId;

before(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "eos-tx-test-"));
  vault = new GitVault(tempDir);
  await vault.init();

  // Seed 3 stable skills + listings
  const skills = [
    { id: "skill.tx_free", name: "Free Skill" },
    { id: "skill.tx_paid", name: "Paid Skill" },
    { id: "skill.tx_trial", name: "Trial Skill" }
  ];
  for (const s of skills) {
    const skill = createSkillCandidate({
      id: s.id,
      projectId: "project.tx",
      name: s.name,
      origin: "pipeline",
      trigger: { intent: s.id, signals: ["sig"] },
      inputSchema: { type: "object" },
      outputSchema: { type: "object" },
      safetyLevel: "L1",
      fallback: "none",
      humanConfirmationRequired: false
    });
    skill.status = "stable";
    await vault.save(skill);
  }

  const freeListing = await publishSkill(vault, {
    skillId: "skill.tx_free",
    sellerId: "seller.free",
    pricing: { model: "free", price: 0, currency: "CNY" },
    license: "MIT"
  });
  freeListingId = freeListing.id;

  const paidListing = await publishSkill(vault, {
    skillId: "skill.tx_paid",
    sellerId: "seller.paid",
    pricing: { model: "one_time", price: 29.9, currency: "CNY" },
    license: "Commercial",
    trialEnabled: true
  });
  paidListingId = paidListing.id;

  const trialListing = await publishSkill(vault, {
    skillId: "skill.tx_trial",
    sellerId: "seller.trial",
    pricing: { model: "one_time", price: 9.9, currency: "CNY" },
    license: "Commercial",
    trialEnabled: true
  });
  trialListingId = trialListing.id;
});

after(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("processPurchase", () => {
  it("processes a free purchase with zero amount", async () => {
    const result = await processPurchase(vault, { listingId: freeListingId, buyerId: "buyer.free1" });
    assert.equal(result.transaction.amount, 0);
    assert.equal(result.transaction.commission, 0);
    assert.equal(result.transaction.netToSeller, 0);
    assert.equal(result.transaction.status, "completed");
    assert.ok(result.licenseKey.startsWith("EOS-MIT-"));
    assert.equal(result.breakdown.type, "purchase");
  });

  it("processes a paid purchase with commission split", async () => {
    const result = await processPurchase(vault, { listingId: paidListingId, buyerId: "buyer.paid1" });
    assert.equal(result.transaction.amount, 29.9);
    // 29.9 * 0.15 = 4.485 → floats to 4.484999... → rounds to 4.48
    assert.equal(result.transaction.commission, 4.48);
    assert.equal(result.transaction.netToSeller, 25.42);
    assert.equal(result.transaction.licenseType, "Commercial");
    assert.ok(result.licenseKey.startsWith("EOS-COMMERCIAL-"));
  });

  it("increments listing downloads on purchase", async () => {
    const before = await vault.load("MarketplaceListing", paidListingId);
    await processPurchase(vault, { listingId: paidListingId, buyerId: "buyer.paid2" });
    const after = await vault.load("MarketplaceListing", paidListingId);
    assert.equal(after.downloads, before.downloads + 1);
  });

  it("regression: a single purchase counts as exactly one download (not two)", async () => {
    // Bug context: MarketplaceView used to call processPurchase() then recordDownload(),
    // which double-counted downloads. processPurchase already increments downloads
    // on the server (transactionLog.js), so the client must NOT call recordDownload
    // afterwards. This test pins the server-side contract.
    const listing = await vault.load("MarketplaceListing", paidListingId);
    const before = listing.downloads;
    await processPurchase(vault, { listingId: paidListingId, buyerId: "buyer.regression_single" });
    const after = await vault.load("MarketplaceListing", paidListingId);
    assert.equal(
      after.downloads,
      before + 1,
      "one purchase must increment downloads by exactly 1 — if this is +2 the caller is double-counting"
    );
  });

  it("trial purchase also counts as one download", async () => {
    const listing = await vault.load("MarketplaceListing", trialListingId);
    const before = listing.downloads;
    await processTrial(vault, { listingId: trialListingId, buyerId: "buyer.trial_dl" });
    const after = await vault.load("MarketplaceListing", trialListingId);
    assert.equal(after.downloads, before + 1);
  });

  it("refund decrements downloads by exactly one", async () => {
    const listing = await vault.load("MarketplaceListing", paidListingId);
    const before = listing.downloads;
    const result = await processPurchase(vault, { listingId: paidListingId, buyerId: "buyer.refund_dl" });
    const mid = await vault.load("MarketplaceListing", paidListingId);
    assert.equal(mid.downloads, before + 1);
    await refundTransaction(vault, result.transaction.id);
    const after = await vault.load("MarketplaceListing", paidListingId);
    assert.equal(after.downloads, before, "refund must reverse the download count from that purchase");
  });

  it("adds revenue to listing for paid purchase", async () => {
    const result = await processPurchase(vault, { listingId: paidListingId, buyerId: "buyer.paid3" });
    const listing = await vault.load("MarketplaceListing", paidListingId);
    assert.ok(listing.revenue >= 29.9 * 2);
  });

  it("rejects missing listing", async () => {
    await assert.rejects(
      () => processPurchase(vault, { listingId: "marketplace_listing.nope", buyerId: "b" }),
      /not found/
    );
  });

  it("rejects unpublished listing", async () => {
    // Publish then unpublish a fresh listing
    const skill = createSkillCandidate({
      id: "skill.tx_unpub",
      projectId: "project.tx",
      name: "Unpub",
      origin: "import",
      trigger: { intent: "u", signals: ["u"] },
      inputSchema: {},
      outputSchema: {},
      safetyLevel: "L1",
      fallback: "none",
      humanConfirmationRequired: false
    });
    skill.status = "stable";
    await vault.save(skill);
    const listing = await publishSkill(vault, {
      skillId: "skill.tx_unpub",
      pricing: { model: "free", price: 0, currency: "CNY" },
      license: "MIT"
    });
    listing.status = "unpublished";
    listing.updatedAt = new Date().toISOString();
    await vault.save(listing);
    await assert.rejects(
      () => processPurchase(vault, { listingId: listing.id, buyerId: "b" }),
      /not purchasable/
    );
  });

  it("rejects missing buyerId", async () => {
    await assert.rejects(
      () => processPurchase(vault, { listingId: freeListingId }),
      /buyerId is required/
    );
  });

  it("rejects missing listingId", async () => {
    await assert.rejects(
      () => processPurchase(vault, { buyerId: "buyer.nope" }),
      /listingId is required/
    );
  });
});

describe("processTrial", () => {
  it("processes a trial with zero amount", async () => {
    const result = await processTrial(vault, { listingId: trialListingId, buyerId: "buyer.trial1" });
    assert.equal(result.transaction.type, "trial");
    assert.equal(result.transaction.amount, 0);
    assert.equal(result.breakdown.type, "trial");
  });

  it("allows up to TRIAL_LIMIT trials", async () => {
    for (let i = 1; i < TRIAL_LIMIT; i++) {
      await processTrial(vault, { listingId: trialListingId, buyerId: "buyer.trial_multi" });
    }
    // The before() already did 1 trial for buyer.trial1, this does 2 more = 3 total for buyer.trial_multi
    // Actually buyer.trial_multi has done TRIAL_LIMIT-1 = 2 trials, should still be eligible for 1 more
    const result = await processTrial(vault, { listingId: trialListingId, buyerId: "buyer.trial_multi" });
    assert.equal(result.transaction.type, "trial");
  });

  it("rejects trial after limit reached", async () => {
    await assert.rejects(
      () => processTrial(vault, { listingId: trialListingId, buyerId: "buyer.trial_multi" }),
      /Trial limit reached/
    );
  });

  it("rejects trial on listing without trialEnabled", async () => {
    await assert.rejects(
      () => processTrial(vault, { listingId: freeListingId, buyerId: "buyer.nope" }),
      /Trial not enabled/
    );
  });
});

describe("refundTransaction", () => {
  it("refunds a completed transaction", async () => {
    const purchase = await processPurchase(vault, { listingId: paidListingId, buyerId: "buyer.refund" });
    const listingBefore = await vault.load("MarketplaceListing", paidListingId);

    const refunded = await refundTransaction(vault, purchase.transaction.id);
    assert.equal(refunded.status, "refunded");

    const listingAfter = await vault.load("MarketplaceListing", paidListingId);
    assert.ok(listingAfter.revenue <= listingBefore.revenue);
  });

  it("rejects double refund", async () => {
    const purchase = await processPurchase(vault, { listingId: paidListingId, buyerId: "buyer.double" });
    await refundTransaction(vault, purchase.transaction.id);
    await assert.rejects(
      () => refundTransaction(vault, purchase.transaction.id),
      /already refunded/
    );
  });

  it("rejects missing transaction", async () => {
    await assert.rejects(
      () => refundTransaction(vault, "transaction.nope"),
      /not found/
    );
  });

  it("rejects refunding a trial transaction", async () => {
    const trial = await processTrial(vault, { listingId: trialListingId, buyerId: "buyer.trial_refund" });
    await assert.rejects(
      () => refundTransaction(vault, trial.transaction.id),
      /cannot be refunded/
    );
  });
});

describe("getTransactionHistory", () => {
  it("returns transactions filtered by buyerId", async () => {
    const history = await getTransactionHistory(vault, { buyerId: "buyer.paid1" });
    assert.ok(history.length >= 1);
    assert.ok(history.every((t) => t.buyerId === "buyer.paid1"));
  });

  it("returns transactions filtered by listingId", async () => {
    const history = await getTransactionHistory(vault, { listingId: paidListingId });
    assert.ok(history.length >= 1);
    assert.ok(history.every((t) => t.listingId === paidListingId));
  });

  it("returns transactions filtered by sellerId", async () => {
    const history = await getTransactionHistory(vault, { sellerId: "seller.paid" });
    assert.ok(history.length >= 1);
    assert.ok(history.every((t) => t.sellerId === "seller.paid"));
  });

  it("sorts by createdAt descending", async () => {
    const history = await getTransactionHistory(vault, { listingId: paidListingId });
    for (let i = 1; i < history.length; i++) {
      assert.ok(history[i - 1].createdAt >= history[i].createdAt);
    }
  });

  it("respects limit", async () => {
    const history = await getTransactionHistory(vault, { limit: 1 });
    assert.equal(history.length, 1);
  });
});

describe("getRevenueSummary", () => {
  it("returns revenue summary for a seller", async () => {
    const summary = await getRevenueSummary(vault, "seller.paid");
    assert.equal(summary.sellerId, "seller.paid");
    assert.ok(summary.totalRevenue >= 0);
    assert.ok(summary.netRevenue >= 0);
    assert.ok(summary.transactionCount >= 1);
    assert.ok(typeof summary.byType.purchase === "number");
  });

  it("returns zero for seller with no sales", async () => {
    const summary = await getRevenueSummary(vault, "seller.nobody");
    assert.equal(summary.totalRevenue, 0);
    assert.equal(summary.transactionCount, 0);
  });

  it("includes topSkills breakdown", async () => {
    const summary = await getRevenueSummary(vault, "seller.paid");
    assert.ok(Array.isArray(summary.topSkills));
  });
});

describe("verifyBuyerLicense", () => {
  it("returns license for buyer who purchased", async () => {
    await processPurchase(vault, { listingId: paidListingId, buyerId: "buyer.license_check" });
    const result = await verifyBuyerLicense(vault, paidListingId, "buyer.license_check");
    assert.equal(result.hasLicense, true);
    assert.ok(result.licenseKey);
    assert.equal(result.licenseType, "Commercial");
  });

  it("returns false for buyer without purchase", async () => {
    const result = await verifyBuyerLicense(vault, paidListingId, "buyer.nolicense");
    assert.equal(result.hasLicense, false);
  });

  it("does not count trial as license", async () => {
    await processTrial(vault, { listingId: trialListingId, buyerId: "buyer.trial_only" });
    const result = await verifyBuyerLicense(vault, trialListingId, "buyer.trial_only");
    assert.equal(result.hasLicense, false);
  });
});

describe("getTransaction", () => {
  it("returns a transaction by id", async () => {
    const purchase = await processPurchase(vault, { listingId: freeListingId, buyerId: "buyer.gettx" });
    const tx = await getTransaction(vault, purchase.transaction.id);
    assert.equal(tx.id, purchase.transaction.id);
  });

  it("returns null for missing transaction", async () => {
    const tx = await getTransaction(vault, "transaction.nope");
    assert.equal(tx, null);
  });
});
