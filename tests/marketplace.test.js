/**
 * Test suite for marketplace.js — publish, search, version, download, stats.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { GitVault } from "../src/gitVault.js";
import { createSkillCandidate } from "../src/domain.js";
import {
  publishSkill,
  unpublishSkill,
  suspendListing,
  searchMarketplace,
  getListingDetails,
  listPublishedVersions,
  recordDownload,
  syncListingRatings,
  getMarketplaceStats
} from "../src/marketplace.js";
import { submitRating } from "../src/qualityRating.js";

let tempDir;
let vault;
let stableSkillId = "skill.market_stable";
let listingId;

before(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "eos-market-test-"));
  vault = new GitVault(tempDir);
  await vault.init();

  const skill = createSkillCandidate({
    id: stableSkillId,
    projectId: "project.market",
    name: "Market Skill",
    origin: "pipeline",
    trigger: { intent: "market_intent", signals: ["msig"] },
    inputSchema: { type: "object" },
    outputSchema: { type: "object" },
    safetyLevel: "L1",
    fallback: "none",
    humanConfirmationRequired: false
  });
  skill.status = "stable";
  await vault.save(skill);

  const skill2 = createSkillCandidate({
    id: "skill.market_second",
    projectId: "project.market",
    name: "Second Skill",
    origin: "pipeline",
    trigger: { intent: "second_intent", signals: ["ssig"] },
    inputSchema: { type: "object" },
    outputSchema: { type: "object" },
    safetyLevel: "L2",
    fallback: "error",
    humanConfirmationRequired: true
  });
  skill2.status = "stable";
  await vault.save(skill2);
});

after(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("publishSkill", () => {
  it("publishes a stable skill as free MIT listing", async () => {
    const listing = await publishSkill(vault, {
      skillId: stableSkillId,
      sellerId: "seller.one",
      pricing: { model: "free", price: 0, currency: "CNY" },
      license: "MIT",
      summary: "A free market skill"
    });
    assert.equal(listing.kind, "MarketplaceListing");
    assert.equal(listing.status, "active");
    assert.equal(listing.pricing.model, "free");
    assert.equal(listing.license, "MIT");
    assert.equal(listing.downloads, 0);
    listingId = listing.id;
  });

  it("publishes a paid one_time Commercial listing", async () => {
    const listing = await publishSkill(vault, {
      skillId: "skill.market_second",
      sellerId: "seller.two",
      pricing: { model: "one_time", price: 19.9, currency: "CNY" },
      license: "Commercial",
      trialEnabled: true
    });
    assert.equal(listing.pricing.model, "one_time");
    assert.equal(listing.license, "Commercial");
    assert.equal(listing.trialEnabled, true);
  });

  it("rejects non-stable skill", async () => {
    const candidate = createSkillCandidate({
      id: "skill.market_candidate",
      projectId: "project.market",
      name: "Candidate",
      origin: "import",
      trigger: { intent: "c", signals: ["c"] },
      inputSchema: {},
      outputSchema: {},
      safetyLevel: "L2",
      fallback: "e",
      humanConfirmationRequired: true
    });
    await vault.save(candidate);
    await assert.rejects(
      () => publishSkill(vault, {
        skillId: "skill.market_candidate",
        pricing: { model: "free", price: 0, currency: "CNY" },
        license: "MIT"
      }),
      /must be stable/
    );
  });

  it("rejects duplicate active listing", async () => {
    await assert.rejects(
      () => publishSkill(vault, {
        skillId: stableSkillId,
        pricing: { model: "free", price: 0, currency: "CNY" },
        license: "MIT"
      }),
      /already has an active listing/
    );
  });

  it("rejects missing skill", async () => {
    await assert.rejects(
      () => publishSkill(vault, {
        skillId: "skill.nonexistent",
        pricing: { model: "free", price: 0, currency: "CNY" },
        license: "MIT"
      }),
      /not found/
    );
  });

  it("rejects invalid pricing", async () => {
    await assert.rejects(
      () => publishSkill(vault, {
        skillId: stableSkillId,
        pricing: { model: "bargain", price: 0, currency: "CNY" },
        license: "MIT"
      }),
      /Invalid pricing/
    );
  });
});

describe("searchMarketplace", () => {
  it("returns active listings", async () => {
    const results = await searchMarketplace(vault);
    assert.ok(results.length >= 2);
    assert.ok(results.every((l) => l.status === "active"));
  });

  it("filters by query", async () => {
    const results = await searchMarketplace(vault, { query: "market_intent" });
    assert.ok(results.length >= 1);
    assert.ok(results.some((l) => l.skillId === stableSkillId));
  });

  it("filters by license", async () => {
    const results = await searchMarketplace(vault, { license: "Commercial" });
    assert.ok(results.every((l) => l.license === "Commercial"));
  });

  it("filters by pricingModel", async () => {
    const results = await searchMarketplace(vault, { pricingModel: "one_time" });
    assert.ok(results.every((l) => l.pricing.model === "one_time"));
  });

  it("sorts by downloads", async () => {
    // Download the first listing a few times
    await recordDownload(vault, listingId);
    await recordDownload(vault, listingId);
    const results = await searchMarketplace(vault, { sortBy: "downloads" });
    assert.ok(results[0].downloads >= results[results.length - 1].downloads);
  });

  it("includes skillName enrichment", async () => {
    const results = await searchMarketplace(vault);
    assert.ok(results.every((l) => typeof l.skillName === "string"));
  });
});

describe("getListingDetails", () => {
  it("returns full listing with skill", async () => {
    const details = await getListingDetails(vault, listingId);
    assert.equal(details.id, listingId);
    assert.ok(details.skill);
    assert.equal(details.skill.id, stableSkillId);
    assert.equal(typeof details.effectivePrice, "number");
  });

  it("returns null for missing listing", async () => {
    const details = await getListingDetails(vault, "marketplace_listing.nope");
    assert.equal(details, null);
  });
});

describe("listPublishedVersions", () => {
  it("returns all versions for a skill", async () => {
    const versions = await listPublishedVersions(vault, stableSkillId);
    assert.ok(versions.length >= 1);
    assert.ok(versions.every((v) => v.skillId === stableSkillId));
  });

  it("returns empty for skill with no listings", async () => {
    const versions = await listPublishedVersions(vault, "skill.no_listings");
    assert.equal(versions.length, 0);
  });
});

describe("recordDownload", () => {
  it("increments download count", async () => {
    const before = await getListingDetails(vault, listingId);
    await recordDownload(vault, listingId);
    const after = await getListingDetails(vault, listingId);
    assert.equal(after.downloads, before.downloads + 1);
  });

  it("rejects missing listing", async () => {
    await assert.rejects(
      () => recordDownload(vault, "marketplace_listing.nope"),
      /not found/
    );
  });
});

describe("unpublishSkill & suspendListing", () => {
  it("unpublishes correctly", async () => {
    const unpublished = await unpublishSkill(vault, listingId);
    assert.equal(unpublished.status, "unpublished");
    // It should no longer appear in search
    const results = await searchMarketplace(vault, { query: "market_intent" });
    assert.ok(!results.some((l) => l.id === listingId));
  });

  it("rejects missing listing", async () => {
    await assert.rejects(
      () => unpublishSkill(vault, "marketplace_listing.nope"),
      /not found/
    );
  });

  it("suspends a listing", async () => {
    // Re-publish first (listing was unpublished above)
    const relisting = await publishSkill(vault, {
      skillId: stableSkillId,
      sellerId: "seller.one",
      pricing: { model: "free", price: 0, currency: "CNY" },
      license: "MIT",
      version: "1.1.0"
    });
    const suspended = await suspendListing(vault, relisting.id);
    assert.equal(suspended.status, "suspended");
  });
});

describe("syncListingRatings", () => {
  it("syncs rating aggregates to listings", async () => {
    // Unpublish the existing one_time listing for skill.market_second, then re-publish fresh
    const versions = await listPublishedVersions(vault, "skill.market_second");
    for (const v of versions) {
      if (v.status === "active") {
        await unpublishSkill(vault, v.id);
      }
    }
    const listing = await publishSkill(vault, {
      skillId: "skill.market_second",
      sellerId: "seller.two",
      pricing: { model: "free", price: 0, currency: "CNY" },
      license: "MIT",
      version: "3.0.0"
    });

    await submitRating(vault, { skillId: "skill.market_second", userId: "user.r1", score: 4 });
    await submitRating(vault, { skillId: "skill.market_second", userId: "user.r2", score: 5 });

    await syncListingRatings(vault, "skill.market_second");

    const details = await getListingDetails(vault, listing.id);
    assert.equal(details.ratingCount, 2);
    assert.equal(details.ratingSum, 9);
    assert.equal(details.averageRating, 4.5);
  });
});

describe("getMarketplaceStats", () => {
  it("returns summary stats", async () => {
    const stats = await getMarketplaceStats(vault);
    assert.ok(stats.totalListings >= 1);
    assert.equal(typeof stats.totalDownloads, "number");
    assert.equal(typeof stats.totalRevenue, "number");
    assert.equal(typeof stats.pricingModels.free, "number");
  });
});
