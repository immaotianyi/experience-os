import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { assertLoopbackEndpoint, readConsentTokenFile, runHookBridge } from "../src/eosHookBridge.js";

describe("runHookBridge", () => {
  it("transmits only normalized metadata", async () => {
    let requestBody = null;
    const result = await runHookBridge({
      host: "codex",
      consentId: "host_consent.codex.random",
      captureToken: "host_capture.codex.random",
      input: JSON.stringify({
        session_id: "raw-session",
        hook_event_name: "SessionStart",
        prompt: "private prompt",
        transcript_path: "/private/chat.jsonl"
      }),
      fetchImpl: async (_url, options) => {
        requestBody = options.body;
        return { ok: true, status: 200 };
      }
    });

    assert.equal(result.ok, true);
    assert.equal(JSON.parse(requestBody).observation.eventName, "SessionStart");
    for (const secret of ["raw-session", "private prompt", "/private/chat.jsonl"]) {
      assert.equal(requestBody.includes(secret), false);
    }
  });

  it("injects the registered event name for Cursor payloads", async () => {
    let requestBody = null;
    const result = await runHookBridge({
      host: "cursor",
      consentId: "host_consent.cursor.random",
      captureToken: "host_capture.cursor.random",
      eventName: "PreToolUse",
      input: JSON.stringify({
        conversation_id: "cursor-session",
        generation_id: "gen-1",
        tool_name: "terminal",
        command: "rm -rf /tmp/x"
      }),
      fetchImpl: async (_url, options) => {
        requestBody = options.body;
        return { ok: true, status: 200 };
      }
    });

    assert.equal(result.ok, true);
    assert.equal(result.eventName, "PreToolUse");
    const body = JSON.parse(requestBody);
    assert.equal(body.observation.eventName, "PreToolUse");
    assert.equal(body.observation.toolName, "terminal");
    assert.equal(requestBody.includes("cursor-session"), false);
    assert.equal(requestBody.includes("rm -rf"), false);
  });

  it("never blocks host work when EOS is unavailable", async () => {
    const result = await runHookBridge({
      host: "claude",
      consentId: "host_consent.claude.random",
      captureToken: "host_capture.claude.random",
      input: JSON.stringify({ session_id: "s", hook_event_name: "SessionEnd" }),
      fetchImpl: async () => { throw new Error("connect ECONNREFUSED with private details"); }
    });
    assert.equal(result.ok, false);
    assert.equal(result.exitCode, 0);
    assert.equal(result.error, "EOS is unavailable; metadata observation was skipped");
  });

  it("refuses to transmit metadata to a non-loopback endpoint", async () => {
    let called = false;
    const result = await runHookBridge({
      host: "codex",
      consentId: "host_consent.codex.random",
      captureToken: "host_capture.codex.random",
      endpoint: "https://example.com",
      input: JSON.stringify({ session_id: "s", hook_event_name: "SessionStart" }),
      fetchImpl: async () => { called = true; return { ok: true }; }
    });
    assert.equal(result.ok, false);
    assert.equal(result.exitCode, 0);
    assert.equal(called, false);
    assert.equal(result.error, "EOS Hook endpoint must use local HTTP loopback");
    assert.equal(assertLoopbackEndpoint("http://localhost:4173/"), "http://localhost:4173");
  });

  it("reads a bounded local consent token file", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "eos-hook-token-"));
    try {
      const tokenPath = path.join(dir, "codex.token");
      await writeFile(tokenPath, JSON.stringify({
        consentId: "host_consent.codex.random",
        captureToken: "host_capture.codex.random"
      }), { encoding: "utf8", mode: 0o600 });
      assert.deepEqual(await readConsentTokenFile(tokenPath), {
        consentId: "host_consent.codex.random",
        captureToken: "host_capture.codex.random"
      });
      await writeFile(tokenPath, "not-a-consent\n", "utf8");
      await assert.rejects(readConsentTokenFile(tokenPath), /invalid/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
