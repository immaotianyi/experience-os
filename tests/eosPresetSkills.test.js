import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { GitVault } from "../src/gitVault.js";
import { startProject } from "../src/projectEngine.js";
import { PRESET_SKILLS, listPresetSkills, installPresetSkills } from "../src/eosPresetSkills.js";

let dirs = [];
import { afterEach } from "node:test";
afterEach(async () => {
  await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })));
  dirs = [];
});

async function fixture() {
  const dir = await mkdtemp(path.join(tmpdir(), "eos-preset-"));
  dirs.push(dir);
  const vault = new GitVault(dir);
  await vault.init();
  const project = await startProject(vault, { id: "project.preset", name: "Preset", goal: "Verify preset skills" });
  return { vault, project };
}

describe("PRESET_SKILLS", () => {
  it("ships seven skills in Universal Skill v1 shape", () => {
    assert.equal(PRESET_SKILLS.length, 7);
    for (const skill of PRESET_SKILLS) {
      assert.equal(skill.schemaVersion, "skillcentral.dev/v1");
      assert.ok(skill.name && skill.description && skill.type);
      assert.ok(Array.isArray(skill.tags) && skill.tags.length > 0);
      assert.ok(skill.trigger && typeof skill.trigger.intent === "string");
      assert.ok(skill.inputSchema && skill.outputSchema);
      assert.ok(["L1", "L2", "L3"].includes(skill.safetyLevel));
      assert.equal(typeof skill.instructions, "string");
    }
    const names = PRESET_SKILLS.map((s) => s.name);
    assert.equal(new Set(names).size, names.length, "preset names must be unique");
    assert.ok(names.includes("Commit Conventions"));
  });

  it("lists preset summaries without vault access", async () => {
    const presets = await listPresetSkills();
    assert.equal(presets.length, 7);
    for (const entry of presets) {
      assert.ok(entry.name && entry.description && entry.type);
    }
  });
});

describe("installPresetSkills", () => {
  it("installs all presets as reviewable candidates", async () => {
    const { vault, project } = await fixture();
    const result = await installPresetSkills({ vault, projectId: project.id });
    assert.equal(result.installed.length, 7);
    assert.equal(result.skipped.length, 0);
    assert.equal(result.total, 7);

    const skills = await vault.list("Skill");
    assert.equal(skills.length, 7);
    for (const skill of skills) {
      assert.equal(skill.status, "candidate");
      assert.equal(skill.origin, "preset:skillcentral.dev/v1");
      assert.ok(skill.adaptationNotes.some((n) => n.startsWith("Imported from preset:")));
    }
  });

  it("is idempotent on re-run", async () => {
    const { vault, project } = await fixture();
    await installPresetSkills({ vault, projectId: project.id });
    const second = await installPresetSkills({ vault, projectId: project.id });
    assert.equal(second.installed.length, 0);
    assert.equal(second.skipped.length, 7);
    const skills = await vault.list("Skill");
    assert.equal(skills.length, 7);
  });

  it("supports selective install by name", async () => {
    const { vault, project } = await fixture();
    const result = await installPresetSkills({ vault, projectId: project.id, skillNames: ["Session Recap"] });
    assert.equal(result.installed.length, 1);
    assert.equal(result.installed[0].name, "Session Recap");
    assert.equal(result.total, 7);
  });

  it("rejects missing vault or projectId", async () => {
    const { vault, project } = await fixture();
    await assert.rejects(() => installPresetSkills({ projectId: project.id }), /vault is required/);
    await assert.rejects(() => installPresetSkills({ vault }), /projectId is required/);
  });
});
