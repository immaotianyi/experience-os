import { SKILL_STATUSES, PREFERENCE_STATUSES, REVIEW_PACKET_STATUSES, PRICING_MODELS, LICENSE_TYPES, LISTING_STATUSES, TRANSACTION_TYPES, TRANSACTION_STATUSES, AUTONOMY_MODES, PROJECT_STATUSES, EVIDENCE_TYPES, OUTCOME_STATES, EXPERIENCE_ASSET_STATUSES, EXPERIENCE_RECEIPT_DRAFT_STATUSES, CODE_GRAPH_PATTERN_TYPES } from "./domain.js";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasArray(value) {
  return Array.isArray(value);
}

function hasNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function hasOptionalString(value) {
  return value === null || value === undefined || hasString(value);
}

function isOneOf(value, allowed) {
  return allowed.includes(value);
}

export function validateProject(project) {
  const issues = [];
  if (!isObject(project)) issues.push("project must be an object");
  if (!hasString(project?.id)) issues.push("project.id is required");
  if (!hasString(project?.name)) issues.push("project.name is required");
  if (!hasString(project?.goal)) issues.push("project.goal is required");
  if (!hasArray(project?.constraints)) issues.push("project.constraints must be an array");
  if (!hasArray(project?.acceptanceCriteria)) issues.push("project.acceptanceCriteria must be an array");
  // 3.0 optional fields
  if (project?.status !== undefined && !isOneOf(project.status, PROJECT_STATUSES)) {
    issues.push(`project.status must be one of: ${PROJECT_STATUSES.join(", ")}`);
  }
  if (project?.autonomyMode !== undefined && !isOneOf(project.autonomyMode, AUTONOMY_MODES)) {
    issues.push(`project.autonomyMode must be one of: ${AUTONOMY_MODES.join(", ")}`);
  }
  if (project?.tags !== undefined && !hasArray(project.tags)) {
    issues.push("project.tags must be an array if present");
  }
  if (project?.evidenceLinkIds !== undefined && !hasArray(project.evidenceLinkIds)) {
    issues.push("project.evidenceLinkIds must be an array if present");
  }
  if (project?.experienceReceiptIds !== undefined && !hasArray(project.experienceReceiptIds)) {
    issues.push("project.experienceReceiptIds must be an array if present");
  }
  return issues;
}

export function validateSkillForProduction(skill) {
  const issues = [];
  if (!hasString(skill?.id)) issues.push("skill.id is required");
  if (!hasString(skill?.name)) issues.push("skill.name is required");
  if (!hasString(skill?.origin)) issues.push("skill.origin is required");
  if (!isObject(skill?.trigger)) issues.push("skill.trigger is required");
  if (!hasString(skill?.trigger?.intent)) issues.push("skill.trigger.intent is required");
  if (!hasArray(skill?.trigger?.signals) || skill.trigger.signals.length === 0) {
    issues.push("skill.trigger.signals must contain at least one signal");
  }
  if (!isObject(skill?.inputSchema)) issues.push("skill.inputSchema is required");
  if (!isObject(skill?.outputSchema)) issues.push("skill.outputSchema is required");
  if (!hasString(skill?.safetyLevel)) issues.push("skill.safetyLevel is required");
  if (!hasString(skill?.fallback)) issues.push("skill.fallback is required");
  if (typeof skill?.humanConfirmationRequired !== "boolean") {
    issues.push("skill.humanConfirmationRequired must be boolean");
  }
  if (!["strategic", "functional", "atomic"].includes(skill?.skillLevel)) {
    issues.push("skill.skillLevel must be strategic, functional, or atomic");
  }
  if (!isOneOf(skill?.status, SKILL_STATUSES)) {
    issues.push(`skill.status must be one of: ${SKILL_STATUSES.join(", ")}`);
  }
  if (!hasOptionalString(skill?.promotionGate)) {
    issues.push("skill.promotionGate must be null or string");
  }
  if (!hasOptionalString(skill?.candidateReason)) {
    issues.push("skill.candidateReason must be null or string");
  }
  if (!hasOptionalString(skill?.lastReviewDecisionId)) {
    issues.push("skill.lastReviewDecisionId must be null or string");
  }
  if (!hasOptionalString(skill?.reviewedAt)) {
    issues.push("skill.reviewedAt must be null or string");
  }
  return issues;
}

export function validateHumanEditLog(editLog) {
  const issues = [];
  if (!hasString(editLog?.id)) issues.push("humanEditLog.id is required");
  if (!hasString(editLog?.projectId)) issues.push("humanEditLog.projectId is required");
  if (!hasString(editLog?.before)) issues.push("humanEditLog.before is required");
  if (!hasString(editLog?.after)) issues.push("humanEditLog.after is required");
  if (!hasString(editLog?.editType)) issues.push("humanEditLog.editType is required");
  if (!hasArray(editLog?.capturedSignals)) issues.push("humanEditLog.capturedSignals must be an array");
  return issues;
}

export function validateConversationEvent(event) {
  const issues = [];
  if (!hasString(event?.id)) issues.push("conversationEvent.id is required");
  if (!hasString(event?.projectId)) issues.push("conversationEvent.projectId is required");
  if (!hasString(event?.actor)) issues.push("conversationEvent.actor is required");
  if (!hasString(event?.content)) issues.push("conversationEvent.content is required");
  // Relay provenance fields were introduced after the initial 2.x event
  // records existed. Missing fields mean a legacy local/manual event, while
  // every newly-created event factory supplies explicit values.
  if (event?.sourceTool !== undefined && !hasString(event.sourceTool)) {
    issues.push("conversationEvent.sourceTool must be a non-empty string when present");
  }
  if (event?.consented !== undefined && typeof event.consented !== "boolean") {
    issues.push("conversationEvent.consented must be boolean when present");
  }
  if (event?.capturePermitId !== null && event?.capturePermitId !== undefined && !hasString(event.capturePermitId)) {
    issues.push("conversationEvent.capturePermitId must be a non-empty string when present");
  }
  return issues;
}

export function validateWorkCheckpoint(checkpoint) {
  const issues = [];
  if (!hasString(checkpoint?.id)) issues.push("workCheckpoint.id is required");
  if (!hasString(checkpoint?.projectId)) issues.push("workCheckpoint.projectId is required");
  if (!hasString(checkpoint?.title)) issues.push("workCheckpoint.title is required");
  if (!hasString(checkpoint?.eventId)) issues.push("workCheckpoint.eventId is required");
  if (!hasString(checkpoint?.evidenceLinkId)) issues.push("workCheckpoint.evidenceLinkId is required");
  if (checkpoint?.status !== "captured") issues.push("workCheckpoint.status must be captured");
  if (checkpoint?.capturePermitId !== null && checkpoint?.capturePermitId !== undefined && !hasString(checkpoint.capturePermitId)) {
    issues.push("workCheckpoint.capturePermitId must be a non-empty string when present");
  }
  return issues;
}

export function validateExperienceAsset(asset) {
  const issues = [];
  if (!hasString(asset?.id)) issues.push("experienceAsset.id is required");
  if (!hasString(asset?.projectId)) issues.push("experienceAsset.projectId is required");
  if (!hasString(asset?.receiptId)) issues.push("experienceAsset.receiptId is required");
  if (!hasString(asset?.decisionReceiptId)) issues.push("experienceAsset.decisionReceiptId is required");
  if (!hasString(asset?.outcomeRecordId)) issues.push("experienceAsset.outcomeRecordId is required");
  if (!hasString(asset?.title)) issues.push("experienceAsset.title is required");
  if (!isOneOf(asset?.status, EXPERIENCE_ASSET_STATUSES)) {
    issues.push(`experienceAsset.status must be one of: ${EXPERIENCE_ASSET_STATUSES.join(", ")}`);
  }
  if (!hasOptionalString(asset?.approvedBy)) issues.push("experienceAsset.approvedBy must be null or string");
  return issues;
}

export function validateThoughtFragment(thought) {
  const issues = [];
  if (!hasString(thought?.id)) issues.push("thoughtFragment.id is required");
  if (!hasString(thought?.projectId)) issues.push("thoughtFragment.projectId is required");
  if (!hasString(thought?.sourceEventId)) issues.push("thoughtFragment.sourceEventId is required");
  if (!hasString(thought?.summary)) issues.push("thoughtFragment.summary is required");
  if (!hasArray(thought?.themes)) issues.push("thoughtFragment.themes must be an array");
  if (!hasString(thought?.evidence)) issues.push("thoughtFragment.evidence is required");
  return issues;
}

export function validateRule(rule) {
  const issues = [];
  if (!hasString(rule?.id)) issues.push("rule.id is required");
  if (!hasString(rule?.projectId)) issues.push("rule.projectId is required");
  if (!hasString(rule?.title)) issues.push("rule.title is required");
  if (!hasString(rule?.statement)) issues.push("rule.statement is required");
  if (!hasArray(rule?.sourceThoughtIds)) issues.push("rule.sourceThoughtIds must be an array");
  if (!hasString(rule?.scope)) issues.push("rule.scope is required");
  return issues;
}

export function validateSubgoalSegment(segment) {
  const issues = [];
  if (!hasString(segment?.id)) issues.push("subgoalSegment.id is required");
  if (!hasString(segment?.projectId)) issues.push("subgoalSegment.projectId is required");
  if (!hasArray(segment?.sourceEditLogIds)) issues.push("subgoalSegment.sourceEditLogIds must be an array");
  if (!hasString(segment?.title)) issues.push("subgoalSegment.title is required");
  if (!hasString(segment?.intent)) issues.push("subgoalSegment.intent is required");
  return issues;
}

export function validateWorkflowPattern(pattern) {
  const issues = [];
  if (!hasString(pattern?.id)) issues.push("workflowPattern.id is required");
  if (!hasString(pattern?.projectId)) issues.push("workflowPattern.projectId is required");
  if (!hasArray(pattern?.sourceSubgoalIds)) issues.push("workflowPattern.sourceSubgoalIds must be an array");
  if (!hasString(pattern?.name)) issues.push("workflowPattern.name is required");
  if (!hasString(pattern?.pattern)) issues.push("workflowPattern.pattern is required");
  return issues;
}

export function validateArtifact(artifact) {
  const issues = [];
  if (!hasString(artifact?.id)) issues.push("artifact.id is required");
  if (!hasString(artifact?.projectId)) issues.push("artifact.projectId is required");
  if (!hasString(artifact?.title)) issues.push("artifact.title is required");
  if (!hasString(artifact?.artifactType)) issues.push("artifact.artifactType is required");
  if (!hasString(artifact?.content)) issues.push("artifact.content is required");
  if (!hasArray(artifact?.sourceIds)) issues.push("artifact.sourceIds must be an array");
  return issues;
}

export function validateReflectionMemory(memory) {
  const issues = [];
  if (!hasString(memory?.id)) issues.push("reflectionMemory.id is required");
  if (!hasString(memory?.projectId)) issues.push("reflectionMemory.projectId is required");
  if (!hasString(memory?.sourceWallHitId)) issues.push("reflectionMemory.sourceWallHitId is required");
  if (!hasString(memory?.lesson)) issues.push("reflectionMemory.lesson is required");
  if (!hasArray(memory?.avoidNextTime)) issues.push("reflectionMemory.avoidNextTime must be an array");
  if (!hasArray(memory?.replayPointers)) issues.push("reflectionMemory.replayPointers must be an array");
  return issues;
}

export function validateMotherSkillTrajectory(trajectory) {
  const issues = [];
  if (!hasString(trajectory?.id)) issues.push("motherSkillTrajectory.id is required");
  if (!hasString(trajectory?.projectId)) issues.push("motherSkillTrajectory.projectId is required");
  if (!hasString(trajectory?.motherSkillId)) issues.push("motherSkillTrajectory.motherSkillId is required");
  if (!hasArray(trajectory?.route)) issues.push("motherSkillTrajectory.route must be an array");
  if (!isObject(trajectory?.inputs)) issues.push("motherSkillTrajectory.inputs must be an object");
  if (!isObject(trajectory?.outputs)) issues.push("motherSkillTrajectory.outputs must be an object");
  if (!hasArray(trajectory?.wallHitIds)) issues.push("motherSkillTrajectory.wallHitIds must be an array");
  if (typeof trajectory?.fallbackUsed !== "boolean") {
    issues.push("motherSkillTrajectory.fallbackUsed must be boolean");
  }
  return issues;
}

export function validatePreferenceHypothesis(hypothesis) {
  const issues = [];
  if (!hasString(hypothesis?.id)) issues.push("preferenceHypothesis.id is required");
  if (!hasString(hypothesis?.projectId)) issues.push("preferenceHypothesis.projectId is required");
  if (!hasString(hypothesis?.statement)) issues.push("preferenceHypothesis.statement is required");
  if (!hasArray(hypothesis?.evidenceIds)) issues.push("preferenceHypothesis.evidenceIds must be an array");
  if (!hasNumber(hypothesis?.confidence)) issues.push("preferenceHypothesis.confidence must be a number");
  if (hypothesis?.confidence < 0 || hypothesis?.confidence > 1) {
    issues.push("preferenceHypothesis.confidence must be between 0 and 1");
  }
  if (!isOneOf(hypothesis?.status, PREFERENCE_STATUSES)) {
    issues.push(`preferenceHypothesis.status must be one of: ${PREFERENCE_STATUSES.join(", ")}`);
  }
  if (!hasOptionalString(hypothesis?.lastReviewDecisionId)) {
    issues.push("preferenceHypothesis.lastReviewDecisionId must be null or string");
  }
  if (!hasOptionalString(hypothesis?.reviewedAt)) {
    issues.push("preferenceHypothesis.reviewedAt must be null or string");
  }
  return issues;
}

export function validateWallHit(wallHit) {
  const issues = [];
  if (!hasString(wallHit?.id)) issues.push("wallHit.id is required");
  if (!hasString(wallHit?.projectId)) issues.push("wallHit.projectId is required");
  if (!hasString(wallHit?.wallType)) issues.push("wallHit.wallType is required");
  if (!hasString(wallHit?.stage)) issues.push("wallHit.stage is required");
  if (!hasString(wallHit?.message)) issues.push("wallHit.message is required");
  if (!hasArray(wallHit?.blockedBy)) issues.push("wallHit.blockedBy must be an array");
  if (!hasArray(wallHit?.suggestedFixes)) issues.push("wallHit.suggestedFixes must be an array");
  if (typeof wallHit?.humanDecisionNeeded !== "boolean") {
    issues.push("wallHit.humanDecisionNeeded must be boolean");
  }
  if (wallHit?.status !== undefined && !["open", "resolved", "archived"].includes(wallHit.status)) {
    issues.push("wallHit.status must be open, resolved, or archived");
  }
  if (wallHit?.resolvedByIds !== undefined && !hasArray(wallHit.resolvedByIds)) {
    issues.push("wallHit.resolvedByIds must be an array");
  }
  if (!hasOptionalString(wallHit?.resolvedAt)) {
    issues.push("wallHit.resolvedAt must be null or string");
  }
  return issues;
}

export function validateReviewPacket(packet) {
  const issues = [];
  if (!hasString(packet?.id)) issues.push("reviewPacket.id is required");
  if (!hasString(packet?.projectId)) issues.push("reviewPacket.projectId is required");
  if (!hasString(packet?.targetKind)) issues.push("reviewPacket.targetKind is required");
  if (!hasString(packet?.targetId)) issues.push("reviewPacket.targetId is required");
  if (!hasString(packet?.title)) issues.push("reviewPacket.title is required");
  if (!hasString(packet?.recommendation)) issues.push("reviewPacket.recommendation is required");
  if (!hasString(packet?.why)) issues.push("reviewPacket.why is required");
  if (!hasArray(packet?.evidence)) issues.push("reviewPacket.evidence must be an array");
  if (!hasArray(packet?.risks)) issues.push("reviewPacket.risks must be an array");
  if (!hasArray(packet?.options)) issues.push("reviewPacket.options must be an array");
  if (!hasString(packet?.defaultOption)) issues.push("reviewPacket.defaultOption is required");
  if (hasArray(packet?.options) && hasString(packet?.defaultOption)) {
    const optionIds = packet.options.map((option) => option?.id).filter(Boolean);
    if (!optionIds.includes(packet.defaultOption)) {
      issues.push("reviewPacket.defaultOption must match one of options[].id");
    }
  }
  if (!isOneOf(packet?.status, REVIEW_PACKET_STATUSES)) {
    issues.push(`reviewPacket.status must be one of: ${REVIEW_PACKET_STATUSES.join(", ")}`);
  }
  return issues;
}

export function validateReviewDecision(decision) {
  const issues = [];
  if (!hasString(decision?.id)) issues.push("reviewDecision.id is required");
  if (!hasString(decision?.projectId)) issues.push("reviewDecision.projectId is required");
  if (!hasString(decision?.reviewPacketId)) issues.push("reviewDecision.reviewPacketId is required");
  if (!hasString(decision?.targetKind)) issues.push("reviewDecision.targetKind is required");
  if (!hasString(decision?.targetId)) issues.push("reviewDecision.targetId is required");
  if (!hasString(decision?.decision)) issues.push("reviewDecision.decision is required");
  if (!hasString(decision?.rationale)) issues.push("reviewDecision.rationale is required");
  if (!hasString(decision?.resultingStatus)) issues.push("reviewDecision.resultingStatus is required");
  return issues;
}

export function validateReuseContext(context) {
  const issues = [];
  if (!hasString(context?.id)) issues.push("reuseContext.id is required");
  if (!hasString(context?.projectId)) issues.push("reuseContext.projectId is required");
  if (!hasString(context?.query)) issues.push("reuseContext.query is required");
  if (!hasArray(context?.matchedRecordIds)) issues.push("reuseContext.matchedRecordIds must be an array");
  if (!hasArray(context?.recommendedRuleIds)) issues.push("reuseContext.recommendedRuleIds must be an array");
  if (!hasArray(context?.recommendedSkillIds)) issues.push("reuseContext.recommendedSkillIds must be an array");
  if (!hasArray(context?.recommendedReflectionIds)) issues.push("reuseContext.recommendedReflectionIds must be an array");
  if (!hasArray(context?.recommendedWorkflowIds)) issues.push("reuseContext.recommendedWorkflowIds must be an array");
  if (context?.contributionCandidates !== undefined && !hasArray(context.contributionCandidates)) {
    issues.push("reuseContext.contributionCandidates must be an array");
  }
  if (!hasString(context?.summary)) issues.push("reuseContext.summary is required");
  return issues;
}

export function validateExperienceReuseTrial(trial) {
  const issues = [];
  if (!hasString(trial?.id)) issues.push("experienceReuseTrial.id is required");
  if (!hasString(trial?.projectId)) issues.push("experienceReuseTrial.projectId is required");
  if (!hasString(trial?.assetId)) issues.push("experienceReuseTrial.assetId is required");
  if (!hasString(trial?.sourceProjectId)) issues.push("experienceReuseTrial.sourceProjectId is required");
  if (!hasString(trial?.taskTitle)) issues.push("experienceReuseTrial.taskTitle is required");
  if (trial?.decision !== "adopted") issues.push("experienceReuseTrial.decision must be adopted");
  if (trial?.outcome !== null && trial?.outcome !== undefined && !["success", "partial", "failure"].includes(trial.outcome)) {
    issues.push("experienceReuseTrial.outcome must be success, partial, failure, or null");
  }
  if (trial?.reducedRepeatedDecision !== null && trial?.reducedRepeatedDecision !== undefined && typeof trial.reducedRepeatedDecision !== "boolean") {
    issues.push("experienceReuseTrial.reducedRepeatedDecision must be boolean or null");
  }
  return issues;
}

export function validateBetaFeedback(feedback) {
  const issues = [];
  if (!hasString(feedback?.id)) issues.push("betaFeedback.id is required");
  if (!hasString(feedback?.participantId)) issues.push("betaFeedback.participantId is required");
  if (!isOneOf(feedback?.stage, ["first_impression", "after_trying", "blocked"])) issues.push("betaFeedback.stage is invalid");
  if (!Number.isInteger(feedback?.usefulness) || feedback.usefulness < 1 || feedback.usefulness > 5) issues.push("betaFeedback.usefulness must be 1 through 5");
  if (!Number.isInteger(feedback?.clarity) || feedback.clarity < 1 || feedback.clarity > 5) issues.push("betaFeedback.clarity must be 1 through 5");
  if (!isOneOf(feedback?.wouldUseAgain, ["yes", "no", "unsure"])) issues.push("betaFeedback.wouldUseAgain is invalid");
  if (!hasOptionalString(feedback?.contact)) issues.push("betaFeedback.contact must be null or string");
  return issues;
}

export function validateSelfIterationRun(run) {
  const issues = [];
  if (!hasString(run?.id)) issues.push("selfIterationRun.id is required");
  if (!hasString(run?.projectId)) issues.push("selfIterationRun.projectId is required");
  if (!hasArray(run?.sourceRecordIds)) issues.push("selfIterationRun.sourceRecordIds must be an array");
  if (!hasArray(run?.candidateSkillIds)) issues.push("selfIterationRun.candidateSkillIds must be an array");
  if (!hasArray(run?.acceptedSkillIds)) issues.push("selfIterationRun.acceptedSkillIds must be an array");
  if (run?.rejectedSkillIds !== undefined && !hasArray(run?.rejectedSkillIds)) {
    issues.push("selfIterationRun.rejectedSkillIds must be an array");
  }
  if (!hasArray(run?.wallHitIds)) issues.push("selfIterationRun.wallHitIds must be an array");
  if (!hasArray(run?.artifactIds)) issues.push("selfIterationRun.artifactIds must be an array");
  if (run?.iteration !== undefined && (!hasNumber(run?.iteration) || run.iteration < 1)) {
    issues.push("selfIterationRun.iteration must be a positive number");
  }
  if (!hasString(run?.summary)) issues.push("selfIterationRun.summary is required");
  return issues;
}

export function validateMarketplaceListing(listing) {
  const issues = [];
  if (!hasString(listing?.id)) issues.push("marketplaceListing.id is required");
  if (!hasString(listing?.projectId)) issues.push("marketplaceListing.projectId is required");
  if (!hasString(listing?.skillId)) issues.push("marketplaceListing.skillId is required");
  if (!hasString(listing?.sellerId)) issues.push("marketplaceListing.sellerId is required");
  if (!hasString(listing?.version)) issues.push("marketplaceListing.version is required");
  if (!isObject(listing?.pricing)) issues.push("marketplaceListing.pricing must be an object");
  if (isObject(listing?.pricing)) {
    if (!isOneOf(listing.pricing.model, PRICING_MODELS)) {
      issues.push(`marketplaceListing.pricing.model must be one of: ${PRICING_MODELS.join(", ")}`);
    }
    if (!hasNumber(listing.pricing.price) || listing.pricing.price < 0) {
      issues.push("marketplaceListing.pricing.price must be a non-negative number");
    }
  }
  if (!isOneOf(listing?.license, LICENSE_TYPES)) {
    issues.push(`marketplaceListing.license must be one of: ${LICENSE_TYPES.join(", ")}`);
  }
  if (typeof listing?.trialEnabled !== "boolean") {
    issues.push("marketplaceListing.trialEnabled must be boolean");
  }
  if (!isOneOf(listing?.status, LISTING_STATUSES)) {
    issues.push(`marketplaceListing.status must be one of: ${LISTING_STATUSES.join(", ")}`);
  }
  if (!hasNumber(listing?.downloads) || listing.downloads < 0) {
    issues.push("marketplaceListing.downloads must be a non-negative number");
  }
  return issues;
}

export function validateTransaction(transaction) {
  const issues = [];
  if (!hasString(transaction?.id)) issues.push("transaction.id is required");
  if (!hasString(transaction?.projectId)) issues.push("transaction.projectId is required");
  if (!hasString(transaction?.listingId)) issues.push("transaction.listingId is required");
  if (!hasString(transaction?.skillId)) issues.push("transaction.skillId is required");
  if (!hasString(transaction?.buyerId)) issues.push("transaction.buyerId is required");
  if (!hasString(transaction?.sellerId)) issues.push("transaction.sellerId is required");
  if (!isOneOf(transaction?.type, TRANSACTION_TYPES)) {
    issues.push(`transaction.type must be one of: ${TRANSACTION_TYPES.join(", ")}`);
  }
  if (!hasNumber(transaction?.amount) || transaction.amount < 0) {
    issues.push("transaction.amount must be a non-negative number");
  }
  if (!hasNumber(transaction?.commission) || transaction.commission < 0) {
    issues.push("transaction.commission must be a non-negative number");
  }
  if (!hasNumber(transaction?.netToSeller) || transaction.netToSeller < 0) {
    issues.push("transaction.netToSeller must be a non-negative number");
  }
  if (!isOneOf(transaction?.licenseType, LICENSE_TYPES)) {
    issues.push(`transaction.licenseType must be one of: ${LICENSE_TYPES.join(", ")}`);
  }
  if (!isOneOf(transaction?.status, TRANSACTION_STATUSES)) {
    issues.push(`transaction.status must be one of: ${TRANSACTION_STATUSES.join(", ")}`);
  }
  // Consistency: amount must equal commission + netToSeller (within FP tolerance)
  if (hasNumber(transaction?.amount) && hasNumber(transaction?.commission) && hasNumber(transaction?.netToSeller)) {
    const recomputed = transaction.commission + transaction.netToSeller;
    if (Math.abs(recomputed - transaction.amount) > 0.01) {
      issues.push(`transaction.amount (${transaction.amount}) must equal commission + netToSeller (${recomputed})`);
    }
  }
  // Trial transactions must be free
  if (transaction?.type === "trial" && hasNumber(transaction?.amount) && transaction.amount !== 0) {
    issues.push("transaction.amount must be 0 for trial type");
  }
  // Non-trial transactions must have a license key
  if (transaction?.type !== "trial" && !hasString(transaction?.licenseKey)) {
    issues.push("transaction.licenseKey is required for non-trial transactions");
  }
  // License key format check (EOS-TYPE-HHHH-HHHH-RRRRRRRR) — only for non-trial
  if (transaction?.type !== "trial" && hasString(transaction?.licenseKey)) {
    const keyMatch = transaction.licenseKey.match(/^EOS-([A-Z]+)-([A-Z0-9]{6})-([A-Z0-9]{4})-([A-Z0-9]{8})$/);
    if (!keyMatch) {
      issues.push("transaction.licenseKey has invalid format (expected EOS-TYPE-XXXXXX-XXXX-XXXXXXXX)");
    } else if (!LICENSE_TYPES.map((l) => l.toUpperCase()).includes(keyMatch[1])) {
      issues.push(`transaction.licenseKey has unknown license type: ${keyMatch[1]}`);
    }
  }
  return issues;
}

export function validateSkillRating(rating) {
  const issues = [];
  if (!hasString(rating?.id)) issues.push("skillRating.id is required");
  if (!hasString(rating?.projectId)) issues.push("skillRating.projectId is required");
  if (!hasString(rating?.skillId)) issues.push("skillRating.skillId is required");
  if (!hasString(rating?.userId)) issues.push("skillRating.userId is required");
  if (!hasNumber(rating?.score) || rating.score < 1 || rating.score > 5) {
    issues.push("skillRating.score must be a number between 1 and 5");
  }
  return issues;
}

// 3.0 validators

export function validateEvidenceLink(link) {
  const issues = [];
  if (!hasString(link?.id)) issues.push("evidenceLink.id is required");
  if (!hasString(link?.projectId)) issues.push("evidenceLink.projectId is required");
  if (!isOneOf(link?.type, EVIDENCE_TYPES)) {
    issues.push(`evidenceLink.type must be one of: ${EVIDENCE_TYPES.join(", ")}`);
  }
  if (!hasString(link?.title)) issues.push("evidenceLink.title is required");
  if (!hasString(link?.source)) issues.push("evidenceLink.source is required");
  if (!hasString(link?.capturedAt)) issues.push("evidenceLink.capturedAt is required");
  if (link?.capturePermitId !== null && link?.capturePermitId !== undefined && !hasString(link.capturePermitId)) {
    issues.push("evidenceLink.capturePermitId must be a non-empty string when present");
  }
  if (link?.uncertainty !== null && link?.uncertainty !== undefined) {
    if (!hasNumber(link.uncertainty) || link.uncertainty < 0 || link.uncertainty > 1) {
      issues.push("evidenceLink.uncertainty must be between 0 and 1 (or null)");
    }
  }
  if (link?.counterexamples !== undefined && !hasArray(link.counterexamples)) {
    issues.push("evidenceLink.counterexamples must be an array if present");
  }
  if (link?.applicabilityBounds !== undefined && !hasArray(link.applicabilityBounds)) {
    issues.push("evidenceLink.applicabilityBounds must be an array if present");
  }
  return issues;
}

export function validateExperienceReceipt(receipt) {
  const issues = [];
  if (!hasString(receipt?.id)) issues.push("experienceReceipt.id is required");
  if (!hasString(receipt?.projectId)) issues.push("experienceReceipt.projectId is required");
  if (!hasString(receipt?.phase)) issues.push("experienceReceipt.phase is required");
  if (!hasString(receipt?.summary)) issues.push("experienceReceipt.summary is required");
  if (!hasArray(receipt?.evidenceLinkIds)) issues.push("experienceReceipt.evidenceLinkIds must be an array");
  if (!isOneOf(receipt?.outcome, OUTCOME_STATES)) {
    issues.push(`experienceReceipt.outcome must be one of: ${OUTCOME_STATES.join(", ")}`);
  }
  if (receipt?.uncertainty !== null && receipt?.uncertainty !== undefined) {
    if (!hasNumber(receipt.uncertainty) || receipt.uncertainty < 0 || receipt.uncertainty > 1) {
      issues.push("experienceReceipt.uncertainty must be between 0 and 1 (or null)");
    }
  }
  if (receipt?.autonomyMode !== undefined && !isOneOf(receipt.autonomyMode, AUTONOMY_MODES)) {
    issues.push(`experienceReceipt.autonomyMode must be one of: ${AUTONOMY_MODES.join(", ")}`);
  }
  return issues;
}

export function validateExperienceReceiptDraft(draft) {
  const issues = [];
  if (!hasString(draft?.id)) issues.push("experienceReceiptDraft.id is required");
  if (!hasString(draft?.projectId)) issues.push("experienceReceiptDraft.projectId is required");
  if (!hasArray(draft?.checkpointIds) || draft.checkpointIds.length === 0) issues.push("experienceReceiptDraft.checkpointIds must be a non-empty array");
  if (!hasArray(draft?.evidenceLinkIds) || draft.evidenceLinkIds.length === 0) issues.push("experienceReceiptDraft.evidenceLinkIds must be a non-empty array");
  if (!hasString(draft?.phase)) issues.push("experienceReceiptDraft.phase is required");
  if (!hasString(draft?.summary)) issues.push("experienceReceiptDraft.summary is required");
  if (!isOneOf(draft?.outcome, OUTCOME_STATES)) issues.push(`experienceReceiptDraft.outcome must be one of: ${OUTCOME_STATES.join(", ")}`);
  if (draft?.uncertainty !== null && draft?.uncertainty !== undefined && (!hasNumber(draft.uncertainty) || draft.uncertainty < 0 || draft.uncertainty > 1)) issues.push("experienceReceiptDraft.uncertainty must be between 0 and 1 (or null)");
  if (draft?.generationWarnings !== undefined && !hasArray(draft.generationWarnings)) issues.push("experienceReceiptDraft.generationWarnings must be an array when present");
  if (!isObject(draft?.generatedBy) || !hasString(draft.generatedBy.provider) || !hasString(draft.generatedBy.model)) issues.push("experienceReceiptDraft.generatedBy must contain provider and model");
  if (draft?.generatedBy?.mode !== undefined && !isOneOf(draft.generatedBy.mode, ["live", "rehearsal", "agent_hosted"])) issues.push("experienceReceiptDraft.generatedBy.mode must be live, rehearsal, or agent_hosted");
  if (!isOneOf(draft?.status, EXPERIENCE_RECEIPT_DRAFT_STATUSES)) issues.push(`experienceReceiptDraft.status must be one of: ${EXPERIENCE_RECEIPT_DRAFT_STATUSES.join(", ")}`);
  return issues;
}

export function validateDecisionReceipt(receipt) {
  const issues = [];
  if (!hasString(receipt?.id)) issues.push("decisionReceipt.id is required");
  if (!hasString(receipt?.projectId)) issues.push("decisionReceipt.projectId is required");
  if (!hasString(receipt?.action)) issues.push("decisionReceipt.action is required");
  if (!hasString(receipt?.target)) issues.push("decisionReceipt.target is required");
  if (!hasString(receipt?.rationale)) issues.push("decisionReceipt.rationale is required");
  if (!hasArray(receipt?.evidenceLinkIds)) issues.push("decisionReceipt.evidenceLinkIds must be an array");
  if (!hasOptionalString(receipt?.receiptId)) issues.push("decisionReceipt.receiptId must be null or string");
  if (!isOneOf(receipt?.autonomyMode, AUTONOMY_MODES)) {
    issues.push(`decisionReceipt.autonomyMode must be one of: ${AUTONOMY_MODES.join(", ")}`);
  }
  if (typeof receipt?.humanReviewed !== "boolean") issues.push("decisionReceipt.humanReviewed must be boolean");
  if (typeof receipt?.revertible !== "boolean") issues.push("decisionReceipt.revertible must be boolean");
  return issues;
}

export function validateOutcomeRecord(record) {
  const issues = [];
  if (!hasString(record?.id)) issues.push("outcomeRecord.id is required");
  if (!hasString(record?.projectId)) issues.push("outcomeRecord.projectId is required");
  if (!hasString(record?.action)) issues.push("outcomeRecord.action is required");
  if (!isOneOf(record?.outcome, OUTCOME_STATES)) {
    issues.push(`outcomeRecord.outcome must be one of: ${OUTCOME_STATES.join(", ")}`);
  }
  if (!isObject(record?.metrics)) issues.push("outcomeRecord.metrics must be an object");
  return issues;
}

export function validateCodeGraphPattern(record) {
  const issues = [];
  if (!hasString(record?.id)) issues.push("codeGraphPattern.id is required");
  if (!hasString(record?.projectId)) issues.push("codeGraphPattern.projectId is required");
  if (!hasString(record?.sourceSnapshotId)) issues.push("codeGraphPattern.sourceSnapshotId is required");
  if (!isOneOf(record?.patternType, CODE_GRAPH_PATTERN_TYPES)) {
    issues.push(`codeGraphPattern.patternType must be one of: ${CODE_GRAPH_PATTERN_TYPES.join(", ")}`);
  }
  if (!hasString(record?.label)) issues.push("codeGraphPattern.label is required");
  if (!hasString(record?.description)) issues.push("codeGraphPattern.description is required");
  if (!isObject(record?.metrics)) issues.push("codeGraphPattern.metrics must be an object");
  if (!Array.isArray(record?.applicabilityBounds)) issues.push("codeGraphPattern.applicabilityBounds must be an array");
  if (record?.nodeId !== null && record?.nodeId !== undefined && !hasString(record.nodeId)) {
    issues.push("codeGraphPattern.nodeId must be a non-empty string when present");
  }
  if (!Array.isArray(record?.nodeIds)) issues.push("codeGraphPattern.nodeIds must be an array");
  return issues;
}

export function validateRecord(record) {
  if (!isObject(record)) return ["record must be an object"];
  if (!hasString(record.kind)) return ["record.kind is required"];
  const validators = {
    Artifact: validateArtifact,
    ConversationEvent: validateConversationEvent,
    HumanEditLog: validateHumanEditLog,
    MotherSkillTrajectory: validateMotherSkillTrajectory,
    Project: validateProject,
    ReflectionMemory: validateReflectionMemory,
    Rule: validateRule,
    Skill: validateSkillForProduction,
    SubgoalSegment: validateSubgoalSegment,
    ThoughtFragment: validateThoughtFragment,
    WallHit: validateWallHit,
    WorkflowPattern: validateWorkflowPattern,
    ReviewPacket: validateReviewPacket,
    ReviewDecision: validateReviewDecision,
    ReuseContext: validateReuseContext,
    SelfIterationRun: validateSelfIterationRun,
    PreferenceHypothesis: validatePreferenceHypothesis,
    MarketplaceListing: validateMarketplaceListing,
    Transaction: validateTransaction,
    SkillRating: validateSkillRating,
    EvidenceLink: validateEvidenceLink,
    ExperienceReceipt: validateExperienceReceipt,
    ExperienceReceiptDraft: validateExperienceReceiptDraft,
    DecisionReceipt: validateDecisionReceipt,
    OutcomeRecord: validateOutcomeRecord,
    ExperienceAsset: validateExperienceAsset,
    ExperienceReuseTrial: validateExperienceReuseTrial,
    BetaFeedback: validateBetaFeedback,
    WorkCheckpoint: validateWorkCheckpoint,
    CodeGraphPattern: validateCodeGraphPattern
  };
  const validator = validators[record.kind];
  return validator ? validator(record) : [`unknown record kind: ${record.kind}`];
}

export async function validateVault(vault) {
  const supportedKinds = [
    "Artifact",
    "ConversationEvent",
    "HumanEditLog",
    "MotherSkillTrajectory",
    "Project",
    "ReflectionMemory",
    "Rule",
    "Skill",
    "SubgoalSegment",
    "ThoughtFragment",
    "WallHit",
    "WorkflowPattern",
    "ReviewPacket",
    "ReviewDecision",
    "ReuseContext",
    "SelfIterationRun",
    "PreferenceHypothesis",
    "MarketplaceListing",
    "Transaction",
    "SkillRating",
    "EvidenceLink",
    "ExperienceReceipt",
    "ExperienceReceiptDraft",
    "DecisionReceipt",
    "OutcomeRecord",
    "ExperienceAsset",
    "ExperienceReuseTrial",
    "BetaFeedback",
    "WorkCheckpoint",
    "CodeGraphPattern"
  ];
  const supportedKindSet = new Set(supportedKinds);

  const records = [];
  const corruptFiles = [];
  for (const kind of supportedKinds) {
    const result = await vault.list(kind, { collectSkipped: true });
    records.push(...result.records);
    for (const skip of result.skipped) {
      corruptFiles.push({ kind, ...skip });
    }
  }

  const checked = records.map((record) => ({
    id: record.id,
    kind: record.kind,
    supported: supportedKindSet.has(record.kind),
    issues: validateRecord(record)
  }));
  const supported = checked.filter((item) => item.supported);
  const unsupported = checked.filter((item) => !item.supported);
  const invalid = supported.filter((item) => item.issues.length > 0);
  return {
    checkedCount: checked.length,
    supportedCount: supported.length,
    unsupportedCount: unsupported.length,
    unsupportedKinds: [...new Set(unsupported.map((item) => item.kind))].sort(),
    invalidCount: invalid.length,
    corruptFileCount: corruptFiles.length,
    corruptFiles,
    valid: invalid.length === 0 && corruptFiles.length === 0,
    invalid
  };
}

export function wallTypeForIssue(issue) {
  if (issue.includes("inputSchema") || issue.includes("outputSchema")) return "schema_missing";
  if (issue.includes("trigger")) return "trigger_unstable";
  if (issue.includes("safetyLevel")) return "safety_unclear";
  if (issue.includes("fallback")) return "fallback_missing";
  if (issue.includes("humanConfirmationRequired")) return "human_confirmation_missing";
  if (issue.includes("skillLevel")) return "schema_missing";
  return "schema_missing";
}
