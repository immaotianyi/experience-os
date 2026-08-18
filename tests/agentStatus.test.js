import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildAgentStatus } from "../src/agentStatus.js";

const now = Date.parse("2026-08-14T10:00:00.000Z");

function platform(level = 3, status = "callable") {
  return {
    status,
    compatibilityLevel: level,
    proof: { hostInstalled: true }
  };
}

function observation(host, eventName, secondsAgo = 10) {
  return {
    host,
    eventName,
    eventCategory: "lifecycle",
    outcome: "unknown",
    observedAt: new Date(now - secondsAgo * 1000).toISOString()
  };
}

describe("buildAgentStatus", () => {
  it("requires callable evidence before claiming an agent is working", () => {
    const result = buildAgentStatus({
      platforms: { codex: platform(2, "configured") },
      observations: [observation("codex", "PreToolUse")],
      now
    });
    assert.equal(result.agents[0].state, "disconnected");
  });

  it("maps a recent callable activity event to working", () => {
    const result = buildAgentStatus({
      platforms: { codex: platform() },
      observations: [observation("codex", "PreToolUse")],
      now
    });
    assert.equal(result.agents[0].state, "working");
    assert.equal(result.summary.working, 1);
  });

  it("keeps a recent permission request human-visible", () => {
    const result = buildAgentStatus({
      platforms: { claude: platform(4, "observing") },
      observations: [observation("claude", "PermissionRequest", 60)],
      now
    });
    assert.equal(result.agents[0].state, "waiting_permission");
    assert.equal(result.summary.waitingPermission, 1);
  });

  it("shows recent completion then expires it to idle", () => {
    const recent = buildAgentStatus({
      platforms: { codex: platform(4, "observing") },
      observations: [observation("codex", "SessionEnd", 60)],
      now
    });
    const expired = buildAgentStatus({
      platforms: { codex: platform(4, "observing") },
      observations: [observation("codex", "SessionEnd", 600)],
      now
    });
    assert.equal(recent.agents[0].state, "completed");
    assert.equal(expired.agents[0].state, "idle");
  });

  it("maps recent failure evidence to blocked", () => {
    const result = buildAgentStatus({
      platforms: { trae: platform(3, "callable") },
      observations: [observation("trae", "StopFailure")],
      now
    });
    assert.equal(result.agents[0].state, "blocked");
    assert.equal(result.summary.blocked, 1);
  });

  it("does not list hosts that are not installed", () => {
    const result = buildAgentStatus({
      platforms: {
        codex: platform(),
        vscode: { ...platform(0, "not_installed"), proof: { hostInstalled: false } }
      },
      now
    });
    assert.deepEqual(result.agents.map((agent) => agent.id), ["codex"]);
  });
});
