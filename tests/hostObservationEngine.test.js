import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { GitVault } from "../src/gitVault.js";
import { startProject } from "../src/projectEngine.js";
import {
  normalizeHostHookEvent,
  approveHostObservationConsent,
  revokeHostObservationConsent,
  recordHostObservation
} from "../src/hostObservationEngine.js";

let dirs = [];
afterEach(async () => {
  await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })));
  dirs = [];
});

async function fixture() {
  const dir = await mkdtemp(path.join(tmpdir(), "eos-host-observation-"));
  dirs.push(dir);
  const vault = new GitVault(dir);
  await vault.init();
  await startProject(vault, { id: "project.hooks", name: "Hooks", goal: "Verify metadata observation" });
  return vault;
}

describe("normalizeHostHookEvent", () => {
  it("keeps only bounded metadata and hashes opaque ids", () => {
    const normalized = normalizeHostHookEvent("codex", {
      session_id: "session-secret-id",
      turn_id: "turn-secret-id",
      hook_event_name: "PostToolUse",
      permission_mode: "default",
      tool_name: "apply_patch",
      prompt: "private prompt",
      tool_input: { patch: "private source" },
      tool_response: "private output",
      transcript_path: "/private/transcript.jsonl"
    }, { hashSalt: "consent-random" });

    assert.equal(normalized.eventName, "PostToolUse");
    assert.equal(normalized.outcome, "success");
    assert.match(normalized.sessionHash, /^sha256:[a-f0-9]{64}$/);
    const serialized = JSON.stringify(normalized);
    for (const secret of ["session-secret-id", "turn-secret-id", "private prompt", "private source", "private output", "transcript"]) {
      assert.equal(serialized.includes(secret), false);
    }
  });

  it("maps native Cursor payload fields onto the allowlisted shape", () => {
    const normalized = normalizeHostHookEvent("cursor", {
      conversation_id: "cursor-conversation-secret",
      generation_id: "cursor-generation-secret",
      hook_event_name: "PreToolUse",
      tool_name: "terminal",
      command: "npm install",
      cwd: "/private/project",
      model: "some-model"
    }, { hashSalt: "consent-random" });

    assert.equal(normalized.eventName, "PreToolUse");
    assert.equal(normalized.toolName, "terminal");
    assert.match(normalized.sessionHash, /^sha256:[a-f0-9]{64}$/);
    assert.match(normalized.turnHash, /^sha256:[a-f0-9]{64}$/);
    const serialized = JSON.stringify(normalized);
    for (const secret of ["cursor-conversation-secret", "cursor-generation-secret", "npm install", "/private/project", "some-model"]) {
      assert.equal(serialized.includes(secret), false);
    }
  });

  it("prefers native field names over Cursor aliases when both exist", () => {
    const normalized = normalizeHostHookEvent("cursor", {
      session_id: "native-session",
      conversation_id: "alias-session",
      hook_event_name: "SessionStart"
    }, { hashSalt: "salt" });
    assert.notEqual(normalized.sessionHash.includes("alias-session"), true);
  });

  it("fails closed for an unverified hook host", () => {
    assert.throws(
      () => normalizeHostHookEvent("vscode", { session_id: "s", hook_event_name: "SessionStart" }, { hashSalt: "c" }),
      /not verified/
    );
  });
});

describe("host observation consent and persistence", () => {
  it("requires explicit metadata-only acknowledgement", async () => {
    const vault = await fixture();
    await assert.rejects(
      approveHostObservationConsent(vault, {
        projectId: "project.hooks", host: "codex", approvedBy: "human"
      }),
      /explicitly acknowledge/
    );
  });

  it("records an allowlisted observation only while consent is active", async () => {
    const vault = await fixture();
    const consent = await approveHostObservationConsent(vault, {
      projectId: "project.hooks",
      host: "codex",
      approvedBy: "human",
      metadataOnlyAcknowledged: true
    });
    const observation = normalizeHostHookEvent("codex", {
      session_id: "session-1",
      hook_event_name: "SessionStart"
    }, { hashSalt: consent.id });
    const saved = await recordHostObservation(vault, {
      consentId: consent.id,
      captureToken: consent.captureToken,
      observation
    });
    assert.equal(saved.projectId, "project.hooks");
    assert.equal(saved.captureMode, "metadata_only");
    assert.equal((await vault.list("HostObservation")).length, 1);

    const duplicate = await recordHostObservation(vault, {
      consentId: consent.id,
      captureToken: consent.captureToken,
      observation: {
        ...observation,
        eventCategory: "tool",
        outcome: "failure",
        observedAt: "2099-01-01T00:00:00.000Z"
      }
    });
    assert.equal(duplicate.id, saved.id);
    assert.equal(duplicate.eventCategory, "session");
    assert.equal(duplicate.outcome, "unknown");
    assert.notEqual(duplicate.observedAt, "2099-01-01T00:00:00.000Z");
    assert.equal((await vault.list("HostObservation")).length, 1);

    await revokeHostObservationConsent(vault, {
      consentId: consent.id,
      projectId: "project.hooks",
      revokedBy: "human"
    });
    await assert.rejects(
      recordHostObservation(vault, { consentId: consent.id, captureToken: consent.captureToken, observation }),
      /active metadata-only/
    );
  });

  it("rejects a host that does not match the approved consent", async () => {
    const vault = await fixture();
    const consent = await approveHostObservationConsent(vault, {
      projectId: "project.hooks", host: "codex", approvedBy: "human", metadataOnlyAcknowledged: true
    });
    await assert.rejects(recordHostObservation(vault, {
      consentId: consent.id,
      captureToken: consent.captureToken,
      observation: {
        host: "claude",
        eventName: "SessionStart",
        eventCategory: "session",
        sessionHash: `sha256:${"a".repeat(64)}`,
        outcome: "unknown",
        observedAt: new Date().toISOString()
      }
    }), /does not match/);
  });

  it("rejects an event outside the verified hook contract", async () => {
    const vault = await fixture();
    const consent = await approveHostObservationConsent(vault, {
      projectId: "project.hooks", host: "codex", approvedBy: "human", metadataOnlyAcknowledged: true
    });
    await assert.rejects(recordHostObservation(vault, {
      consentId: consent.id,
      captureToken: consent.captureToken,
      observation: {
        host: "codex",
        eventName: "RawTranscriptReady",
        eventCategory: "lifecycle",
        sessionHash: `sha256:${"a".repeat(64)}`
      }
    }), /not verified/);
  });

  it("stores only a capture credential hash and rejects a guessed credential", async () => {
    const vault = await fixture();
    const consent = await approveHostObservationConsent(vault, {
      projectId: "project.hooks", host: "codex", approvedBy: "human", metadataOnlyAcknowledged: true
    });
    const persisted = await vault.load("HostObservationConsent", consent.id);
    assert.match(persisted.captureTokenHash, /^sha256:[a-f0-9]{64}$/);
    assert.equal(JSON.stringify(persisted).includes(consent.captureToken), false);
    await assert.rejects(recordHostObservation(vault, {
      consentId: consent.id,
      captureToken: "host_capture.guessed",
      observation: {
        host: "codex",
        eventName: "SessionStart",
        eventCategory: "session",
        sessionHash: `sha256:${"a".repeat(64)}`
      }
    }), /capture credential/);
  });
});
