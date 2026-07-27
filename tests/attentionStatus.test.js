import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildAttentionSnapshot } from "../src/attentionStatus.js";

describe("buildAttentionSnapshot", () => {
  it("marks human capture permission and blocking walls red", () => {
    const snapshot = buildAttentionSnapshot({
      permits: [{ status: "pending" }],
      drafts: [{ status: "pending_review" }],
      reviewPackets: [],
      wallHits: [{ status: "open", severity: "blocker" }],
      llm: { isLive: true, adapter: "deepseek", model: "deepseek-chat" }
    });
    assert.equal(snapshot.signals.find((item) => item.id === "decisions").level, "red");
    assert.equal(snapshot.signals.find((item) => item.id === "production").level, "red");
    assert.equal(snapshot.signals.find((item) => item.id === "model").level, "green");
    assert.equal(snapshot.actions[0].id, "capture-permits");
  });

  it("keeps a clear system green and a locked model amber", () => {
    const snapshot = buildAttentionSnapshot({
      llm: { isLive: false, mockDraftsAllowed: false },
      permits: [], drafts: [], reviewPackets: [], wallHits: []
    });
    assert.deepEqual(snapshot.signals.map((item) => item.level), ["green", "green", "amber"]);
    assert.deepEqual(snapshot.actions, []);
  });
});
