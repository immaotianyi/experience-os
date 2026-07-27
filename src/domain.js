export const STATES = Object.freeze({
  IDLE: "IDLE",
  COLLABORATING: "COLLABORATING",
  DIVERGING: "DIVERGING",
  CANDIDATE_EXTRACTED: "CANDIDATE_EXTRACTED",
  PRODUCTION_VALIDATING: "PRODUCTION_VALIDATING",
  WALL_HIT: "WALL_HIT",
  ARTIFACT_CREATED: "ARTIFACT_CREATED",
  HUMAN_REVIEW: "HUMAN_REVIEW",
  EXPERIENCE_EXTRACTING: "EXPERIENCE_EXTRACTING",
  ASSET_STORED: "ASSET_STORED",
  REUSE_READY: "REUSE_READY"
});

export const WALL_TYPES = Object.freeze({
  SCHEMA_MISSING: "schema_missing",
  TRIGGER_UNSTABLE: "trigger_unstable",
  SAFETY_UNCLEAR: "safety_unclear",
  FALLBACK_MISSING: "fallback_missing",
  HUMAN_CONFIRMATION_MISSING: "human_confirmation_missing",
  TARGET_MISSING: "target_missing"
});

export const SKILL_LEVELS = Object.freeze({
  STRATEGIC: "strategic",
  FUNCTIONAL: "functional",
  ATOMIC: "atomic"
});

export const SKILL_STATUSES = Object.freeze([
  "candidate",
  "candidate_retained",
  "candidate_confirmed",
  "stable",
  "needs_revision",
  "rejected"
]);

export const PREFERENCE_STATUSES = Object.freeze([
  "hypothesis",
  "confirmed",
  "confirmed_after_revision",
  "rejected"
]);

export const REVIEW_PACKET_STATUSES = Object.freeze([
  "pending",
  "decided"
]);

// 3.0 Autonomy spectrum — risk-tiered automation levels.
// explore: read-only research, no side effects
// advise: produces recommendations, human decides
// draft: produces artifacts for human review/edit
// execute: performs actions, human can observe and revert
// commit: persists changes without further confirmation
export const AUTONOMY_MODES = Object.freeze([
  "explore",
  "advise",
  "draft",
  "execute",
  "commit"
]);

// 3.0 Project lifecycle — richer than the 2.0 pipeline STATES.
// planning:  project created, goal/constraints being defined
// active:    work in progress
// paused:    intentionally halted
// completed: acceptance criteria met
// archived:  no longer active, preserved for reuse
export const PROJECT_STATUSES = Object.freeze([
  "planning",
  "active",
  "paused",
  "completed",
  "archived"
]);

// 3.0 Evidence types for EvidenceLink records.
export const EVIDENCE_TYPES = Object.freeze([
  "doc",        // documentation, design notes, specs
  "code",       // source code, diffs, commits
  "data",       // datasets, metrics, measurements
  "test",       // test results, coverage reports
  "feedback",   // user/stakeholder feedback
  "reference",  // external reference (paper, URL, book)
  "observation" // observed behavior, logs, traces
]);

// 3.0 Outcome states for ExperienceReceipt and OutcomeRecord.
export const OUTCOME_STATES = Object.freeze([
  "success",
  "partial",
  "failure",
  "unknown"
]);

export const EXPERIENCE_ASSET_STATUSES = Object.freeze([
  "candidate",
  "approved",
  "rejected"
]);

export const EXPERIENCE_RECEIPT_DRAFT_STATUSES = Object.freeze([
  "pending_review",
  "deferred",
  "accepted",
  "rejected"
]);

export function nowIso() {
  return new Date().toISOString();
}

export function createProject({
  id,
  name,
  goal,
  constraints = [],
  acceptanceCriteria = [],
  // 3.0 fields (all optional for backward compatibility)
  ownerId = null,
  status = "planning",        // PROJECT_STATUSES
  autonomyMode = "advise",    // AUTONOMY_MODES — default: human decides
  tags = [],
  evidenceLinkIds = [],
  experienceReceiptIds = [],
  metricsSummary = null
}) {
  return {
    id,
    kind: "Project",
    name,
    goal,
    constraints,
    acceptanceCriteria,
    state: STATES.IDLE,        // legacy pipeline state (kept for 2.0 compat)
    status,                    // 3.0 lifecycle status
    ownerId,
    autonomyMode,
    tags,
    evidenceLinkIds,
    experienceReceiptIds,
    metricsSummary,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

/**
 * 3.0 EvidenceLink — a traceable pointer to a piece of evidence.
 *
 * Faithful compression (not lossless transfer): we keep the source,
 * the hash, the uncertainty, counterexamples and applicability bounds
 * so the evidence can be re-examined, not just trusted blindly.
 */
export function createEvidenceLink({
  id,
  projectId,
  type,             // EVIDENCE_TYPES
  title,
  source,           // URL, file path, or textual reference
  hash = null,      // content hash for tamper detection
  capturedAt = null,
  notes = "",
  uncertainty = null,        // 0..1 or null if not assessed
  counterexamples = [],      // known cases where this evidence does not hold
  applicabilityBounds = [],  // explicit scope limits
  tags = [],
  origin = "human",
  actor = "human",
  capturePermitId = null
}) {
  return {
    id,
    kind: "EvidenceLink",
    projectId,
    type,
    title,
    source,
    hash,
    capturedAt: capturedAt ?? nowIso(),
    notes,
    uncertainty,
    counterexamples,
    applicabilityBounds,
    tags,
    origin,
    actor,
    capturePermitId,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

/**
 * 3.0 ExperienceReceipt — a faithful compression of what happened in a project phase.
 *
 * Replaces "无失真转移" with an honest summary that preserves:
 *   - what was tried (summary)
 *   - the evidence backing it (evidenceLinkIds)
 *   - the outcome (success/partial/failure)
 *   - the uncertainty (0..1)
 *   - counterexamples and applicability bounds
 *   - what was learned (lessonsLearned)
 */
export function createExperienceReceipt({
  id,
  projectId,
  phase,            // which project phase this receipt covers
  summary,
  evidenceLinkIds = [],
  outcome,          // OUTCOME_STATES
  uncertainty = null,
  counterexamples = [],
  applicabilityBounds = [],
  lessonsLearned = [],
  autonomyMode = "advise",   // at which autonomy level this was produced
  sourceDraftId = null,
  createdAt = null,
  origin = "human",
  actor = "human"
}) {
  return {
    id,
    kind: "ExperienceReceipt",
    projectId,
    phase,
    summary,
    evidenceLinkIds,
    outcome,
    uncertainty,
    counterexamples,
    applicabilityBounds,
    lessonsLearned,
    autonomyMode,
    sourceDraftId,
    origin,
    actor,
    createdAt: createdAt ?? nowIso(),
    updatedAt: nowIso()
  };
}

// A model proposal is never a verified experience. It must be accepted by a
// human into an ExperienceReceipt and subsequently validated by real work.
export function createExperienceReceiptDraft({
  id,
  projectId,
  checkpointIds,
  evidenceLinkIds,
  phase,
  summary,
  outcome = "unknown",
  uncertainty = null,
  counterexamples = [],
  applicabilityBounds = [],
  lessonsLearned = [],
  generationWarnings = [],
  generatedBy,
  status = "pending_review",
  createdAt = null
}) {
  return {
    id,
    kind: "ExperienceReceiptDraft",
    projectId,
    checkpointIds,
    evidenceLinkIds,
    phase,
    summary,
    outcome,
    uncertainty,
    counterexamples,
    applicabilityBounds,
    lessonsLearned,
    generationWarnings,
    generatedBy,
    status,
    createdAt: createdAt ?? nowIso(),
    updatedAt: nowIso()
  };
}

/**
 * 3.0 DecisionReceipt — records every autonomous decision the system makes.
 *
 * Required when autonomyMode >= execute. Contains:
 *   - what was decided (action, target)
 *   - why (rationale, evidenceLinkIds)
 *   - at which autonomy level
 *   - whether a human reviewed it
 *   - how to revert it
 */
export function createDecisionReceipt({
  id,
  projectId,
  action,           // what the system decided to do
  target,           // what the action operated on
  rationale,
  evidenceLinkIds = [],
  receiptId = null,
  autonomyMode,     // AUTONOMY_MODES at decision time
  humanReviewed = false,
  reviewedBy = null,
  revertible = true,
  revertInstructions = null,
  createdAt = null,
  origin = "human",
  actor = "human"
}) {
  return {
    id,
    kind: "DecisionReceipt",
    projectId,
    action,
    target,
    rationale,
    evidenceLinkIds,
    receiptId,
    autonomyMode,
    humanReviewed,
    reviewedBy,
    revertible,
    revertInstructions,
    origin,
    actor,
    createdAt: createdAt ?? nowIso()
  };
}

/**
 * 3.0 OutcomeRecord — records the result of an action/decision.
 *
 * Pairs with DecisionReceipt to close the feedback loop:
 *   decision → action → outcome → reflection → reuse
 */
export function createOutcomeRecord({
  id,
  projectId,
  decisionReceiptId = null,
  action,
  outcome,          // OUTCOME_STATES
  metrics = {},     // quantitative measurements
  notes = "",
  evidenceLinkIds = [],
  createdAt = null,
  origin = "human",
  actor = "human"
}) {
  return {
    id,
    kind: "OutcomeRecord",
    projectId,
    decisionReceiptId,
    action,
    outcome,
    metrics,
    notes,
    evidenceLinkIds,
    origin,
    actor,
    createdAt: createdAt ?? nowIso()
  };
}

export function createConversationEvent({ id, projectId, actor, content, sourceTool = "manual", sourceRef = null, consented = true, capturePermitId = null }) {
  return {
    id,
    kind: "ConversationEvent",
    projectId,
    actor,
    content,
    sourceTool,
    sourceRef,
    consented,
    capturePermitId,
    createdAt: nowIso()
  };
}

/** A user-marked, local work boundary that groups raw collaboration and evidence. */
export function createWorkCheckpoint({ id, projectId, title, eventId, evidenceLinkId, notes = "", capturePermitId = null, createdAt = null }) {
  return {
    id,
    kind: "WorkCheckpoint",
    projectId,
    title,
    eventId,
    evidenceLinkId,
    notes,
    capturePermitId,
    status: "captured",
    createdAt: createdAt ?? nowIso(),
    updatedAt: nowIso()
  };
}

/**
 * A reusable experience is deliberately not just a memory or a prompt.
 * It points to the receipt, the reviewed decision, and an observed outcome.
 */
export function createExperienceAsset({
  id,
  projectId,
  receiptId,
  decisionReceiptId,
  outcomeRecordId,
  title,
  status = "candidate",
  approvedBy = null,
  createdAt = null
}) {
  return {
    id,
    kind: "ExperienceAsset",
    projectId,
    receiptId,
    decisionReceiptId,
    outcomeRecordId,
    title,
    status,
    approvedBy,
    createdAt: createdAt ?? nowIso(),
    updatedAt: nowIso()
  };
}

/** A bounded, human-owned test of whether an approved experience helped in a new project. */
export function createExperienceReuseTrial({
  id, projectId, assetId, sourceProjectId, taskTitle, decisionNote = "", createdAt = null
}) {
  return {
    id,
    kind: "ExperienceReuseTrial",
    projectId,
    assetId,
    sourceProjectId,
    taskTitle,
    decision: "adopted",
    decisionNote,
    outcome: null,
    outcomeNote: "",
    reducedRepeatedDecision: null,
    completedAt: null,
    createdAt: createdAt ?? nowIso(),
    updatedAt: nowIso()
  };
}

export function createThoughtFragment({ id, projectId, sourceEventId, summary, themes, evidence }) {
  return {
    id,
    kind: "ThoughtFragment",
    projectId,
    sourceEventId,
    summary,
    themes,
    evidence,
    createdAt: nowIso()
  };
}

export function createRule({ id, projectId, title, statement, sourceThoughtIds, scope = "personal" }) {
  return {
    id,
    kind: "Rule",
    projectId,
    title,
    statement,
    sourceThoughtIds,
    scope,
    createdAt: nowIso()
  };
}

export function createSkillCandidate({
  id,
  projectId,
  name,
  origin,
  trigger,
  inputSchema,
  outputSchema,
  safetyLevel,
  fallback,
  humanConfirmationRequired,
  skillLevel = SKILL_LEVELS.FUNCTIONAL,
  memoryUtility = null,
  adaptationNotes = [],
  promotionGate = null,
  candidateReason = null,
  lastReviewDecisionId = null,
  reviewedAt = null
}) {
  return {
    id,
    kind: "Skill",
    projectId,
    name,
    origin,
    trigger,
    inputSchema,
    outputSchema,
    safetyLevel,
    fallback,
    humanConfirmationRequired,
    skillLevel,
    memoryUtility,
    adaptationNotes,
    status: "candidate",
    promotionGate,
    candidateReason,
    lastReviewDecisionId,
    reviewedAt,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

export function createWallHit({
  id,
  projectId,
  wallType,
  stage,
  message,
  blockedBy,
  suggestedFixes,
  status = "open",
  resolvedByIds = [],
  resolvedAt = null,
  // 3.0 readable WallHit fields (all optional for backward compat)
  impact = null,              // what this wall blocks (human-readable)
  evidenceLinkIds = [],       // evidence proving this is a real wall
  options = [],               // alternative paths forward
  acceptanceCriteria = [],    // how to know the wall is truly resolved
  replaySteps = [],           // how to reproduce the problem
  severity = null             // "low" | "medium" | "high" | "blocker"
}) {
  return {
    id,
    kind: "WallHit",
    projectId,
    wallType,
    stage,
    message,
    blockedBy,
    suggestedFixes,
    humanDecisionNeeded: true,
    status,
    resolvedByIds,
    resolvedAt,
    // 3.0 readable fields
    impact,
    evidenceLinkIds,
    options,
    acceptanceCriteria,
    replaySteps,
    severity,
    createdAt: nowIso()
  };
}

export function createArtifact({ id, projectId, title, artifactType, content, sourceIds = [] }) {
  return {
    id,
    kind: "Artifact",
    projectId,
    title,
    artifactType,
    content,
    sourceIds,
    createdAt: nowIso()
  };
}

export function createHumanEditLog({
  id,
  projectId,
  sourceEventId,
  before,
  after,
  editType,
  rationale,
  capturedSignals = []
}) {
  return {
    id,
    kind: "HumanEditLog",
    projectId,
    sourceEventId,
    before,
    after,
    editType,
    rationale,
    capturedSignals,
    createdAt: nowIso()
  };
}

export function createSubgoalSegment({ id, projectId, sourceEditLogIds, title, intent, inputs = [], outputs = [] }) {
  return {
    id,
    kind: "SubgoalSegment",
    projectId,
    sourceEditLogIds,
    title,
    intent,
    inputs,
    outputs,
    createdAt: nowIso()
  };
}

export function createWorkflowPattern({
  id,
  projectId,
  sourceSubgoalIds,
  name,
  pattern,
  recurrenceEvidence = [],
  candidateSkillIds = []
}) {
  return {
    id,
    kind: "WorkflowPattern",
    projectId,
    sourceSubgoalIds,
    name,
    pattern,
    recurrenceEvidence,
    candidateSkillIds,
    createdAt: nowIso()
  };
}

export function createPreferenceHypothesis({
  id,
  projectId,
  statement,
  evidenceIds,
  confidence,
  status = "hypothesis",
  decayPolicy = "requires_revalidation",
  lastReviewDecisionId = null,
  reviewedAt = null
}) {
  return {
    id,
    kind: "PreferenceHypothesis",
    projectId,
    statement,
    evidenceIds,
    confidence,
    status,
    decayPolicy,
    lastReviewDecisionId,
    reviewedAt,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

export function createReflectionMemory({
  id,
  projectId,
  sourceWallHitId,
  lesson,
  avoidNextTime,
  replayPointers = []
}) {
  return {
    id,
    kind: "ReflectionMemory",
    projectId,
    sourceWallHitId,
    lesson,
    avoidNextTime,
    replayPointers,
    createdAt: nowIso()
  };
}

export function createMotherSkillTrajectory({
  id,
  projectId,
  motherSkillId,
  route,
  inputs,
  outputs,
  wallHitIds = [],
  fallbackUsed = false
}) {
  return {
    id,
    kind: "MotherSkillTrajectory",
    projectId,
    motherSkillId,
    route,
    inputs,
    outputs,
    wallHitIds,
    fallbackUsed,
    createdAt: nowIso()
  };
}

export function createReuseContext({
  id,
  projectId,
  query,
  matchedRecordIds = [],
  recommendedRuleIds = [],
  recommendedSkillIds = [],
  recommendedReflectionIds = [],
  recommendedWorkflowIds = [],
  contributionCandidates = [],
  summary
}) {
  return {
    id,
    kind: "ReuseContext",
    projectId,
    query,
    matchedRecordIds,
    recommendedRuleIds,
    recommendedSkillIds,
    recommendedReflectionIds,
    recommendedWorkflowIds,
    contributionCandidates,
    summary,
    createdAt: nowIso()
  };
}

export function createSelfIterationRun({
  id,
  projectId,
  sourceRecordIds = [],
  candidateSkillIds = [],
  acceptedSkillIds = [],
  rejectedSkillIds = [],
  wallHitIds = [],
  artifactIds = [],
  iteration = 1,
  summary
}) {
  return {
    id,
    kind: "SelfIterationRun",
    projectId,
    sourceRecordIds,
    candidateSkillIds,
    acceptedSkillIds,
    rejectedSkillIds,
    wallHitIds,
    artifactIds,
    iteration,
    summary,
    createdAt: nowIso()
  };
}

export function createReviewPacket({
  id,
  projectId,
  targetKind,
  targetId,
  title,
  recommendation,
  why,
  evidence = [],
  risks = [],
  options = [],
  defaultOption,
  status = "pending"
}) {
  return {
    id,
    kind: "ReviewPacket",
    projectId,
    targetKind,
    targetId,
    title,
    recommendation,
    why,
    evidence,
    risks,
    options,
    defaultOption,
    status,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

export function createReviewDecision({
  id,
  projectId,
  reviewPacketId,
  targetKind,
  targetId,
  decision,
  rationale,
  resultingStatus
}) {
  return {
    id,
    kind: "ReviewDecision",
    projectId,
    reviewPacketId,
    targetKind,
    targetId,
    decision,
    rationale,
    resultingStatus,
    createdAt: nowIso()
  };
}

// ============================================================================
// 2.0-C: Experience Asset Trading records
// ============================================================================

export const PRICING_MODELS = Object.freeze(["free", "one_time", "subscription"]);
export const LICENSE_TYPES = Object.freeze(["MIT", "Commercial", "Team"]);
export const LISTING_STATUSES = Object.freeze(["active", "unpublished", "suspended"]);
export const TRANSACTION_TYPES = Object.freeze(["purchase", "subscription", "trial"]);
export const TRANSACTION_STATUSES = Object.freeze(["completed", "refunded", "pending"]);

export function createMarketplaceListing({
  id,
  projectId,
  skillId,
  sellerId = "system",
  version = "1.0.0",
  pricing = { model: "free", price: 0, currency: "CNY" },
  license = "MIT",
  trialEnabled = false,
  status = "active",
  summary = ""
}) {
  return {
    id,
    kind: "MarketplaceListing",
    projectId,
    skillId,
    sellerId,
    version,
    pricing,
    license,
    trialEnabled,
    status,
    summary,
    downloads: 0,
    ratingSum: 0,
    ratingCount: 0,
    revenue: 0,
    publishedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

export function createTransaction({
  id,
  projectId,
  listingId,
  skillId,
  buyerId,
  sellerId,
  type = "purchase",
  amount = 0,
  commission = 0,
  netToSeller = 0,
  licenseKey,
    licenseType = "MIT",
    status = "completed"
  }) {
    return {
      id,
      kind: "Transaction",
      projectId,
      listingId,
      skillId,
      buyerId,
      sellerId,
      type,
      amount,
      commission,
      netToSeller,
      licenseKey,
      licenseType,
      status,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
  }

export function createSkillRating({
  id,
  projectId,
  skillId,
  userId,
  score,
  review = ""
}) {
  return {
    id,
    kind: "SkillRating",
    projectId,
    skillId,
    userId,
    score,
    review,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

/** A voluntary product-level Beta report. Never contains captured collaboration. */
export function createBetaFeedback({ id, participantId, stage, usefulness, clarity, wouldUseAgain, helped = "", blocked = "", contact = null }) {
  return {
    id,
    kind: "BetaFeedback",
    participantId,
    stage,
    usefulness,
    clarity,
    wouldUseAgain,
    helped,
    blocked,
    contact,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}
