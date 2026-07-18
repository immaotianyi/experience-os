/**
 * 3.0 Execution Policy — risk-tiered autonomy guardrails.
 *
 * Automation is not "more is better". Every action is classified by risk,
 * and each autonomy level unlocks a specific tier of actions.
 *
 *   explore  → read-only research, no side effects
 *   advise   → produces recommendations, human decides
 *   draft    → produces artifacts for human review/edit
 *   execute  → performs actions, human can observe and revert
 *   commit   → persists changes without further confirmation
 *
 * The guardrail: an action requested at autonomy level X is only allowed
 * if the action's required level <= X. Otherwise the policy refuses and
 * returns a structured refusal explaining what level is needed.
 *
 * This module is deliberately side-effect-free: it only evaluates policy.
 * The caller (projectEngine / webServer) is responsible for actually
 * performing the action and recording the DecisionReceipt.
 */

import { AUTONOMY_MODES } from "./domain.js";

// Risk tier for each action category.
// An action at tier T requires autonomy >= T.
const ACTION_TIERS = Object.freeze({
  explore: 0,    // read, search, list
  advise: 1,     // recommend, summarize
  draft: 2,      // write draft artifacts (not persisted to vault)
  execute: 3,    // write to vault, call external APIs (revertible)
  commit: 4      // persist without confirmation (irreversible or high-cost)
});

// Map autonomy mode → numeric level
const MODE_LEVEL = Object.freeze({
  explore: 0,
  advise: 1,
  draft: 2,
  execute: 3,
  commit: 4
});

/**
 * Known actions and their required tiers.
 * This is the canonical registry — extend it as new actions are added.
 */
export const ACTION_REGISTRY = Object.freeze({
  // explore tier (0)
  read_project: "explore",
  search_skills: "explore",
  list_evidence: "explore",
  build_timeline: "explore",
  read_vault: "explore",

  // advise tier (1)
  recommend_approach: "advise",
  summarize_phase: "advise",
  suggest_reuse: "advise",

  // draft tier (2)
  draft_skill: "draft",
  draft_receipt: "draft",
  draft_document: "draft",

  // execute tier (3)
  save_evidence: "execute",
  write_receipt: "execute",
  publish_skill: "execute",
  process_purchase: "execute",
  record_decision: "execute",
  record_outcome: "execute",
  capture_event: "execute",
  capture_checkpoint: "execute",
  update_project: "execute",
  resolve_wallhit: "execute",
  promote_asset: "execute",
  reuse_feedback: "execute",

  // commit tier (4)
  delete_record: "commit",
  unpublish_skill: "commit",
  refund_transaction: "commit",
  archive_vault: "commit"
});

/**
 * Evaluate whether an action is permitted at a given autonomy level.
 *
 * @returns {{ allowed: boolean, action: string, requiredTier: string, currentTier: string, reason?: string }}
 */
export function evaluatePolicy(action, autonomyMode) {
  const requiredTier = ACTION_REGISTRY[action];
  if (!requiredTier) {
    return {
      allowed: false,
      action,
      requiredTier: "unknown",
      currentTier: autonomyMode,
      reason: `unknown action: ${action} — register it in ACTION_REGISTRY first`
    };
  }

  const requiredLevel = ACTION_TIERS[requiredTier];
  const currentLevel = MODE_LEVEL[autonomyMode];

  if (currentLevel === undefined) {
    return {
      allowed: false,
      action,
      requiredTier,
      currentTier: autonomyMode,
      reason: `invalid autonomyMode: ${autonomyMode}`
    };
  }

  if (currentLevel >= requiredLevel) {
    return { allowed: true, action, requiredTier, currentTier: autonomyMode };
  }

  return {
    allowed: false,
    action,
    requiredTier,
    currentTier: autonomyMode,
    reason: `action "${action}" requires autonomy >= ${requiredTier}, but current mode is ${autonomyMode}`
  };
}

/**
 * Assert that an action is permitted, throwing a structured error if not.
 * Useful for guarding business logic:
 *
 *   const decision = assertAllowed("publish_skill", project.autonomyMode);
 *   // only reaches here if allowed
 */
export function assertAllowed(action, autonomyMode) {
  const result = evaluatePolicy(action, autonomyMode);
  if (!result.allowed) {
    const err = new Error(result.reason);
    err.policyResult = result;
    throw err;
  }
  return result;
}

/**
 * List all actions available at a given autonomy level.
 * Useful for UIs that want to show what the user can do.
 */
export function actionsForLevel(autonomyMode) {
  const level = MODE_LEVEL[autonomyMode];
  if (level === undefined) return [];
  return Object.entries(ACTION_REGISTRY)
    .filter(([, tier]) => ACTION_TIERS[tier] <= level)
    .map(([action]) => action);
}

/**
 * Check whether a DecisionReceipt is required for an action.
 * Decisions at execute or commit tier must be recorded as DecisionReceipts.
 */
export function requiresDecisionReceipt(action) {
  const tier = ACTION_REGISTRY[action];
  if (!tier) return false;
  return ACTION_TIERS[tier] >= ACTION_TIERS.execute;
}
