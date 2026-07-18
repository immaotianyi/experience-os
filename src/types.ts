/**
 * TypeScript type definitions for Experience OS domain model.
 *
 * This file defines all 17 record types as TypeScript interfaces,
 * mirroring the factory functions in domain.js. It serves as the
 * single source of truth for the domain model's shape.
 *
 * Migration strategy:
 * - Phase 1 (current): types.ts provides type definitions, JSDoc in JS files references them
 * - Phase 2: domain.js → domain.ts with Zod schemas
 * - Phase 3: vault.js, pipeline.js → .ts
 * - Phase 4: webServer.js, app.js → .ts
 */

// ============================================================================
// Enums & Constants
// ============================================================================

export const STATES = {
  IDLE: "IDLE",
  PLANNING: "PLANNING",
  PRODUCTION_DRAFTING: "PRODUCTION_DRAFTING",
  PRODUCTION_VALIDATING: "PRODUCTION_VALIDATING",
  DEPLOYED: "DEPLOYED",
  MONITORING: "MONITORING",
  REFLECTION: "REFLECTION",
  REVISION: "REVISION",
  DORMANT: "DORMANT",
  ARCHIVED: "ARCHIVED",
  RETIRED: "RETIRED"
} as const;

export type ProjectState = typeof STATES[keyof typeof STATES];

export const WALL_TYPES = {
  SCHEMA_MISSING: "schema_missing",
  TRIGGER_UNSTABLE: "trigger_unstable",
  FALLBACK_MISSING: "fallback_missing",
  HUMAN_CONFIRMATION_GAP: "human_confirmation_gap",
  OUTPUT_INCONSISTENT: "output_inconsistent",
  STALE_REVISION: "stale_revision"
} as const;

export type WallType = typeof WALL_TYPES[keyof typeof WALL_TYPES];

export const SKILL_LEVELS = {
  STRATEGIC: "strategic",
  FUNCTIONAL: "functional"
} as const;

export type SkillLevel = typeof SKILL_LEVELS[keyof typeof SKILL_LEVELS];

export const SKILL_STATUSES = [
  "candidate",
  "candidate_confirmed",
  "stable",
  "rejected",
  "needs_revision",
  "promoted"
] as const;

export type SkillStatus = typeof SKILL_STATUSES[number];

export const PREFERENCE_STATUSES = [
  "hypothesis",
  "confirmed",
  "rejected",
  "needs_more_evidence"
] as const;

export type PreferenceStatus = typeof PREFERENCE_STATUSES[number];

export const REVIEW_PACKET_STATUSES = ["pending", "decided"] as const;

export type ReviewPacketStatus = typeof REVIEW_PACKET_STATUSES[number];

// ============================================================================
// Base Record
// ============================================================================

export interface BaseRecord {
  kind: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 17 Record Types
// ============================================================================

export interface Project extends BaseRecord {
  kind: "Project";
  name: string;
  goal: string;
  constraints: string[];
  acceptanceCriteria: string[];
  state: ProjectState;
  /** 3.0 lifecycle status */
  status?: "planning" | "active" | "paused" | "completed" | "archived";
  ownerId?: string | null;
  autonomyMode?: "explore" | "advise" | "draft" | "execute" | "commit";
  tags?: string[];
  evidenceLinkIds?: string[];
  experienceReceiptIds?: string[];
  metricsSummary?: Record<string, number> | null;
}

// 3.0 record types

export interface EvidenceLink extends BaseRecord {
  kind: "EvidenceLink";
  projectId: string;
  type: "doc" | "code" | "data" | "test" | "feedback" | "reference" | "observation";
  title: string;
  source: string;
  hash?: string | null;
  capturedAt: string;
  notes?: string;
  uncertainty?: number | null;
  counterexamples?: string[];
  applicabilityBounds?: string[];
  tags?: string[];
  origin?: "human" | "relay" | "ai";
  actor?: string;
}

export interface ExperienceReceiptDraft extends BaseRecord {
  kind: "ExperienceReceiptDraft";
  projectId: string;
  checkpointIds: string[];
  evidenceLinkIds: string[];
  phase: string;
  summary: string;
  outcome: "success" | "partial" | "failure" | "unknown";
  uncertainty: number | null;
  counterexamples: string[];
  applicabilityBounds: string[];
  lessonsLearned: string[];
  generatedBy: { provider: string; model: string; usage?: { promptTokens: number; completionTokens: number } };
  status: "pending_review" | "accepted" | "rejected";
}

export interface ExperienceReceipt extends BaseRecord {
  kind: "ExperienceReceipt";
  projectId: string;
  phase: string;
  summary: string;
  evidenceLinkIds: string[];
  outcome: "success" | "partial" | "failure" | "unknown";
  uncertainty?: number | null;
  counterexamples?: string[];
  applicabilityBounds?: string[];
  lessonsLearned?: string[];
  autonomyMode?: "explore" | "advise" | "draft" | "execute" | "commit";
  origin?: "human" | "relay" | "ai";
  actor?: string;
  sourceDraftId?: string | null;
}

export interface DecisionReceipt extends BaseRecord {
  kind: "DecisionReceipt";
  projectId: string;
  action: string;
  target: string;
  rationale: string;
  evidenceLinkIds: string[];
  receiptId?: string | null;
  autonomyMode: "explore" | "advise" | "draft" | "execute" | "commit";
  humanReviewed: boolean;
  reviewedBy?: string | null;
  revertible: boolean;
  revertInstructions?: string | null;
  origin?: "human" | "relay" | "ai";
  actor?: string;
}

export interface OutcomeRecord extends BaseRecord {
  kind: "OutcomeRecord";
  projectId: string;
  decisionReceiptId?: string | null;
  action: string;
  outcome: "success" | "partial" | "failure" | "unknown";
  metrics: Record<string, number>;
  notes?: string;
  evidenceLinkIds?: string[];
  origin?: "human" | "relay" | "ai";
  actor?: string;
}

export interface ConversationEvent extends BaseRecord {
  kind: "ConversationEvent";
  projectId: string;
  actor: string;
  content: string;
  sourceTool: string;
  sourceRef?: string | null;
  consented: boolean;
}

export interface ExperienceAsset extends BaseRecord {
  kind: "ExperienceAsset";
  projectId: string;
  receiptId: string;
  decisionReceiptId: string;
  outcomeRecordId: string;
  title: string;
  status: "candidate" | "approved" | "rejected";
  approvedBy?: string | null;
}

export interface WorkCheckpoint extends BaseRecord {
  kind: "WorkCheckpoint";
  projectId: string;
  title: string;
  eventId: string;
  evidenceLinkId: string;
  notes: string;
  status: "captured";
}

export interface ThoughtFragment extends BaseRecord {
  kind: "ThoughtFragment";
  projectId: string;
  sourceEventId: string;
  summary: string;
  themes: string[];
  evidence: string;
}

export interface Rule extends BaseRecord {
  kind: "Rule";
  projectId: string;
  sourceThoughtIds: string[];
  statement: string;
  scope: string;
  enforcement: "advisory" | "blocking";
}

export interface Skill extends BaseRecord {
  kind: "Skill";
  projectId: string;
  name: string;
  origin: string;
  skillLevel: SkillLevel;
  status: SkillStatus;
  trigger: {
    intent: string;
    signals: string[];
  };
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  safetyLevel: string;
  fallback: string;
  humanConfirmationRequired: boolean;
  promotionGate: string | null;
  lastReviewDecisionId: string | null;
  reviewedAt: string | null;
  confidence?: number;
}

export interface WallHit extends BaseRecord {
  kind: "WallHit";
  projectId: string;
  wallType: WallType;
  stage: string;
  message: string;
  blockedBy: string[];
  suggestedFixes: string[];
  status: "open" | "resolved";
  resolvedByIds: string[];
  resolvedAt: string | null;
  humanDecisionNeeded: boolean;
  /** 3.0 readable WallHit fields */
  impact?: string | null;
  evidenceLinkIds?: string[];
  options?: string[];
  acceptanceCriteria?: string[];
  replaySteps?: string[];
  severity?: "low" | "medium" | "high" | "blocker" | null;
}

export interface Artifact extends BaseRecord {
  kind: "Artifact";
  projectId: string;
  sourceIds: string[];
  title: string;
  artifactType: string;
  content: string;
}

export interface HumanEditLog extends BaseRecord {
  kind: "HumanEditLog";
  projectId: string;
  sourceEventId: string;
  before: string;
  after: string;
  editType: string;
  rationale: string;
  capturedSignals: string[];
}

export interface SubgoalSegment extends BaseRecord {
  kind: "SubgoalSegment";
  projectId: string;
  sourceEditLogIds: string[];
  title: string;
  intent: string;
  inputs: string[];
  outputs: string[];
}

export interface WorkflowPattern extends BaseRecord {
  kind: "WorkflowPattern";
  projectId: string;
  sourceSubgoalIds: string[];
  name: string;
  pattern: string;
  recurrenceEvidence: string[];
  candidateSkillIds: string[];
}

export interface PreferenceHypothesis extends BaseRecord {
  kind: "PreferenceHypothesis";
  projectId: string;
  statement: string;
  evidenceIds: string[];
  confidence: number;
  status: PreferenceStatus;
}

export interface ReflectionMemory extends BaseRecord {
  kind: "ReflectionMemory";
  projectId: string;
  sourceWallHitId: string;
  lesson: string;
  avoidNextTime: string[];
  replayPointers: string[];
}

export interface MotherSkillTrajectory extends BaseRecord {
  kind: "MotherSkillTrajectory";
  projectId: string;
  motherSkillId: string;
  route: string[];
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  wallHitIds: string[];
  fallbackUsed: boolean;
}

export interface ReuseContext extends BaseRecord {
  kind: "ReuseContext";
  projectId: string;
  query: string;
  summary: string;
  matchedRecordIds: string[];
  recommendedSkills: string[];
  recommendedReflections: string[];
  recommendedWorkflows: string[];
  relatedPreferenceIds: string[];
  relatedThoughtIds: string[];
  contributionCandidates: Array<{
    skillId: string;
    relevanceScore: number;
    suggestedModification: string;
  }>;
}

export interface SelfIterationRun extends BaseRecord {
  kind: "SelfIterationRun";
  projectId: string;
  sourceRecordIds: string[];
  candidateSkillIds: string[];
  acceptedSkillIds: string[];
  rejectedSkillIds: string[];
  wallHitIds: string[];
  artifactIds: string[];
  iteration: number;
  summary: string;
}

export interface ReviewPacketOption {
  id: string;
  label: string;
  description?: string;
  resultingStatus?: string;
}

export interface ReviewPacket extends BaseRecord {
  kind: "ReviewPacket";
  projectId: string;
  targetKind: string;
  targetId: string;
  title: string;
  recommendation: string;
  why: string;
  evidence: string[];
  risks: string[];
  options: ReviewPacketOption[];
  defaultOption: string;
  status: ReviewPacketStatus;
  decidedAt: string | null;
  decisionId: string | null;
}

export interface ReviewDecision extends BaseRecord {
  kind: "ReviewDecision";
  projectId: string;
  reviewPacketId: string;
  targetKind: string;
  targetId: string;
  decision: string;
  rationale: string;
  resultingStatus: string;
}

// ============================================================================
// 2.0-C: Experience Asset Trading
// ============================================================================

export const PRICING_MODELS = ["free", "one_time", "subscription"] as const;
export const LICENSE_TYPES = ["MIT", "Commercial", "Team"] as const;
export const LISTING_STATUSES = ["active", "unpublished", "suspended"] as const;
export const TRANSACTION_TYPES = ["purchase", "subscription", "trial"] as const;
export const TRANSACTION_STATUSES = ["completed", "refunded", "pending"] as const;

export type PricingModel = typeof PRICING_MODELS[number];
export type LicenseType = typeof LICENSE_TYPES[number];
export type ListingStatus = typeof LISTING_STATUSES[number];
export type TransactionType = typeof TRANSACTION_TYPES[number];
export type TransactionStatus = typeof TRANSACTION_STATUSES[number];

export interface Pricing {
  model: PricingModel;
  price: number;
  currency: string;
  subscriptionPrice?: number;
}

export interface MarketplaceListing extends BaseRecord {
  kind: "MarketplaceListing";
  projectId: string;
  skillId: string;
  sellerId: string;
  version: string;
  pricing: Pricing;
  license: LicenseType;
  trialEnabled: boolean;
  status: ListingStatus;
  summary: string;
  downloads: number;
  ratingSum: number;
  ratingCount: number;
  revenue: number;
  publishedAt: string;
}

export interface Transaction extends BaseRecord {
  kind: "Transaction";
  projectId: string;
  listingId: string;
  skillId: string;
  buyerId: string;
  sellerId: string;
  type: TransactionType;
  amount: number;
  commission: number;
  netToSeller: number;
  licenseKey: string;
  licenseType: LicenseType;
  status: TransactionStatus;
}

export interface SkillRating extends BaseRecord {
  kind: "SkillRating";
  projectId: string;
  skillId: string;
  userId: string;
  score: number;
  review: string;
}

// ============================================================================
// Union Type
// ============================================================================

export type AnyRecord =
  | Project
  | ConversationEvent
  | ThoughtFragment
  | Rule
  | Skill
  | WallHit
  | Artifact
  | HumanEditLog
  | SubgoalSegment
  | WorkflowPattern
  | PreferenceHypothesis
  | ReflectionMemory
  | MotherSkillTrajectory
  | ReuseContext
  | SelfIterationRun
  | ReviewPacket
  | ReviewDecision
  | MarketplaceListing
  | Transaction
  | SkillRating
  | EvidenceLink
  | ExperienceReceipt
  | ExperienceReceiptDraft
  | DecisionReceipt
  | OutcomeRecord
  | ExperienceAsset
  | WorkCheckpoint;

// ============================================================================
// LLM Adapter Types
// ============================================================================

export interface LLMRequest {
  prompt: string;
  system?: string;
  context?: Array<{ role: string; content: string }>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
  model: string;
  timestamp: string;
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  calls: number;
}

// ============================================================================
// Vault Types
// ============================================================================

export interface VaultSearchOptions {
  query?: string;
  kinds?: string[];
  limit?: number;
  sortKey?: "createdAt" | "updatedAt";
}

export interface VaultListOptions {
  collectSkipped?: boolean;
}

export interface VaultSearchResult {
  record: AnyRecord;
  kind: string;
  score: number;
  snippet: string;
}

export interface VaultSkippedFile {
  file: string;
  error: string;
}

// ============================================================================
// Git Vault Types
// ============================================================================

export interface GitCommitInfo {
  hash: string;
  date: string;
  message: string;
  author: string;
}

export interface GitVaultStats {
  enabled: boolean;
  totalCommits: number;
  lastCommit: string | null;
  dirty: boolean;
}
