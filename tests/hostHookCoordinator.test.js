import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { HostHookCoordinator } from "../src/hostHookCoordinator.js";
import { HOST_OBSERVATION_CONFIRMATION_SCOPE } from "../src/hostHookPlan.js";

const roots = [];
afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "eos-hook-coordinator-"));
  const workspaceDir = path.join(root, "workspace");
  const secretRoot = path.join(root, "secrets");
  await mkdir(workspaceDir, { recursive: true });
  roots.push(root);
  return {
    workspaceDir,
    secretRoot,
    coordinator: new HostHookCoordinator({
      auditDir: path.join(workspaceDir, ".eos", "audit"),
      secretRoot
    })
  };
}

describe("HostHookCoordinator", () => {
  it("returns a token-redacted, single-use install plan", async () => {
    const { workspaceDir, coordinator } = await fixture();
    const consentId = "host_consent.codex.must-not-reach-browser";
    const captureToken = "host_capture.codex.must-not-reach-browser";
    const preview = await coordinator.previewInstall({
      host: "codex", workspaceDir, consentId, captureToken, endpoint: "http://127.0.0.1:4173"
    });
    assert.equal(preview.canApply, true);
    assert.equal(JSON.stringify(preview).includes(consentId), false);
    assert.equal(JSON.stringify(preview).includes(captureToken), false);
    assert.equal(preview.diffPreview.consent, "private_token_file_mode_0600");

    const receipt = await coordinator.apply(preview.planId, {
      host: "codex",
      operation: "install",
      approved: true,
      confirmedScope: HOST_OBSERVATION_CONFIRMATION_SCOPE
    });
    assert.equal(receipt.status, "installed_pending_host_confirmation");
    assert.equal((await readFile(preview.configPath, "utf8")).includes(consentId), false);
    await assert.rejects(coordinator.apply(preview.planId, {
      host: "codex", operation: "install", approved: true, confirmedScope: HOST_OBSERVATION_CONFIRMATION_SCOPE
    }), /already used/);
  });

  it("requires exact second confirmation before writing", async () => {
    const { workspaceDir, coordinator } = await fixture();
    const preview = await coordinator.previewInstall({
      host: "claude",
      workspaceDir,
      consentId: "host_consent.claude.secret",
      captureToken: "host_capture.claude.secret",
      endpoint: "http://127.0.0.1:4173"
    });
    await assert.rejects(coordinator.apply(preview.planId, {
      host: "claude", operation: "install", approved: true
    }), /second confirmation/);
    await assert.rejects(readFile(preview.configPath, "utf8"), { code: "ENOENT" });
  });

  it("previews and applies targeted removal", async () => {
    const { workspaceDir, coordinator } = await fixture();
    const install = await coordinator.previewInstall({
      host: "codex",
      workspaceDir,
      consentId: "host_consent.codex.secret",
      captureToken: "host_capture.codex.secret",
      endpoint: "http://127.0.0.1:4173"
    });
    await coordinator.apply(install.planId, {
      host: "codex", operation: "install", approved: true, confirmedScope: HOST_OBSERVATION_CONFIRMATION_SCOPE
    });
    const removal = await coordinator.previewRemoval({ host: "codex", workspaceDir });
    assert.equal(removal.canApply, true);
    assert.equal(removal.diffPreview.operation, "remove");
    const receipt = await coordinator.apply(removal.planId, {
      host: "codex", operation: "remove", approved: true, confirmedScope: HOST_OBSERVATION_CONFIRMATION_SCOPE
    });
    assert.equal(receipt.status, "removed");
    assert.equal((await readFile(removal.configPath, "utf8")).includes("eosHookBridge.js"), false);
  });
});
