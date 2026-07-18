/**
 * 3.0 Project Engine — the real main loop of Experience OS.
 *
 * 2.0 was a prototype control panel (9 views over simulated pipeline data).
 * 3.0 makes the main loop real:
 *
 *   project start → natural collaboration → Experience Receipt
 *   → controlled production → verification → outcome record
 *   → evidence-backed reuse
 *
 * This module implements the project-facing operations:
 *   - createProject / updateProject / getProject
 *   - addEvidenceLink / listEvidenceForProject
 *   - writeExperienceReceipt / listReceiptsForProject
 *   - recordDecision / recordOutcome
 *   - buildProjectTimeline (the chronological view the UI will render)
 *
 * All writes go through the vault (GitVault in production), so every
 * action is traceable and revertible.
 */

import {
  createProject,
  createEvidenceLink,
  createExperienceReceipt,
  createExperienceReceiptDraft,
  createDecisionReceipt,
  createOutcomeRecord,
  createConversationEvent,
  createWorkCheckpoint,
  createExperienceAsset,
  createReuseContext,
  nowIso,
  AUTONOMY_MODES,
  PROJECT_STATUSES,
  OUTCOME_STATES,
  EVIDENCE_TYPES
} from "./domain.js";
import { assertAllowed, evaluatePolicy } from "./executionPolicy.js";

function ensureString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required and must be a non-empty string`);
  }
  return value.trim();
}

function ensureAutonomyMode(mode) {
  if (!AUTONOMY_MODES.includes(mode)) {
    throw new Error(`autonomyMode must be one of: ${AUTONOMY_MODES.join(", ")}`);
  }
  return mode;
}

function ensureProjectStatus(status) {
  if (!PROJECT_STATUSES.includes(status)) {
    throw new Error(`status must be one of: ${PROJECT_STATUSES.join(", ")}`);
  }
  return status;
}

function ensureOutcomeState(outcome) {
  if (!OUTCOME_STATES.includes(outcome)) {
    throw new Error(`outcome must be one of: ${OUTCOME_STATES.join(", ")}`);
  }
  return outcome;
}

function ensureEvidenceType(type) {
  if (!EVIDENCE_TYPES.includes(type)) {
    throw new Error(`type must be one of: ${EVIDENCE_TYPES.join(", ")}`);
  }
  return type;
}

function ensureArray(value, field) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  return value;
}

function ensureObject(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value;
}

function ensureOrigin(origin) {
  if (!["human", "relay", "ai"].includes(origin)) {
    throw new Error("origin must be human, relay, or ai");
  }
  return origin;
}

async function requireProject(vault, projectId) {
  const project = await vault.load("Project", projectId);
  if (!project) throw new Error(`project not found: ${projectId}`);
  return project;
}

async function requireProjectEvidence(vault, projectId, evidenceLinkIds) {
  ensureArray(evidenceLinkIds, "evidenceLinkIds");
  const uniqueIds = [...new Set(evidenceLinkIds)];
  if (uniqueIds.length !== evidenceLinkIds.length) throw new Error("evidenceLinkIds must not contain duplicates");
  for (const evidenceId of uniqueIds) {
    ensureString(evidenceId, "evidenceLinkIds item");
    const evidence = await vault.load("EvidenceLink", evidenceId);
    if (!evidence) throw new Error(`evidence not found: ${evidenceId}`);
    if (evidence.projectId !== projectId) throw new Error(`evidence ${evidenceId} belongs to another project`);
  }
  return uniqueIds;
}

function guardAiWrite(action, project, origin) {
  if (origin !== "ai") return;
  assertAllowed(action, project.autonomyMode);
}

/**
 * Atomically append an ID to a project's array field (evidenceLinkIds or experienceReceiptIds).
 * Re-loads the project inside the write lock to avoid TOCTOU race conditions.
 */
async function appendToProjectArray(vault, projectId, fieldName, newId) {
  const doAppend = async () => {
    const fresh = await vault.load("Project", projectId);
    if (!fresh) throw new Error(`project not found: ${projectId}`);
    const arr = [...(fresh[fieldName] || []), newId];
    await vault.save({ ...fresh, [fieldName]: arr, updatedAt: nowIso() });
  };
  // Use write lock if available (GitVault); otherwise fall back to direct save
  if (typeof vault.withWriteLock === "function") {
    await vault.withWriteLock(doAppend);
  } else {
    await doAppend();
  }
}

/**
 * Validate an uncertainty value: must be null, undefined, or a finite number in [0, 1].
 * Rejects NaN (which typeof reports as "number" but which is not a valid measurement).
 */
function ensureUncertainty(value, field = "uncertainty") {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 1) {
    throw new Error(`${field} must be a number between 0 and 1 (or null), got: ${value}`);
  }
  return num;
}

/**
 * Create a new project with the 3.0 lifecycle (not the 2.0 pipeline states).
 */
export async function startProject(vault, {
  id,
  name,
  goal,
  constraints = [],
  acceptanceCriteria = [],
  ownerId = null,
  autonomyMode = "advise",
  tags = []
}) {
  ensureString(id, "id");
  ensureString(name, "name");
  ensureString(goal, "goal");
  ensureAutonomyMode(autonomyMode);
  const project = createProject({
    id,
    name,
    goal,
    constraints,
    acceptanceCriteria,
    ownerId,
    status: "planning",
    autonomyMode,
    tags
  });
  await vault.save(project);
  return project;
}

/**
 * Update project fields (status, autonomyMode, tags, etc.).
 */
export async function updateProject(vault, projectId, updates) {
  const project = await requireProject(vault, projectId);
  const allowedFields = new Set(["status", "autonomyMode", "tags", "constraints", "acceptanceCriteria", "metricsSummary"]);
  const unknownFields = Object.keys(updates).filter((field) => !allowedFields.has(field));
  if (unknownFields.length) throw new Error(`project fields cannot be updated: ${unknownFields.join(", ")}`);
  if (updates.status !== undefined) ensureProjectStatus(updates.status);
  if (updates.autonomyMode !== undefined) ensureAutonomyMode(updates.autonomyMode);
  const updated = {
    ...project,
    ...updates,
    updatedAt: nowIso()
  };
  await vault.save(updated);
  return updated;
}

export async function getProject(vault, projectId) {
  return vault.load("Project", projectId);
}

/**
 * Add an evidence link to a project.
 * Evidence is the foundation of faithful compression — we keep the source,
 * hash, uncertainty, counterexamples and applicability bounds so the
 * evidence can be re-examined, not just trusted.
 */
export async function addEvidenceLink(vault, {
  id,
  projectId,
  type,
  title,
  source,
  hash = null,
  notes = "",
  uncertainty = null,
  counterexamples = [],
  applicabilityBounds = [],
  tags = [],
  origin = "human",
  actor = "human"
}) {
  ensureString(id, "id");
  ensureString(projectId, "projectId");
  ensureEvidenceType(type);
  ensureString(title, "title");
  ensureString(source, "source");
  ensureArray(counterexamples, "counterexamples");
  ensureArray(applicabilityBounds, "applicabilityBounds");
  ensureArray(tags, "tags");
  ensureOrigin(origin);
  const project = await requireProject(vault, projectId);
  guardAiWrite("save_evidence", project, origin);

  const validatedUncertainty = ensureUncertainty(uncertainty);

  const link = createEvidenceLink({
    id,
    projectId,
    type,
    title,
    source,
    hash,
    notes,
    uncertainty: validatedUncertainty,
    counterexamples,
    applicabilityBounds,
    tags,
    origin,
    actor
  });
  await vault.save(link);

  // Atomically append the evidence ID to the project's evidenceLinkIds.
  // Re-load the project inside the write lock to avoid TOCTOU race conditions
  // where two concurrent requests could overwrite each other's evidenceLinkIds.
  await appendToProjectArray(vault, projectId, "evidenceLinkIds", id);

  return link;
}

export async function listEvidenceForProject(vault, projectId) {
  const all = await vault.list("EvidenceLink");
  return all.filter((e) => e.projectId === projectId).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

/**
 * Write an Experience Receipt — a faithful compression of a project phase.
 *
 * This is the core of 3.0: instead of claiming "lossless transfer" of
 * experience, we produce an honest summary that preserves:
 *   - what was tried
 *   - the evidence backing it
 *   - the outcome (success/partial/failure)
 *   - the uncertainty
 *   - counterexamples and applicability bounds
 *   - lessons learned
 */
export async function writeExperienceReceipt(vault, {
  id,
  projectId,
  phase,
  summary,
  evidenceLinkIds = [],
  outcome,
  uncertainty = null,
  counterexamples = [],
  applicabilityBounds = [],
  lessonsLearned = [],
  autonomyMode = "advise",
  sourceDraftId = null,
  origin = "human",
  actor = "human"
}) {
  ensureString(id, "id");
  ensureString(projectId, "projectId");
  ensureString(phase, "phase");
  ensureString(summary, "summary");
  ensureAutonomyMode(autonomyMode);
  ensureOutcomeState(outcome);
  ensureArray(counterexamples, "counterexamples");
  ensureArray(applicabilityBounds, "applicabilityBounds");
  ensureArray(lessonsLearned, "lessonsLearned");
  ensureOrigin(origin);
  const validatedUncertainty = ensureUncertainty(uncertainty);

  const project = await requireProject(vault, projectId);
  guardAiWrite("write_receipt", project, origin);
  const verifiedEvidenceIds = await requireProjectEvidence(vault, projectId, evidenceLinkIds);

  const receipt = createExperienceReceipt({
    id,
    projectId,
    phase,
    summary,
    evidenceLinkIds: verifiedEvidenceIds,
    outcome,
    uncertainty: validatedUncertainty,
    counterexamples,
    applicabilityBounds,
    lessonsLearned,
    autonomyMode,
    sourceDraftId,
    origin,
    actor
  });
  await vault.save(receipt);

  // Atomically append the receipt ID to the project's experienceReceiptIds.
  await appendToProjectArray(vault, projectId, "experienceReceiptIds", id);

  return receipt;
}

export async function listReceiptsForProject(vault, projectId) {
  const all = await vault.list("ExperienceReceipt");
  return all.filter((r) => r.projectId === projectId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function parseDraftJson(content) {
  const raw = String(content || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("response is not an object");
    return parsed;
  } catch (error) {
    throw new Error(`LLM returned an invalid receipt draft: ${error.message}`);
  }
}

function draftStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()) : [];
}

/**
 * Generate an explicitly requested, cited receipt proposal. This persists a
 * draft only; it never creates a receipt or changes an experience's status.
 */
export async function proposeExperienceReceiptDraft(vault, llm, { id, projectId, checkpointIds }) {
  ensureString(id, "id");
  ensureString(projectId, "projectId");
  const uniqueCheckpointIds = [...new Set(ensureArray(checkpointIds, "checkpointIds"))];
  if (uniqueCheckpointIds.length === 0) throw new Error("checkpointIds must contain at least one checkpoint");
  const project = await requireProject(vault, projectId);
  const checkpoints = [];
  for (const checkpointId of uniqueCheckpointIds) {
    ensureString(checkpointId, "checkpointIds item");
    const checkpoint = await vault.load("WorkCheckpoint", checkpointId);
    if (!checkpoint) throw new Error(`work checkpoint not found: ${checkpointId}`);
    if (checkpoint.projectId !== projectId) throw new Error(`work checkpoint ${checkpointId} belongs to another project`);
    checkpoints.push(checkpoint);
  }

  const evidenceLinkIds = [...new Set(checkpoints.map((checkpoint) => checkpoint.evidenceLinkId))];
  await requireProjectEvidence(vault, projectId, evidenceLinkIds);
  const events = await Promise.all(checkpoints.map((checkpoint) => vault.load("ConversationEvent", checkpoint.eventId)));
  if (events.some((event) => !event || event.projectId !== projectId || event.consented !== true)) {
    throw new Error("every work checkpoint must reference a consented event in this project");
  }

  const materials = checkpoints.map((checkpoint, index) => {
    const event = events[index];
    return `[Checkpoint ${checkpoint.id}] ${checkpoint.title}\nSource: ${event.sourceTool}\nContent: ${event.content}\nNotes: ${checkpoint.notes || "(none)"}\nEvidence ID: ${checkpoint.evidenceLinkId}`;
  }).join("\n\n");
  const response = await llm.complete({
    system: "You propose a cited Experience Receipt draft. You cannot create verified experience or make a human decision.",
    prompt: `Experience Receipt DRAFT\nProject: ${project.name}\nGoal: ${project.goal}\n\nUse only these consented materials:\n${materials}\n\nReturn JSON with phase, summary, outcome, uncertainty, counterexamples, applicabilityBounds, lessonsLearned.`,
    maxTokens: 900,
    temperature: 0.2
  });
  const proposed = parseDraftJson(response.content);
  const outcome = OUTCOME_STATES.includes(proposed.outcome) ? proposed.outcome : "unknown";
  const uncertainty = ensureUncertainty(proposed.uncertainty);
  const draft = createExperienceReceiptDraft({
    id,
    projectId,
    checkpointIds: uniqueCheckpointIds,
    evidenceLinkIds,
    phase: typeof proposed.phase === "string" && proposed.phase.trim() ? proposed.phase.trim() : "协作",
    summary: ensureString(proposed.summary, "LLM draft summary"),
    outcome,
    uncertainty,
    counterexamples: draftStringArray(proposed.counterexamples),
    applicabilityBounds: draftStringArray(proposed.applicabilityBounds),
    lessonsLearned: draftStringArray(proposed.lessonsLearned),
    generatedBy: { provider: llm.name, model: response.model, usage: response.usage }
  });
  await vault.save(draft);
  return draft;
}

export async function listExperienceReceiptDrafts(vault, projectId) {
  await requireProject(vault, projectId);
  return (await vault.list("ExperienceReceiptDraft"))
    .filter((draft) => draft.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function acceptExperienceReceiptDraft(vault, { draftId, receiptId, actor = "human", edits = {} }) {
  ensureString(draftId, "draftId");
  ensureString(receiptId, "receiptId");
  ensureString(actor, "actor");
  ensureObject(edits, "edits");
  const draft = await vault.load("ExperienceReceiptDraft", draftId);
  if (!draft) throw new Error(`experience receipt draft not found: ${draftId}`);
  if (draft.status !== "pending_review") throw new Error("only a pending receipt draft can be accepted");
  const allowedEdits = new Set(["phase", "summary", "outcome", "uncertainty", "counterexamples", "applicabilityBounds", "lessonsLearned"]);
  const unknownEdits = Object.keys(edits).filter((key) => !allowedEdits.has(key));
  if (unknownEdits.length) throw new Error(`receipt draft edits are not allowed: ${unknownEdits.join(", ")}`);
  const receipt = await writeExperienceReceipt(vault, {
    id: receiptId,
    projectId: draft.projectId,
    phase: edits.phase ?? draft.phase,
    summary: edits.summary ?? draft.summary,
    evidenceLinkIds: draft.evidenceLinkIds,
    outcome: edits.outcome ?? draft.outcome,
    uncertainty: edits.uncertainty ?? draft.uncertainty,
    counterexamples: edits.counterexamples ?? draft.counterexamples,
    applicabilityBounds: edits.applicabilityBounds ?? draft.applicabilityBounds,
    lessonsLearned: edits.lessonsLearned ?? draft.lessonsLearned,
    autonomyMode: "advise",
    sourceDraftId: draftId,
    origin: "human",
    actor
  });
  await vault.save({ ...draft, status: "accepted", acceptedReceiptId: receipt.id, acceptedBy: actor, updatedAt: nowIso() });
  return { draft: await vault.load("ExperienceReceiptDraft", draftId), receipt };
}

export async function rejectExperienceReceiptDraft(vault, { draftId, actor = "human", reason = "" }) {
  ensureString(draftId, "draftId");
  ensureString(actor, "actor");
  const draft = await vault.load("ExperienceReceiptDraft", draftId);
  if (!draft) throw new Error(`experience receipt draft not found: ${draftId}`);
  if (draft.status !== "pending_review") throw new Error("only a pending receipt draft can be rejected");
  const updated = { ...draft, status: "rejected", rejectedBy: actor, rejectionReason: String(reason || "").trim(), updatedAt: nowIso() };
  await vault.save(updated);
  return updated;
}

/**
 * Record an autonomous decision. Required when autonomyMode >= execute.
 * Every decision is traceable and (by default) revertible.
 */
export async function recordDecision(vault, {
  id,
  projectId,
  action,
  target,
  rationale,
  evidenceLinkIds = [],
  receiptId = null,
  autonomyMode,
  humanReviewed = false,
  reviewedBy = null,
  revertible = true,
  revertInstructions = null,
  origin = "human",
  actor = "human"
}) {
  ensureString(id, "id");
  ensureString(projectId, "projectId");
  ensureString(action, "action");
  ensureString(target, "target");
  ensureString(rationale, "rationale");
  ensureAutonomyMode(autonomyMode);
  ensureOrigin(origin);
  const project = await requireProject(vault, projectId);
  guardAiWrite("record_decision", project, origin);
  const verifiedEvidenceIds = await requireProjectEvidence(vault, projectId, evidenceLinkIds);
  if (receiptId !== null) {
    ensureString(receiptId, "receiptId");
    const receipt = await vault.load("ExperienceReceipt", receiptId);
    if (!receipt) throw new Error(`receipt not found: ${receiptId}`);
    if (receipt.projectId !== projectId) throw new Error(`receipt ${receiptId} belongs to another project`);
    const missingReceiptEvidence = receipt.evidenceLinkIds.filter((evidenceId) => !verifiedEvidenceIds.includes(evidenceId));
    if (missingReceiptEvidence.length) throw new Error(`decision must cite every receipt evidence link: ${missingReceiptEvidence.join(", ")}`);
  }

  const decision = createDecisionReceipt({
    id,
    projectId,
    action,
    target,
    rationale,
    evidenceLinkIds: verifiedEvidenceIds,
    receiptId,
    autonomyMode,
    humanReviewed,
    reviewedBy,
    revertible,
    revertInstructions,
    origin,
    actor
  });
  await vault.save(decision);
  return decision;
}

/**
 * Record the outcome of an action/decision, closing the feedback loop.
 */
export async function recordOutcome(vault, {
  id,
  projectId,
  decisionReceiptId = null,
  action,
  outcome,
  metrics = {},
  notes = "",
  evidenceLinkIds = [],
  origin = "human",
  actor = "human"
}) {
  ensureString(id, "id");
  ensureString(projectId, "projectId");
  ensureString(action, "action");
  ensureOutcomeState(outcome);
  ensureObject(metrics, "metrics");
  ensureOrigin(origin);
  const project = await requireProject(vault, projectId);
  guardAiWrite("record_outcome", project, origin);
  const verifiedEvidenceIds = await requireProjectEvidence(vault, projectId, evidenceLinkIds);
  if (decisionReceiptId !== null) {
    ensureString(decisionReceiptId, "decisionReceiptId");
    const decision = await vault.load("DecisionReceipt", decisionReceiptId);
    if (!decision) throw new Error(`decision not found: ${decisionReceiptId}`);
    if (decision.projectId !== projectId) throw new Error(`decision ${decisionReceiptId} belongs to another project`);
  }

  const record = createOutcomeRecord({
    id,
    projectId,
    decisionReceiptId,
    action,
    outcome,
    metrics,
    notes,
    evidenceLinkIds: verifiedEvidenceIds,
    origin,
    actor
  });
  await vault.save(record);
  return record;
}

/**
 * Build a chronological timeline for a project, interleaving:
 *   - evidence links (when they were captured)
 *   - experience receipts (when they were written)
 *   - decision receipts (when decisions were made)
 *   - outcome records (when outcomes were observed)
 *
 * This is the data the 3.0 UI will render as the project's story.
 */
export async function buildProjectTimeline(vault, projectId) {
  await requireProject(vault, projectId);
  const [events, evidence, receipts, decisions, outcomes, checkpoints] = await Promise.all([
    vault.list("ConversationEvent").then((all) => all.filter((event) => event.projectId === projectId)),
    listEvidenceForProject(vault, projectId),
    listReceiptsForProject(vault, projectId),
    vault.list("DecisionReceipt").then((all) => all.filter((d) => d.projectId === projectId)),
    vault.list("OutcomeRecord").then((all) => all.filter((o) => o.projectId === projectId)),
    vault.list("WorkCheckpoint").then((all) => all.filter((checkpoint) => checkpoint.projectId === projectId))
  ]);

  const timeline = [
    ...events.map((event) => ({ kind: "ConversationEvent", timestamp: event.createdAt, record: event })),
    ...evidence.map((e) => ({ kind: "EvidenceLink", timestamp: e.capturedAt, record: e })),
    ...receipts.map((r) => ({ kind: "ExperienceReceipt", timestamp: r.createdAt, record: r })),
    ...decisions.map((d) => ({ kind: "DecisionReceipt", timestamp: d.createdAt, record: d })),
    ...outcomes.map((o) => ({ kind: "OutcomeRecord", timestamp: o.createdAt, record: o })),
    ...checkpoints.map((checkpoint) => ({ kind: "WorkCheckpoint", timestamp: checkpoint.createdAt, record: checkpoint }))
  ];

  timeline.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return {
    projectId,
    counts: {
      evidence: evidence.length,
      events: events.length,
      receipts: receipts.length,
      decisions: decisions.length,
      outcomes: outcomes.length,
      checkpoints: checkpoints.length
    },
    timeline
  };
}

/**
 * Relay ingestion is intentionally narrow: a connector may send only a
 * consented collaboration event. EOS stores the original event locally and
 * exposes it as an evidence link; it does not silently scrape other tools.
 */
export async function captureCollaborationEvent(vault, {
  id,
  projectId,
  actor,
  content,
  sourceTool,
  sourceRef = null,
  consented = false
}) {
  ensureString(id, "id");
  ensureString(projectId, "projectId");
  ensureString(actor, "actor");
  ensureString(content, "content");
  ensureString(sourceTool, "sourceTool");
  if (consented !== true) throw new Error("relay capture requires explicit consent");
  await requireProject(vault, projectId);
  const event = createConversationEvent({ id, projectId, actor, content, sourceTool, sourceRef, consented });
  await vault.save(event);
  return event;
}

/**
 * Capture one explicit work boundary without making the user manually model
 * three storage objects. The raw collaboration event and its evidence link
 * remain separate and replayable; the checkpoint is their human-readable
 * grouping in the project timeline.
 */
export async function captureWorkCheckpoint(vault, {
  id,
  eventId,
  evidenceId,
  projectId,
  title,
  content,
  sourceTool,
  sourceRef = null,
  notes = "",
  actor = "human",
  consented = false
}) {
  ensureString(id, "id");
  ensureString(eventId, "eventId");
  ensureString(evidenceId, "evidenceId");
  ensureString(projectId, "projectId");
  ensureString(title, "title");
  ensureString(content, "content");
  ensureString(sourceTool, "sourceTool");
  ensureString(actor, "actor");
  if (consented !== true) throw new Error("work checkpoint requires explicit consent");

  const writeCheckpoint = async () => {
    // Check for duplicate IDs before writing
    const existingEvent = await vault.load("ConversationEvent", eventId);
    if (existingEvent) throw new Error(`conversation event already exists: ${eventId}`);
    const existingEvidence = await vault.load("EvidenceLink", evidenceId);
    if (existingEvidence) throw new Error(`evidence link already exists: ${evidenceId}`);
    const existingCheckpoint = await vault.load("WorkCheckpoint", id);
    if (existingCheckpoint) throw new Error(`work checkpoint already exists: ${id}`);

    const project = await requireProject(vault, projectId);
    const event = createConversationEvent({
      id: eventId,
      projectId,
      actor,
      content,
      sourceTool,
      sourceRef,
      consented: true
    });
    const evidence = createEvidenceLink({
      id: evidenceId,
      projectId,
      type: "observation",
      title,
      source: sourceRef ? `${sourceTool}:${sourceRef}` : `relay:${sourceTool}`,
      notes,
      origin: "relay",
      actor
    });
    const checkpoint = createWorkCheckpoint({
      id,
      projectId,
      title,
      eventId,
      evidenceLinkId: evidenceId,
      notes
    });

    await vault.save(event);
    await vault.save(evidence);
    await vault.save({
      ...project,
      evidenceLinkIds: [...(project.evidenceLinkIds || []), evidenceId],
      updatedAt: nowIso()
    });
    await vault.save(checkpoint);
    return { checkpoint, event, evidence };
  };

  return typeof vault.withWriteLock === "function"
    ? vault.withWriteLock(writeCheckpoint)
    : writeCheckpoint();
}

/**
 * Promote a receipt only after the full epistemic chain is present:
 * source evidence -> human-reviewed decision -> successful observed outcome.
 */
export async function promoteExperienceAsset(vault, {
  id,
  projectId,
  receiptId,
  decisionReceiptId,
  outcomeRecordId,
  title,
  approvedBy
}) {
  ensureString(id, "id");
  ensureString(projectId, "projectId");
  ensureString(receiptId, "receiptId");
  ensureString(decisionReceiptId, "decisionReceiptId");
  ensureString(outcomeRecordId, "outcomeRecordId");
  ensureString(title, "title");
  ensureString(approvedBy, "approvedBy");
  await requireProject(vault, projectId);
  const [receipt, decision, outcome] = await Promise.all([
    vault.load("ExperienceReceipt", receiptId),
    vault.load("DecisionReceipt", decisionReceiptId),
    vault.load("OutcomeRecord", outcomeRecordId)
  ]);
  if (!receipt || receipt.projectId !== projectId) throw new Error("receipt must exist in this project");
  if (!decision || decision.projectId !== projectId) throw new Error("decision must exist in this project");
  if (!outcome || outcome.projectId !== projectId) throw new Error("outcome must exist in this project");
  if (receipt.evidenceLinkIds.length === 0) throw new Error("receipt needs at least one evidence link before promotion");
  if (decision.receiptId !== receiptId) throw new Error("decision must explicitly review the selected receipt");
  if (!decision.humanReviewed) throw new Error("decision requires human review before promotion");
  if (outcome.decisionReceiptId !== decisionReceiptId) throw new Error("outcome must reference the selected decision");
  if (outcome.outcome !== "success") throw new Error("only a successful observed outcome can be promoted");
  const asset = createExperienceAsset({
    id, projectId, receiptId, decisionReceiptId, outcomeRecordId, title,
    status: "approved", approvedBy
  });
  await vault.save(asset);
  return asset;
}

export async function getProjectReadiness(vault, projectId) {
  const timeline = await buildProjectTimeline(vault, projectId);
  const ready = [];
  for (const receipt of timeline.timeline.filter((item) => item.kind === "ExperienceReceipt").map((item) => item.record)) {
    const reasons = [];
    if (!receipt.evidenceLinkIds.length) reasons.push("缺少证据");
    const decisions = timeline.timeline.filter((item) => item.kind === "DecisionReceipt" && item.record.humanReviewed && item.record.receiptId === receipt.id).map((item) => item.record);
    const outcomes = timeline.timeline.filter((item) => item.kind === "OutcomeRecord" && item.record.outcome === "success").map((item) => item.record);
    const matchedDecision = decisions.find((decision) => outcomes.some((outcome) => outcome.decisionReceiptId === decision.id));
    if (!matchedDecision) reasons.push("缺少已人工审查且被成功结果验证的决策");
    ready.push({ receiptId: receipt.id, eligible: reasons.length === 0, reasons, decisionReceiptId: matchedDecision?.id ?? null });
  }
  return { projectId, receipts: ready, policy: evaluatePolicy("publish_skill", (await requireProject(vault, projectId)).autonomyMode) };
}

/** Read-only, conservative reuse: only approved experience assets, never drafts. */
export async function getVerifiedExperienceSuggestions(vault, projectId, query = "") {
  const project = await requireProject(vault, projectId);
  const terms = `${project.name} ${project.goal} ${query}`.toLowerCase().split(/[^a-z0-9\u4e00-\u9fa5]+/).filter(Boolean);
  const assets = (await vault.list("ExperienceAsset")).filter((asset) => asset.status === "approved" && asset.projectId !== projectId);
  const candidates = await Promise.all(assets.map(async (asset) => ({ asset, receipt: await vault.load("ExperienceReceipt", asset.receiptId) })));
  return candidates
    .filter(({ receipt }) => receipt)
    .map(({ asset, receipt }) => {
      const applicabilityBounds = receipt.applicabilityBounds || [];
      const text = `${asset.title} ${receipt.summary} ${applicabilityBounds.join(" ")}`.toLowerCase();
      const score = terms.filter((term) => text.includes(term)).length;
      return { assetId: asset.id, sourceProjectId: asset.projectId, receiptId: receipt.id, title: asset.title, summary: receipt.summary, applicabilityBounds, evidenceLinkIds: receipt.evidenceLinkIds, score, reason: score ? "与当前项目目标或描述存在关键词重合。" : "这是已验证经验，但当前关联度较低。" };
    })
    .filter((suggestion) => suggestion.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 3);
}

export async function recordExperienceReuseFeedback(vault, { projectId, assetId, decision, note = "" }) {
  ensureString(projectId, "projectId");
  ensureString(assetId, "assetId");
  if (!["adopted", "ignored", "not_applicable"].includes(decision)) throw new Error("decision must be adopted, ignored, or not_applicable");
  await requireProject(vault, projectId);
  const asset = await vault.load("ExperienceAsset", assetId);
  if (!asset || asset.status !== "approved" || asset.projectId === projectId) throw new Error("feedback requires an approved experience asset from another project");
  const context = createReuseContext({
    id: `reuse.${projectId}.${Date.now()}`,
    projectId,
    query: "verified_experience_feedback",
    matchedRecordIds: [{ id: assetId, kind: "ExperienceAsset", score: 1 }],
    contributionCandidates: [{ id: assetId, kind: "ExperienceAsset", expectedContribution: "人类对已验证经验建议的反馈", evidenceScore: 1, usedInRunIds: [], outcome: decision, note: String(note).trim() }],
    summary: `Verified experience ${assetId}: ${decision}${note ? ` — ${String(note).trim()}` : ""}`
  });
  await vault.save(context);
  return context;
}
