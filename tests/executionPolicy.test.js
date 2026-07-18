/**
 * Tests for 3.0 Execution Policy — risk-tiered autonomy guardrails.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  evaluatePolicy,
  assertAllowed,
  actionsForLevel,
  requiresDecisionReceipt,
  ACTION_REGISTRY
} from "../src/executionPolicy.js";

describe("evaluatePolicy", () => {
  it("allows explore actions at explore level", () => {
    const r = evaluatePolicy("read_project", "explore");
    assert.equal(r.allowed, true);
  });

  it("allows execute actions at execute level", () => {
    const r = evaluatePolicy("publish_skill", "execute");
    assert.equal(r.allowed, true);
  });

  it("allows execute actions at commit level (higher than required)", () => {
    const r = evaluatePolicy("publish_skill", "commit");
    assert.equal(r.allowed, true);
  });

  it("refuses execute actions at advise level", () => {
    const r = evaluatePolicy("publish_skill", "advise");
    assert.equal(r.allowed, false);
    assert.ok(r.reason.includes("execute"));
    assert.ok(r.reason.includes("advise"));
  });

  it("refuses commit actions at execute level", () => {
    const r = evaluatePolicy("delete_record", "execute");
    assert.equal(r.allowed, false);
    assert.ok(r.reason.includes("commit"));
  });

  it("refuses unknown actions", () => {
    const r = evaluatePolicy("teleport_to_mars", "commit");
    assert.equal(r.allowed, false);
    assert.equal(r.requiredTier, "unknown");
  });

  it("refuses actions at invalid autonomy mode", () => {
    const r = evaluatePolicy("read_project", "omniscient");
    assert.equal(r.allowed, false);
    assert.ok(r.reason.includes("invalid autonomyMode"));
  });
});

describe("assertAllowed", () => {
  it("returns the policy result when allowed", () => {
    const result = assertAllowed("read_project", "explore");
    assert.equal(result.allowed, true);
  });

  it("throws when not allowed", () => {
    assert.throws(
      () => assertAllowed("publish_skill", "explore"),
      /requires autonomy >= execute/
    );
  });

  it("throws with policyResult attached", () => {
    try {
      assertAllowed("delete_record", "advise");
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(err.policyResult);
      assert.equal(err.policyResult.allowed, false);
      assert.equal(err.policyResult.action, "delete_record");
    }
  });
});

describe("actionsForLevel", () => {
  it("returns only explore actions at explore level", () => {
    const actions = actionsForLevel("explore");
    assert.ok(actions.includes("read_project"));
    assert.ok(actions.includes("search_skills"));
    assert.ok(!actions.includes("publish_skill"));
    assert.ok(!actions.includes("delete_record"));
  });

  it("returns all actions at commit level", () => {
    const actions = actionsForLevel("commit");
    assert.ok(actions.includes("read_project"));
    assert.ok(actions.includes("publish_skill"));
    assert.ok(actions.includes("delete_record"));
  });

  it("returns empty for invalid level", () => {
    assert.deepEqual(actionsForLevel("omniscient"), []);
  });

  it("draft level includes draft but not execute", () => {
    const actions = actionsForLevel("draft");
    assert.ok(actions.includes("draft_skill"));
    assert.ok(!actions.includes("publish_skill"));
  });
});

describe("requiresDecisionReceipt", () => {
  it("requires receipt for execute-tier actions", () => {
    assert.equal(requiresDecisionReceipt("publish_skill"), true);
    assert.equal(requiresDecisionReceipt("save_evidence"), true);
    assert.equal(requiresDecisionReceipt("record_decision"), true);
  });

  it("requires receipt for commit-tier actions", () => {
    assert.equal(requiresDecisionReceipt("delete_record"), true);
    assert.equal(requiresDecisionReceipt("refund_transaction"), true);
  });

  it("does not require receipt for explore/advise/draft actions", () => {
    assert.equal(requiresDecisionReceipt("read_project"), false);
    assert.equal(requiresDecisionReceipt("recommend_approach"), false);
    assert.equal(requiresDecisionReceipt("draft_skill"), false);
  });
});

describe("ACTION_REGISTRY completeness", () => {
  it("every action maps to a valid tier", () => {
    const validTiers = ["explore", "advise", "draft", "execute", "commit"];
    for (const [action, tier] of Object.entries(ACTION_REGISTRY)) {
      assert.ok(validTiers.includes(tier), `action ${action} has invalid tier ${tier}`);
    }
  });
});
