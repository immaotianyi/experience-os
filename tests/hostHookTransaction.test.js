import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  buildHostHookPlan,
  CURSOR_HOOK_EVENT_MAP,
  CURSOR_STATUS_EVENTS,
  HOST_OBSERVATION_CONFIRMATION_SCOPE,
  STATUS_EVENTS
} from "../src/hostHookPlan.js";
import {
  applyHostHookPlan,
  buildHostHookInstallPlan,
  buildHostHookRemovalPlan,
  inspectHostHookInstallation
} from "../src/hostHookTransaction.js";

let workspace;
let auditDir;
let secretRoot;
let testRoot;

beforeEach(async () => {
  testRoot = await mkdtemp(path.join(tmpdir(), "eos-hook-transaction-"));
  workspace = path.join(testRoot, "workspace");
  secretRoot = path.join(testRoot, "secrets");
  await mkdir(workspace, { recursive: true });
  auditDir = path.join(workspace, ".eos", "audit");
});

afterEach(async () => rm(testRoot, { recursive: true, force: true }));

function spec(host = "codex", consentId = `host_consent.${host}.secret`) {
  return buildHostHookPlan({ host, workspaceDir: workspace, consentId, endpoint: "http://127.0.0.1:4173", secretRoot });
}

const digest = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;

async function apply(plan, verify) {
  return applyHostHookPlan(plan, {
    approved: true,
    confirmedScope: HOST_OBSERVATION_CONFIRMATION_SCOPE,
    verify
  });
}

describe("Host Hook transaction", () => {
  for (const host of ["codex", "claude"]) {
    it(`preserves unrelated ${host} settings and installs the reviewed operational status hooks`, async () => {
      const consentId = `host_consent.${host}.secret`;
      const captureToken = `host_capture.${host}.secret`;
      const hookSpec = spec(host, consentId);
      await mkdir(path.dirname(hookSpec.targetPath), { recursive: true });
      await writeFile(hookSpec.targetPath, JSON.stringify({
        theme: "dark",
        hooks: {
          SessionStart: [{ matcher: "resume", hooks: [{ type: "command", command: "other-start" }] }],
          PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "policy-check" }] }]
        }
      }, null, 2) + "\n");

      const plan = await buildHostHookInstallPlan(hookSpec, { workspaceDir: workspace, consentId, captureToken, auditDir });
      assert.equal(JSON.stringify(plan.diffPreview).includes("host_consent"), false);
      const receipt = await apply(plan);
      const config = JSON.parse(await readFile(hookSpec.targetPath, "utf8"));
      assert.equal(receipt.status, "installed_pending_host_confirmation");
      assert.equal(config.theme, "dark");
      assert.equal(config.hooks.PreToolUse[0].hooks[0].command, "policy-check");
      assert.equal(config.hooks.PreToolUse.length, 2);
      assert.equal(config.hooks.SessionStart.length, 2);
      assert.equal(config.hooks.SessionEnd.length, 1);
      assert.equal(JSON.stringify(receipt).includes("host_consent"), false);
      assert.equal(JSON.stringify(receipt).includes(captureToken), false);
      assert.ok(receipt.backupPath);
      assert.equal(receipt.backupPath.startsWith(workspace), false);
      assert.deepEqual(JSON.parse(await readFile(hookSpec.consentFilePath, "utf8")), { consentId, captureToken });
      assert.equal((await stat(hookSpec.consentFilePath)).mode & 0o777, 0o600);
      assert.equal((await readFile(hookSpec.targetPath, "utf8")).includes(consentId), false);
      assert.equal((await readFile(hookSpec.targetPath, "utf8")).includes(captureToken), false);
      const inspection = await inspectHostHookInstallation({
        host,
        workspaceDir: workspace,
        configPath: hookSpec.targetPath,
        secretRoot,
        tokenPath: hookSpec.consentFilePath,
        expectedConsentId: consentId,
        expectedCaptureTokenHash: digest(captureToken)
      });
      assert.equal(inspection.configured, true);
      assert.equal(inspection.tokenReady, true);
      assert.deepEqual([...inspection.eventNames].sort(), [...STATUS_EVENTS].sort());
      assert.equal(inspection.handlerCount, STATUS_EVENTS.length);
      assert.equal(inspection.error, null);
    });
  }

  it("installs flat Cursor hooks, preserves unrelated entries, and removes them targeted", async () => {
    const consentId = "host_consent.cursor.secret";
    const captureToken = "host_capture.cursor.secret";
    const hookSpec = spec("cursor", consentId);
    await mkdir(path.dirname(hookSpec.targetPath), { recursive: true });
    await writeFile(hookSpec.targetPath, JSON.stringify({
      version: 1,
      hooks: {
        preToolUse: [{ command: "format-on-edit", matcher: ".*" }],
        sessionStart: [{ command: "echo hi" }]
      }
    }, null, 2) + "\n");

    const plan = await buildHostHookInstallPlan(hookSpec, { workspaceDir: workspace, consentId, captureToken, auditDir });
    assert.equal(JSON.stringify(plan.diffPreview).includes("host_consent"), false);
    const receipt = await apply(plan);
    assert.equal(receipt.status, "installed_pending_host_confirmation");
    const config = JSON.parse(await readFile(hookSpec.targetPath, "utf8"));

    assert.equal(config.version, 1);
    assert.deepEqual(config.hooks.preToolUse[0], { command: "format-on-edit", matcher: ".*" });
    assert.equal(config.hooks.sessionStart[0].command, "echo hi");
    for (const eosEvent of CURSOR_STATUS_EVENTS) {
      const cursorEvent = CURSOR_HOOK_EVENT_MAP[eosEvent];
      const eosEntries = config.hooks[cursorEvent].filter((entry) => entry.command.includes("eosHookBridge.js"));
      assert.equal(eosEntries.length, 1);
      assert.equal(eosEntries[0].command.includes(`'${eosEvent}'`), true);
    }
    assert.equal((await readFile(hookSpec.targetPath, "utf8")).includes(consentId), false);
    assert.equal((await readFile(hookSpec.targetPath, "utf8")).includes(captureToken), false);
    assert.deepEqual(JSON.parse(await readFile(hookSpec.consentFilePath, "utf8")), { consentId, captureToken });

    const inspection = await inspectHostHookInstallation({
      host: "cursor",
      workspaceDir: workspace,
      configPath: hookSpec.targetPath,
      secretRoot,
      tokenPath: hookSpec.consentFilePath,
      expectedConsentId: consentId,
      expectedCaptureTokenHash: digest(captureToken)
    });
    assert.equal(inspection.configured, true);
    assert.equal(inspection.tokenReady, true);
    assert.deepEqual([...inspection.eventNames].sort(),
      [...new Set(CURSOR_STATUS_EVENTS.map((name) => CURSOR_HOOK_EVENT_MAP[name]))].sort());
    assert.equal(inspection.handlerCount, CURSOR_STATUS_EVENTS.length);
    assert.equal(inspection.error, null);

    const removal = await buildHostHookRemovalPlan({
      host: "cursor",
      workspaceDir: workspace,
      configPath: hookSpec.targetPath,
      secretRoot,
      tokenPath: hookSpec.consentFilePath,
      auditDir
    });
    const removalReceipt = await apply(removal);
    assert.equal(removalReceipt.status, "removed");
    const removed = JSON.parse(await readFile(hookSpec.targetPath, "utf8"));
    assert.equal(JSON.stringify(removed).includes("eosHookBridge.js"), false);
    assert.deepEqual(removed.hooks.preToolUse, [{ command: "format-on-edit", matcher: ".*" }]);
    assert.deepEqual(removed.hooks.sessionStart, [{ command: "echo hi" }]);
  });

  it("requires a second human confirmation with the exact scope", async () => {
    const consentId = "host_consent.codex.secret";
    const captureToken = "host_capture.codex.secret";
    const plan = await buildHostHookInstallPlan(spec("codex", consentId), { workspaceDir: workspace, consentId, captureToken });
    await assert.rejects(applyHostHookPlan(plan, { approved: true }), /metadata-only operational status/);
  });

  it("rejects a stale plan after concurrent host config change", async () => {
    const consentId = "host_consent.codex.secret";
    const captureToken = "host_capture.codex.secret";
    const hookSpec = spec("codex", consentId);
    const plan = await buildHostHookInstallPlan(hookSpec, { workspaceDir: workspace, consentId, captureToken });
    await mkdir(path.dirname(hookSpec.targetPath), { recursive: true });
    await writeFile(hookSpec.targetPath, '{"changed":true}\n');
    await assert.rejects(apply(plan), /changed after preview/);
    assert.deepEqual(JSON.parse(await readFile(hookSpec.targetPath, "utf8")), { changed: true });
  });

  it("rejects a stale plan after concurrent consent token change", async () => {
    const consentId = "host_consent.codex.secret";
    const captureToken = "host_capture.codex.secret";
    const hookSpec = spec("codex", consentId);
    const plan = await buildHostHookInstallPlan(hookSpec, { workspaceDir: workspace, consentId, captureToken });
    await mkdir(path.dirname(hookSpec.consentFilePath), { recursive: true });
    await writeFile(hookSpec.consentFilePath, JSON.stringify({ consentId, captureToken: "host_capture.codex.concurrent" }), { mode: 0o600 });
    await assert.rejects(apply(plan), /token changed after preview/);
    assert.equal(JSON.parse(await readFile(hookSpec.consentFilePath, "utf8")).captureToken, "host_capture.codex.concurrent");
    await assert.rejects(readFile(hookSpec.targetPath, "utf8"), { code: "ENOENT" });
  });

  it("rolls back when structure verification fails", async () => {
    const consentId = "host_consent.codex.secret";
    const captureToken = "host_capture.codex.secret";
    const hookSpec = spec("codex", consentId);
    const plan = await buildHostHookInstallPlan(hookSpec, { workspaceDir: workspace, consentId, captureToken });
    const receipt = await apply(plan, async () => ({ ok: false, status: "forced_failure" }));
    assert.equal(receipt.status, "rolled_back_after_failed_verification");
    await assert.rejects(readFile(hookSpec.targetPath, "utf8"), { code: "ENOENT" });
    await assert.rejects(readFile(hookSpec.consentFilePath, "utf8"), { code: "ENOENT" });
  });

  it("replaces prior EOS handlers without duplicating and removes only EOS handlers", async () => {
    const firstSpec = spec("codex", "host_consent.codex.first");
    await apply(await buildHostHookInstallPlan(firstSpec, {
      workspaceDir: workspace,
      consentId: "host_consent.codex.first",
      captureToken: "host_capture.codex.first"
    }));
    const secondSpec = spec("codex", "host_consent.codex.second");
    await apply(await buildHostHookInstallPlan(secondSpec, {
      workspaceDir: workspace,
      consentId: "host_consent.codex.second",
      captureToken: "host_capture.codex.second"
    }));
    const installed = JSON.parse(await readFile(secondSpec.targetPath, "utf8"));
    assert.equal((JSON.stringify(installed).match(/eosHookBridge\.js/g) || []).length, STATUS_EVENTS.length);
    assert.equal(JSON.stringify(installed).includes("host_consent.codex.first"), false);

    installed.hooks.SessionEnd.push({ hooks: [{ type: "command", command: "keep-me" }] });
    await writeFile(secondSpec.targetPath, JSON.stringify(installed, null, 2) + "\n");
    const removal = await buildHostHookRemovalPlan({
      host: "codex",
      workspaceDir: workspace,
      configPath: secondSpec.targetPath,
      secretRoot,
      tokenPath: secondSpec.consentFilePath,
      auditDir
    });
    const receipt = await apply(removal);
    const removed = JSON.parse(await readFile(secondSpec.targetPath, "utf8"));
    assert.equal(receipt.status, "removed");
    assert.equal(JSON.stringify(removed).includes("eosHookBridge.js"), false);
    assert.equal(JSON.stringify(removed).includes("keep-me"), true);
    await assert.rejects(readFile(secondSpec.consentFilePath, "utf8"), { code: "ENOENT" });
  });

  it("rejects a config symlink that escapes the workspace", async () => {
    const outside = await mkdtemp(path.join(tmpdir(), "eos-hook-outside-"));
    try {
      await symlink(outside, path.join(workspace, ".codex"));
      await assert.rejects(
        buildHostHookInstallPlan(spec(), {
          workspaceDir: workspace,
          consentId: "host_consent.codex.secret",
          captureToken: "host_capture.codex.secret"
        }),
        /outside the workspace/
      );
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });
});
