import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  buildHostHookPlan,
  CURSOR_HOOK_EVENT_MAP,
  CURSOR_STATUS_EVENTS,
  STATUS_EVENTS
} from "../src/hostHookPlan.js";

describe("buildHostHookPlan", () => {
  for (const host of ["codex", "claude"]) {
    it(`builds a metadata-only ${host} review plan without writing config`, () => {
      const plan = buildHostHookPlan({
        host,
        workspaceDir: "/tmp/work space",
        consentId: `host_consent.${host}.random`
      });
      const serialized = JSON.stringify(plan);

      assert.equal(plan.status, "review_required");
      assert.equal(plan.canApply, false);
      assert.equal(plan.writesConfig, false);
      assert.deepEqual(plan.events, STATUS_EVENTS);
      assert.equal(plan.targetPath, path.join("/tmp/work space", host === "codex" ? ".codex/hooks.json" : ".claude/settings.json"));
      assert.equal(serialized.includes(`host_consent.${host}.random`), false);
      assert.equal(serialized.includes("--consent-file"), true);
      assert.equal(plan.consentFilePath.startsWith(path.join("/tmp", "work space")), false);
      for (const forbidden of ["prompt", "response", "tool_input", "tool_output", "transcript_path", "cwd"]) {
        if (plan.capture.excludes.includes(forbidden)) continue;
        assert.equal(serialized.includes(forbidden), false);
      }
    });
  }

  it("builds a native flat Cursor hooks.json fragment with per-event commands", () => {
    const plan = buildHostHookPlan({
      host: "cursor",
      workspaceDir: "/tmp/work space",
      consentId: "host_consent.cursor.random"
    });
    const serialized = JSON.stringify(plan);

    assert.equal(plan.status, "review_required");
    assert.equal(plan.canApply, false);
    assert.equal(plan.writesConfig, false);
    assert.deepEqual(plan.events, CURSOR_STATUS_EVENTS);
    assert.equal(plan.events.includes("PermissionRequest"), false);
    assert.equal(plan.targetPath, path.join("/tmp/work space", ".cursor", "hooks.json"));
    assert.equal(serialized.includes("host_consent.cursor.random"), false);
    assert.equal(plan.configFragment.version, 1);
    assert.deepEqual(Object.keys(plan.configFragment.hooks).sort(),
      [...new Set(CURSOR_STATUS_EVENTS.map((name) => CURSOR_HOOK_EVENT_MAP[name]))].sort());
    for (const eosEvent of CURSOR_STATUS_EVENTS) {
      const entries = plan.configFragment.hooks[CURSOR_HOOK_EVENT_MAP[eosEvent]];
      assert.equal(entries.length, 1);
      assert.equal(entries[0].timeout, 2);
      assert.equal(entries[0].command.includes("--event"), true);
      assert.equal(entries[0].command.includes(`'${eosEvent}'`), true);
      assert.equal(entries[0].command.includes("eosHookBridge.js"), true);
      assert.equal(entries[0].command.includes("--host"), true);
      assert.equal("hooks" in entries[0], false);
    }
  });

  it("fails closed for TRAE while its hook contract is unverified", () => {
    const plan = buildHostHookPlan({ host: "trae", workspaceDir: "/tmp/project" });
    assert.equal(plan.status, "blocked_unverified_contract");
    assert.equal(plan.canApply, false);
    assert.equal("configFragment" in plan, false);
  });

  it("rejects a remote EOS endpoint", () => {
    assert.throws(() => buildHostHookPlan({
      host: "codex",
      workspaceDir: "/tmp/project",
      consentId: "host_consent.codex.random",
      endpoint: "https://collector.example"
    }), /local HTTP loopback/);
  });
});
