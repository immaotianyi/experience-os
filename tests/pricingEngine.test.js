/**
 * Test suite for pricingEngine.js — pricing, licensing, commission, trial.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { GitVault } from "../src/gitVault.js";
import { createMarketplaceListing, createTransaction } from "../src/domain.js";
import {
  COMMISSION_RATE,
  TRIAL_LIMIT,
  ONE_TIME_PRICE_MIN,
  ONE_TIME_PRICE_MAX,
  SUBSCRIPTION_PRICE_MIN,
  SUBSCRIPTION_PRICE_MAX,
  validatePricing,
  validateLicenseType,
  calculateCommission,
  generateLicenseKey,
  verifyLicenseKey,
  checkTrial,
  resolvePrice,
  checkPurchasable,
  computePurchaseBreakdown
} from "../src/pricingEngine.js";

let tempDir;
let vault;

before(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "eos-pricing-test-"));
  vault = new GitVault(tempDir);
  await vault.init();
});

after(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("validatePricing", () => {
  it("accepts free pricing", () => {
    const issues = validatePricing({ model: "free", price: 0, currency: "CNY" });
    assert.equal(issues.length, 0);
  });

  it("accepts one_time pricing within range", () => {
    const issues = validatePricing({ model: "one_time", price: 9.9, currency: "CNY" });
    assert.equal(issues.length, 0);
  });

  it("accepts one_time pricing at max", () => {
    const issues = validatePricing({ model: "one_time", price: 99, currency: "CNY" });
    assert.equal(issues.length, 0);
  });

  it("rejects one_time pricing below floor", () => {
    const issues = validatePricing({ model: "one_time", price: 5, currency: "CNY" });
    assert.ok(issues.length > 0);
    assert.ok(issues[0].includes("one_time price"));
  });

  it("rejects one_time pricing above ceiling", () => {
    const issues = validatePricing({ model: "one_time", price: 200, currency: "CNY" });
    assert.ok(issues.length > 0);
  });

  it("accepts subscription with valid subscriptionPrice", () => {
    const issues = validatePricing({ model: "subscription", price: 0, currency: "CNY", subscriptionPrice: 9 });
    assert.equal(issues.length, 0);
  });

  it("rejects subscription with missing subscriptionPrice", () => {
    const issues = validatePricing({ model: "subscription", price: 0, currency: "CNY" });
    assert.ok(issues.length > 0);
  });

  it("rejects invalid model", () => {
    const issues = validatePricing({ model: "bargain", price: 0, currency: "CNY" });
    assert.ok(issues.length > 0);
  });

  it("rejects non-object pricing", () => {
    const issues = validatePricing(null);
    assert.ok(issues.length > 0);
  });
});

describe("validateLicenseType", () => {
  it("accepts MIT", () => assert.equal(validateLicenseType("MIT"), true));
  it("accepts Commercial", () => assert.equal(validateLicenseType("Commercial"), true));
  it("accepts Team", () => assert.equal(validateLicenseType("Team"), true));
  it("rejects unknown", () => assert.equal(validateLicenseType("GPL"), false));
});

describe("calculateCommission", () => {
  it("splits 15/85 for ¥9.9", () => {
    const result = calculateCommission(9.9);
    assert.equal(result.amount, 9.9);
    assert.equal(result.commission, 1.49);
    assert.equal(result.netToSeller, 8.41);
  });

  it("returns zero for free", () => {
    const result = calculateCommission(0);
    assert.equal(result.amount, 0);
    assert.equal(result.commission, 0);
    assert.equal(result.netToSeller, 0);
  });

  it("handles ¥99 one-time", () => {
    const result = calculateCommission(99);
    assert.equal(result.commission, 14.85);
    assert.equal(result.netToSeller, 84.15);
  });

  it("treats NaN as 0", () => {
    const result = calculateCommission("abc");
    assert.equal(result.amount, 0);
  });

  it("treats negative as 0", () => {
    const result = calculateCommission(-10);
    assert.equal(result.amount, 0);
  });
});

describe("generateLicenseKey & verifyLicenseKey", () => {
  it("generates a key with EOS prefix", () => {
    const key = generateLicenseKey({ licenseType: "Commercial", listingId: "listing_1", buyerId: "buyer_1" });
    assert.ok(key.startsWith("EOS-COMMERCIAL-"));
  });

  it("verifies a valid key", () => {
    const key = generateLicenseKey({ licenseType: "MIT", listingId: "l1", buyerId: "b1" });
    const result = verifyLicenseKey(key);
    assert.equal(result.valid, true);
    assert.equal(result.licenseType, "MIT");
  });

  it("rejects malformed key", () => {
    const result = verifyLicenseKey("garbage");
    assert.equal(result.valid, false);
  });

  it("rejects key with wrong prefix", () => {
    const result = verifyLicenseKey("XXX-MIT-AAAAAA-BBBB-CCCCDDDD");
    assert.equal(result.valid, false);
  });

  it("rejects key with invalid license type", () => {
    const result = verifyLicenseKey("EOS-GPL-AAAAAA-BBBB-CCCCDDDD");
    assert.equal(result.valid, false);
  });

  it("rejects key with wrong segment length", () => {
    const result = verifyLicenseKey("EOS-MIT-AAAA-BBBB-CCCC");
    assert.equal(result.valid, false);
  });

  it("rejects non-string key", () => {
    const result = verifyLicenseKey(12345);
    assert.equal(result.valid, false);
  });
});

describe("checkTrial", () => {
  it("returns full eligibility for new buyer", async () => {
    const result = await checkTrial(vault, "listing.trial_test", "buyer.new");
    assert.equal(result.eligible, true);
    assert.equal(result.used, 0);
    assert.equal(result.remaining, TRIAL_LIMIT);
    assert.equal(result.limit, TRIAL_LIMIT);
  });

  it("counts existing trial transactions", async () => {
    const listingId = "listing.trial_count";
    for (let i = 0; i < 2; i++) {
      const tx = createTransaction({
        id: `transaction.trial_count.${i}`,
        projectId: "project.test",
        listingId,
        skillId: "skill.test",
        buyerId: "buyer.repeat",
        sellerId: "seller",
        type: "trial",
        amount: 0,
        licenseKey: "EOS-MIT-X-Y-Z",
        licenseType: "MIT"
      });
      await vault.save(tx);
    }
    const result = await checkTrial(vault, listingId, "buyer.repeat");
    assert.equal(result.used, 2);
    assert.equal(result.remaining, 1);
    assert.equal(result.eligible, true);
  });

  it("marks ineligible when limit reached", async () => {
    const listingId = "listing.trial_full";
    for (let i = 0; i < TRIAL_LIMIT; i++) {
      const tx = createTransaction({
        id: `transaction.trial_full.${i}`,
        projectId: "project.test",
        listingId,
        skillId: "skill.test",
        buyerId: "buyer.exhausted",
        sellerId: "seller",
        type: "trial",
        amount: 0,
        licenseKey: "EOS-MIT-X-Y-Z",
        licenseType: "MIT"
      });
      await vault.save(tx);
    }
    const result = await checkTrial(vault, listingId, "buyer.exhausted");
    assert.equal(result.eligible, false);
    assert.equal(result.remaining, 0);
  });
});

describe("resolvePrice", () => {
  it("returns 0 for free listing", () => {
    const listing = { pricing: { model: "free", price: 0 } };
    assert.equal(resolvePrice(listing, "purchase"), 0);
  });

  it("returns price for one_time", () => {
    const listing = { pricing: { model: "one_time", price: 19.9 } };
    assert.equal(resolvePrice(listing, "purchase"), 19.9);
  });

  it("returns subscriptionPrice for subscription", () => {
    const listing = { pricing: { model: "subscription", price: 0, subscriptionPrice: 9 } };
    assert.equal(resolvePrice(listing, "subscription"), 9);
  });

  it("returns 0 for trial", () => {
    const listing = { pricing: { model: "one_time", price: 19.9 } };
    assert.equal(resolvePrice(listing, "trial"), 0);
  });

  it("returns 0 for missing listing", () => {
    assert.equal(resolvePrice(null, "purchase"), 0);
  });
});

describe("checkPurchasable", () => {
  it("returns empty for active valid listing", () => {
    const listing = createMarketplaceListing({
      id: "marketplace_listing.ok",
      projectId: "project.test",
      skillId: "skill.test",
      pricing: { model: "free", price: 0, currency: "CNY" },
      license: "MIT"
    });
    const issues = checkPurchasable(listing);
    assert.equal(issues.length, 0);
  });

  it("flags non-active status", () => {
    const listing = createMarketplaceListing({
      id: "marketplace_listing.inactive",
      projectId: "project.test",
      skillId: "skill.test",
      pricing: { model: "free", price: 0, currency: "CNY" },
      license: "MIT",
      status: "unpublished"
    });
    const issues = checkPurchasable(listing);
    assert.ok(issues.some((i) => i.includes("status")));
  });

  it("flags null listing", () => {
    const issues = checkPurchasable(null);
    assert.ok(issues.length > 0);
  });
});

describe("computePurchaseBreakdown", () => {
  it("computes breakdown for ¥9.9 one_time", () => {
    const listing = {
      pricing: { model: "one_time", price: 9.9, currency: "CNY" },
      license: "Commercial"
    };
    const result = computePurchaseBreakdown(listing, "purchase");
    assert.equal(result.amount, 9.9);
    assert.equal(result.commission, 1.49);
    assert.equal(result.netToSeller, 8.41);
    assert.equal(result.licenseType, "Commercial");
    assert.equal(result.breakdown.platformCommission, "15%");
  });

  it("computes 0 for free", () => {
    const listing = { pricing: { model: "free", price: 0 }, license: "MIT" };
    const result = computePurchaseBreakdown(listing, "purchase");
    assert.equal(result.amount, 0);
    assert.equal(result.netToSeller, 0);
  });
});
