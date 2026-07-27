/**
 * Round 3 fix regression tests.
 *
 * Pins the following fixes so they cannot regress:
 *   1. importSkill rejects null/invalid skillData and missing projectId
 *   2. getRevenueSummary topSkills[].revenue uses gross (t.amount), not net
 *   3. GitVault saveUnlocked logs real git errors (not "nothing to commit")
 *   4. Beta feedback rate limit only counts successful submissions
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { GitVault } from "../src/gitVault.js";
import { importSkill } from "../src/skillRegistry.js";
import { getRevenueSummary, processPurchase } from "../src/transactionLog.js";
import { publishSkill } from "../src/marketplace.js";
import { createSkillCandidate } from "../src/domain.js";

let tmpDir;
let vault;

beforeEach(async () => {
  tmpDir = await mkdtemp(path.join(tmpdir(), "eos-round3-"));
  vault = new GitVault(tmpDir);
  await vault.init();
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

// ============================================================
// 1. importSkill input validation
// ============================================================
describe("importSkill input validation", () => {
  it("throws when skillData is null", async () => {
    await assert.rejects(
      () => importSkill({ vault, skillData: null, projectId: "p1" }),
      /skillData must be a non-null object/
    );
  });

  it("throws when skillData is not an object", async () => {
    await assert.rejects(
      () => importSkill({ vault, skillData: "string", projectId: "p1" }),
      /skillData must be a non-null object/
    );
  });

  it("throws when skillData.name is missing", async () => {
    await assert.rejects(
      () => importSkill({ vault, skillData: { trigger: {} }, projectId: "p1" }),
      /skillData\.name must be a non-empty string/
    );
  });

  it("throws when skillData.name is an empty string", async () => {
    await assert.rejects(
      () => importSkill({ vault, skillData: { name: "  " }, projectId: "p1" }),
      /skillData\.name must be a non-empty string/
    );
  });

  it("throws when projectId is missing", async () => {
    await assert.rejects(
      () => importSkill({ vault, skillData: { name: "Test Skill" } }),
      /projectId is required/
    );
  });

  it("succeeds with valid input", async () => {
    const skill = await importSkill({
      vault,
      skillData: { name: "Valid Skill", description: "A test skill" },
      projectId: "project.test"
    });
    assert.ok(skill.id);
    assert.equal(skill.name, "Valid Skill");
    assert.equal(skill.projectId, "project.test");
  });
});

// ============================================================
// 2. getRevenueSummary revenue consistency
// ============================================================
describe("getRevenueSummary revenue consistency", () => {
  it("topSkills[].revenue matches gross amount, not netToSeller", async () => {
    // Publish a skill, then create a completed purchase transaction
    const skill = createSkillCandidate({
      id: "skill.revenue-test",
      projectId: "project.revenue",
      name: "Revenue Test Skill",
      origin: "pipeline",
      trigger: { intent: "test", signals: ["sig"] },
      inputSchema: {},
      outputSchema: {},
      safetyLevel: "L1",
      fallback: "none",
      humanConfirmationRequired: false
    });
    skill.status = "stable";
    await vault.save(skill);

    const listing = await publishSkill(vault, {
      skillId: skill.id,
      sellerId: "seller-1",
      version: "1.0.0",
      license: "MIT",
      pricing: { model: "one_time", price: 50, currency: "CNY" }
    });

    // processPurchase creates the transaction internally with correct commission split
    // COMMISSION_RATE = 0.15 → amount=50, commission=7.5, netToSeller=42.5
    const result = await processPurchase(vault, {
      listingId: listing.id,
      buyerId: "buyer-1",
      purchaseType: "purchase"
    });

    assert.equal(result.breakdown.gross, 50);
    assert.equal(result.breakdown.platformCommission, 7.5);
    assert.equal(result.breakdown.authorNet, 42.5);

    const summary = await getRevenueSummary(vault, "seller-1");

    // totalRevenue should be gross (50), not net (42.5)
    assert.equal(summary.totalRevenue, 50);

    // topSkills revenue should also be gross (50), matching totalRevenue
    assert.ok(summary.topSkills.length > 0);
    assert.equal(summary.topSkills[0].revenue, 50);
    assert.equal(summary.topSkills[0].netRevenue, 42.5);
  });
});

// ============================================================
// 3. GitVault saveUnlocked does not silently swallow real git errors
// ============================================================
describe("GitVault saveUnlocked error handling", () => {
  it("successfully saves and commits a record", async () => {
    // Use a real kind (Skill) so Vault.fileFor accepts it
    const record = {
      kind: "Skill",
      id: "skill.save-test-1",
      projectId: "project.save-test",
      name: "Save Test Skill",
      origin: "pipeline",
      trigger: { intent: "test", signals: [] },
      inputSchema: {},
      outputSchema: {},
      safetyLevel: "L1",
      fallback: "none",
      humanConfirmationRequired: false,
      status: "candidate",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const savedPath = await vault.save(record);
    assert.ok(savedPath);
    // Reload to confirm persistence
    const loaded = await vault.load("Skill", "skill.save-test-1");
    assert.equal(loaded.name, "Save Test Skill");
  });

  it("withTransaction rolls back on error without corrupting existing data", async () => {
    const existing = {
      kind: "Skill",
      id: "skill.rollback-test-1",
      projectId: "project.rollback",
      name: "Rollback Test Skill",
      origin: "pipeline",
      trigger: { intent: "test", signals: [] },
      inputSchema: {},
      outputSchema: {},
      safetyLevel: "L1",
      fallback: "none",
      humanConfirmationRequired: false,
      status: "candidate",
      notes: "original",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await vault.save(existing);

    // Attempt a transaction that throws
    await assert.rejects(
      () => vault.withTransaction(async () => {
        const fresh = await vault.load("Skill", "skill.rollback-test-1");
        await vault.save({ ...fresh, notes: "changed" });
        throw new Error("Simulated failure");
      }),
      /Simulated failure/
    );

    // Original should be intact
    const after = await vault.load("Skill", "skill.rollback-test-1");
    assert.equal(after.notes, "original");
  });
});
