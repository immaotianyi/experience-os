import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createSkillCandidate } from "../src/domain.js";
import {
  compilePortableSkill,
  inspectSkillPortability,
  portableSkillSlug
} from "../src/skillCompiler.js";

function stableSkill(overrides = {}) {
  const skill = createSkillCandidate({
    id: "skill.portable.review",
    projectId: "project.compiler",
    name: "Evidence Review",
    origin: "verified-experience",
    trigger: { intent: "Review evidence", signals: ["review", "evidence"] },
    inputSchema: { type: "object", properties: { claim: { type: "string" } } },
    outputSchema: { type: "object", properties: { verdict: { type: "string" } } },
    safetyLevel: "L2",
    fallback: "Report a WallHit and request missing evidence.",
    humanConfirmationRequired: true,
    instructions: "Inspect the supplied evidence, separate facts from inference, and report uncertainty.",
    evidenceLinkIds: ["evidence.compiler.1"],
    ...overrides
  });
  skill.status = "stable";
  return skill;
}

describe("inspectSkillPortability", () => {
  it("blocks a stable record that has no usable instructions", () => {
    const skill = stableSkill({ instructions: null });
    const report = inspectSkillPortability(skill);
    assert.equal(report.ready, false);
    assert.ok(report.blockers.includes("instructions_missing"));
  });

  it("keeps required capabilities visible until a host verifies them", () => {
    const skill = stableSkill({
      capabilities: { required: ["ide.files.read"], optional: [], denied: [] }
    });
    const unknown = inspectSkillPortability(skill, { target: "agent-skills" });
    assert.equal(unknown.ready, true);
    assert.equal(unknown.installable, false);
    assert.equal(unknown.capabilityVerificationRequired, true);

    const supported = inspectSkillPortability(skill, {
      target: "agent-skills",
      targetCapabilities: ["ide.files.read"]
    });
    assert.equal(supported.installable, true);
  });
});

describe("compilePortableSkill", () => {
  it("compiles a native SKILL.md with EOS provenance", () => {
    const result = compilePortableSkill(stableSkill(), { target: "agent-skills" });
    assert.equal(result.artifact.path, "evidence-review/SKILL.md");
    assert.match(result.artifact.content, /eosSkillId/);
    assert.match(result.artifact.content, /Inspect the supplied evidence/);
    assert.match(result.sourceHash, /^[a-f0-9]{64}$/);
  });

  it("compiles an instruction-only MCP descriptor with no fake tool", () => {
    const result = compilePortableSkill(stableSkill(), { target: "generic-mcp" });
    assert.equal(result.artifact.descriptor.mode, "instruction");
    assert.equal(result.artifact.descriptor.prompt.name, "evidence-review");
    assert.equal("tools" in result.artifact.descriptor, false);
  });

  it("exports Skill Central JSON-as-YAML only with a safe project identity", () => {
    const result = compilePortableSkill(stableSkill(), {
      target: "skill-central",
      projectIdentity: {
        projectId: "project.compiler",
        identity: "git:github.com/example/compiler"
      }
    });
    const parsed = JSON.parse(result.artifact.content);
    assert.equal(parsed.schemaVersion, "skillcentral.dev/v1");
    assert.deepEqual(parsed.appliesTo, { projects: ["git:github.com/example/compiler"] });
    assert.equal(parsed.prompt.includes("Inspect the supplied evidence"), true);
  });

  it("refuses to silently broaden EOS project scope for Skill Central", () => {
    assert.throws(
      () => compilePortableSkill(stableSkill(), { target: "skill-central" }),
      /requires a git: or path:/
    );
  });

  it("applies only allowlisted target overrides", () => {
    const skill = stableSkill({
      targetOverrides: {
        "agent-skills": {
          instructions: "Use the host-specific reviewed instructions.",
          status: "candidate"
        }
      }
    });
    const result = compilePortableSkill(skill, { target: "agent-skills" });
    assert.match(result.artifact.content, /host-specific reviewed instructions/);
  });

  it("uses stable portable slugs", () => {
    assert.equal(portableSkillSlug("  Evidence / Review  "), "evidence-review");
  });
});
