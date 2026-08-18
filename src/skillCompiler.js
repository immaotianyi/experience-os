/**
 * Portable Skill compiler.
 *
 * EOS owns the reviewed Skill record. Compiled files are derived artifacts:
 * they may be replaced or deleted without changing the source of truth.
 */

import { createHash } from "node:crypto";
import { PORTABLE_SKILL_SCHEMA_VERSION } from "./domain.js";
import { validateSkillForProduction } from "./validate.js";

export const SKILL_COMPILE_TARGETS = Object.freeze([
  "agent-skills",
  "generic-mcp",
  "skill-central"
]);

const TARGET_FEATURES = Object.freeze({
  "agent-skills": ["instructions", "lazy-loading", "metadata"],
  "generic-mcp": ["instructions", "mcp.prompts", "mcp.resources", "metadata"],
  "skill-central": ["instructions", "activation", "capability-declarations", "degradation", "metadata"]
});

export function portableSkillSlug(value) {
  return String(value || "skill")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "skill";
}

export function inspectSkillPortability(skill, options = {}) {
  const target = options.target ?? null;
  const targetCapabilities = Array.isArray(options.targetCapabilities)
    ? new Set(options.targetCapabilities)
    : null;
  const blockers = [];
  const warnings = [];

  if (!skill || skill.kind !== "Skill") {
    blockers.push("record_is_not_skill");
  } else {
    for (const issue of validateSkillForProduction(skill)) {
      blockers.push(`schema:${issue}`);
    }
    if (skill.status !== "stable") blockers.push(`status_not_stable:${skill.status ?? "missing"}`);
    if (typeof skill.instructions !== "string" || !skill.instructions.trim()) {
      blockers.push("instructions_missing");
    }
    if (!Array.isArray(skill.evidenceLinkIds) || skill.evidenceLinkIds.length === 0) {
      warnings.push("evidence_links_missing");
    }
    if (skill.executionBinding) {
      warnings.push("execution_binding_not_exported_as_tool");
    }
  }

  if (target && !SKILL_COMPILE_TARGETS.includes(target)) {
    blockers.push(`unsupported_target:${target}`);
  }

  const requiredCapabilities = skill?.capabilities?.required ?? [];
  const missingRequiredCapabilities = targetCapabilities
    ? requiredCapabilities.filter((capability) => !targetCapabilities.has(capability))
    : [];
  const capabilityVerificationRequired = requiredCapabilities.length > 0 && !targetCapabilities;
  if (missingRequiredCapabilities.length > 0) {
    blockers.push(`missing_required_capabilities:${missingRequiredCapabilities.join(",")}`);
  } else if (capabilityVerificationRequired) {
    warnings.push("required_capabilities_unverified");
  }

  return {
    ready: blockers.length === 0,
    installable: blockers.length === 0 && !capabilityVerificationRequired,
    mode: "instruction",
    target,
    blockers,
    warnings,
    requiredCapabilities,
    missingRequiredCapabilities,
    capabilityVerificationRequired
  };
}

export function compilePortableSkill(skill, options = {}) {
  const target = options.target;
  if (!SKILL_COMPILE_TARGETS.includes(target)) {
    throw new Error(`Unsupported Skill compile target: ${target}`);
  }

  const effectiveSkill = applyTargetOverride(skill, target);
  const compatibility = inspectSkillPortability(effectiveSkill, {
    target,
    targetCapabilities: options.targetCapabilities
  });
  if (!compatibility.ready) {
    throw new Error(`Skill is not portable: ${compatibility.blockers.join("; ")}`);
  }

  const artifact = target === "agent-skills"
    ? compileAgentSkill(effectiveSkill)
    : target === "generic-mcp"
      ? compileGenericMcpDescriptor(effectiveSkill)
      : compileSkillCentral(effectiveSkill, options);

  return {
    schemaVersion: PORTABLE_SKILL_SCHEMA_VERSION,
    sourceSkillId: skill.id,
    sourceVersion: skill.version,
    sourceHash: sha256(JSON.stringify(skill)),
    target,
    compatibility,
    artifact
  };
}

function applyTargetOverride(skill, target) {
  const override = skill?.targetOverrides?.[target];
  if (!isObject(override)) return skill;
  const allowed = Object.fromEntries(
    ["instructions", "activation", "capabilities", "degradation"]
      .filter((field) => override[field] !== undefined)
      .map((field) => [field, override[field]])
  );
  return { ...skill, ...allowed };
}

function compileAgentSkill(skill) {
  const slug = portableSkillSlug(skill.name || skill.id);
  const description = skill.trigger?.intent || skill.name;
  const signals = skill.activation?.signals ?? skill.trigger?.signals ?? [];
  const scope = formatScope(skill.appliesTo);
  const content = [
    "---",
    `name: ${jsonScalar(slug)}`,
    `description: ${jsonScalar(description)}`,
    "metadata:",
    `  eosSkillId: ${jsonScalar(skill.id)}`,
    `  eosVersion: ${jsonScalar(skill.version || "0.1.0")}`,
    `  eosProjectId: ${jsonScalar(skill.projectId)}`,
    "---",
    "",
    `# ${skill.name}`,
    "",
    skill.instructions.trim(),
    "",
    "## Activation",
    "",
    `Intent: ${description}`,
    `Signals: ${signals.length > 0 ? signals.join(", ") : "none"}`,
    `Scope: ${scope}`,
    "",
    "## Safety",
    "",
    `Level: ${skill.safetyLevel}`,
    `Human confirmation: ${skill.humanConfirmationRequired ? "required" : "not required"}`,
    `Fallback: ${skill.fallback}`,
    "",
    "## Input Schema",
    "",
    "```json",
    JSON.stringify(skill.inputSchema ?? {}, null, 2),
    "```",
    "",
    "## Output Schema",
    "",
    "```json",
    JSON.stringify(skill.outputSchema ?? {}, null, 2),
    "```",
    ""
  ].join("\n");

  return {
    kind: "agent-skill",
    path: `${slug}/SKILL.md`,
    mediaType: "text/markdown",
    content
  };
}

function compileGenericMcpDescriptor(skill) {
  const slug = portableSkillSlug(skill.name || skill.id);
  const descriptor = {
    schemaVersion: PORTABLE_SKILL_SCHEMA_VERSION,
    id: skill.id,
    version: skill.version,
    mode: "instruction",
    name: skill.name,
    description: skill.trigger?.intent || skill.name,
    prompt: {
      name: slug,
      instructions: skill.instructions
    },
    resource: {
      uri: `skill://${slug}`,
      mimeType: "text/markdown"
    },
    inputSchema: skill.inputSchema,
    outputSchema: skill.outputSchema,
    safety: {
      level: skill.safetyLevel,
      humanConfirmationRequired: skill.humanConfirmationRequired,
      fallback: skill.fallback
    },
    provenance: {
      projectId: skill.projectId,
      evidenceLinkIds: skill.evidenceLinkIds ?? [],
      origin: skill.origin
    }
  };
  return {
    kind: "mcp-instruction",
    path: `${slug}/skill.json`,
    mediaType: "application/json",
    content: `${JSON.stringify(descriptor, null, 2)}\n`,
    descriptor
  };
}

function compileSkillCentral(skill, options) {
  const slug = portableSkillSlug(skill.name || skill.id);
  const appliesTo = skillCentralScope(skill.appliesTo, options.projectIdentity);
  const document = {
    schemaVersion: "skillcentral.dev/v1",
    id: slug,
    name: skill.name,
    description: skill.trigger?.intent || skill.name,
    version: skill.version,
    type: "prompt",
    tags: skill.activation?.signals ?? skill.trigger?.signals ?? [],
    appliesTo,
    metadata: {
      eosSkillId: skill.id,
      eosProjectId: skill.projectId,
      eosEvidenceLinkIds: skill.evidenceLinkIds ?? [],
      eosOrigin: skill.origin
    },
    activation: {
      intents: skill.activation?.intents ?? [skill.trigger.intent],
      priority: skill.activation?.priority ?? 0
    },
    capabilities: skill.capabilities,
    degradation: skill.degradation,
    inputs: skill.inputSchema,
    outputs: skill.outputSchema,
    prompt: skill.instructions
  };
  return {
    kind: "skill-central-yaml",
    path: `${slug}.yaml`,
    mediaType: "application/yaml",
    // JSON is valid YAML 1.2 and avoids an ungoverned string-based YAML emitter.
    content: `${JSON.stringify(document, null, 2)}\n`,
    document
  };
}

function skillCentralScope(scope, projectIdentity) {
  if (scope === undefined || scope === "global") return "global";
  const projects = scope.projects ?? [];
  const mapped = projects.map((projectId) => projectId === projectIdentity?.projectId
    ? projectIdentity.identity
    : projectId);
  const invalid = mapped.filter((projectId) => !/^(git:|path:)/.test(projectId));
  if (invalid.length > 0) {
    throw new Error(
      "Skill Central export requires a git: or path: project identity; refusing to broaden project scope"
    );
  }
  return { projects: mapped };
}

function formatScope(scope) {
  if (scope === undefined || scope === "global") return "global";
  return (scope.projects ?? []).join(", ");
}

function jsonScalar(value) {
  return JSON.stringify(String(value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
