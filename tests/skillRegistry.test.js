/**
 * Test suite for skillRegistry.js — index, search, import, metadata.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { GitVault } from "../src/gitVault.js";
import { createSkillCandidate, createProject, createReviewPacket, createReviewDecision } from "../src/domain.js";
import { buildLocalIndex, searchIndex, importSkill, getSkillMetadata, listCategories } from "../src/skillRegistry.js";

let tempDir;
let vault;

before(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "eos-registry-test-"));
  vault = new GitVault(tempDir);
  await vault.init();

  // Seed test data
  const project = createProject({ id: "project.registry_test", name: "Registry Test", goal: "G" });
  await vault.save(project);

  const stableSkill = createSkillCandidate({
    id: "skill.registry_stable",
    projectId: "project.registry_test",
    name: "Stable Registry Skill",
    origin: "pipeline",
    trigger: { intent: "stable_intent", signals: ["sig_a", "sig_b"] },
    inputSchema: { type: "object" },
    outputSchema: { type: "object" },
    safetyLevel: "L1",
    fallback: "none",
    humanConfirmationRequired: false
  });
  stableSkill.status = "stable";
  await vault.save(stableSkill);

  const candidateSkill = createSkillCandidate({
    id: "skill.registry_candidate",
    projectId: "project.registry_test",
    name: "Candidate Skill",
    origin: "import",
    trigger: { intent: "candidate_intent", signals: ["sig_c"] },
    inputSchema: {},
    outputSchema: {},
    safetyLevel: "L2",
    fallback: "error",
    humanConfirmationRequired: true
  });
  await vault.save(candidateSkill);

  // Add a review packet + decision for the stable skill
  const packet = createReviewPacket({
    id: "review_packet.registry_rp1",
    projectId: "project.registry_test",
    targetKind: "Skill",
    targetId: "skill.registry_stable",
    title: "Review",
    recommendation: "approve",
    why: "looks good",
    options: [{ id: "approve_candidate", label: "Approve" }],
    defaultOption: "approve_candidate"
  });
  await vault.save(packet);

  const decision = createReviewDecision({
    id: "review_decision.registry_rd1",
    projectId: "project.registry_test",
    reviewPacketId: packet.id,
    targetKind: "Skill",
    targetId: "skill.registry_stable",
    decision: "approve_candidate",
    rationale: "good",
    resultingStatus: "stable"
  });
  await vault.save(decision);
});

after(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("buildLocalIndex", () => {
  it("indexes all skills with metadata", async () => {
    const index = await buildLocalIndex(vault);
    assert.ok(index.length >= 2);
    const stable = index.find((e) => e.id === "skill.registry_stable");
    assert.ok(stable);
    assert.equal(stable.status, "stable");
    assert.equal(stable.mcpExportable, true);
    assert.ok(stable.qualityScore >= 0);
    assert.ok(stable.qualityGrade);
  });

  it("computes review count and approval rate", async () => {
    const index = await buildLocalIndex(vault);
    const stable = index.find((e) => e.id === "skill.registry_stable");
    assert.ok(stable.reviewCount >= 1);
    assert.ok(stable.approvalRate > 0);
  });

  it("extracts tags from skill metadata", async () => {
    const index = await buildLocalIndex(vault);
    const stable = index.find((e) => e.id === "skill.registry_stable");
    assert.ok(stable.tags.includes("functional"));
    assert.ok(stable.tags.includes("L1"));
    assert.ok(stable.tags.includes("sig_a"));
  });
});

describe("searchIndex", () => {
  it("searches by name", async () => {
    const index = await buildLocalIndex(vault);
    const results = searchIndex(index, { query: "Stable" });
    assert.ok(results.some((e) => e.id === "skill.registry_stable"));
  });

  it("searches by signal", async () => {
    const index = await buildLocalIndex(vault);
    const results = searchIndex(index, { query: "sig_a" });
    assert.ok(results.some((e) => e.id === "skill.registry_stable"));
  });

  it("filters by skillLevel", async () => {
    const index = await buildLocalIndex(vault);
    const results = searchIndex(index, { skillLevel: "functional" });
    assert.ok(results.every((e) => e.skillLevel === "functional"));
  });

  it("filters by status", async () => {
    const index = await buildLocalIndex(vault);
    const results = searchIndex(index, { status: "stable" });
    assert.ok(results.every((e) => e.status === "stable"));
  });

  it("sorts by name", async () => {
    const index = await buildLocalIndex(vault);
    const results = searchIndex(index, { sortBy: "name" });
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i - 1].name.localeCompare(results[i].name) <= 0);
    }
  });

  it("respects limit", async () => {
    const index = await buildLocalIndex(vault);
    const results = searchIndex(index, { limit: 1 });
    assert.equal(results.length, 1);
  });
});

describe("importSkill", () => {
  it("imports external skill as candidate", async () => {
    const skill = await importSkill({
      vault,
      skillData: {
        name: "Imported Skill",
        trigger: { intent: "imported_intent", signals: ["ext"] },
        inputSchema: { type: "object" },
        outputSchema: { type: "object" },
        safetyLevel: "L2",
        fallback: "error"
      },
      projectId: "project.registry_test",
      source: "test-import"
    });

    assert.equal(skill.status, "candidate");
    assert.equal(skill.origin, "test-import");
    assert.equal(skill.candidateReason, "imported");
    assert.ok(skill.adaptationNotes[0].includes("test-import"));

    // Verify it was saved
    const loaded = await vault.load("Skill", skill.id);
    assert.equal(loaded.name, "Imported Skill");
  });
});

describe("getSkillMetadata", () => {
  it("returns detailed metadata for a skill", async () => {
    const metadata = await getSkillMetadata(vault, "skill.registry_stable");
    assert.ok(metadata);
    assert.equal(metadata.skill.id, "skill.registry_stable");
    assert.ok(metadata.stats.totalReviews >= 1);
    assert.ok(metadata.stats.approvalRate > 0);
    assert.ok(metadata.reviewHistory.length > 0);
  });

  it("returns null for non-existent skill", async () => {
    const metadata = await getSkillMetadata(vault, "skill.nonexistent");
    assert.equal(metadata, null);
  });
});

describe("listCategories", () => {
  it("lists all unique tags with counts", async () => {
    const index = await buildLocalIndex(vault);
    const categories = listCategories(index);
    assert.ok(categories.length > 0);
    assert.ok(categories.some((c) => c.tag === "functional"));
    assert.ok(categories.every((c) => c.count > 0));
  });

  it("sorts by count descending", async () => {
    const index = await buildLocalIndex(vault);
    const categories = listCategories(index);
    for (let i = 1; i < categories.length; i++) {
      assert.ok(categories[i - 1].count >= categories[i].count);
    }
  });
});
