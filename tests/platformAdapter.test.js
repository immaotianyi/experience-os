/**
 * Public contract tests for verified AI host integrations.
 *
 * Exact installation states vary by machine. These tests assert that EOS uses
 * evidence levels and fails closed rather than treating application presence as
 * proof that an integration works.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PLATFORMS,
  detectPlatform,
  getPlatformAdapter,
  tryStartPlatform,
  getInstallInstructions,
  diagnosePlatform
} from "../src/eosPlatformAdapter.js";

const PLATFORM_NAMES = ["codex", "claude", "cursor", "trae", "vscode"];
const VALID_STATUSES = new Set([
  "not_installed",
  "available",
  "configured",
  "callable",
  "observing",
  "error"
]);
const PROOF_FIELDS = [
  "hostInstalled",
  "mcpRegistered",
  "relayConformant",
  "hostConfirmed",
  "vaultBound",
  "eventObserved"
];

describe("verified host registry", () => {
  it("contains the five real AI hosts", () => {
    assert.deepEqual(PLATFORMS.map((item) => item.name), PLATFORM_NAMES);
  });

  it("publishes a label, description and observation mechanism", () => {
    for (const platform of PLATFORMS) {
      assert.ok(platform.label);
      assert.ok(platform.description);
      assert.ok(["supported", "unverified", "mcp_only", "extension"].includes(platform.hooks));
    }
  });

  it("returns adapters and instructions for every known host", () => {
    for (const name of PLATFORM_NAMES) {
      const adapter = getPlatformAdapter(name);
      assert.equal(adapter.name, name);
      assert.equal(typeof adapter.detect, "function");
      assert.equal(typeof adapter.start, "function");
      assert.ok(getInstallInstructions(name).length > 20);
    }
  });

  it("rejects EOS internal components and unknown names", () => {
    for (const name of ["tray", "work", "vault", "cloud", "unknown"]) {
      assert.throws(() => getPlatformAdapter(name), /Unknown EOS integration host/);
    }
  });
});

describe("verified detection envelope", () => {
  it("contains an explicit evidence status and proof object", async () => {
    const relayProbe = {
      ok: true,
      serverInfo: { name: "experience-os-capture-relay" },
      protocolVersion: "2024-11-05",
      toolCount: 10,
      error: null
    };
    for (const name of PLATFORM_NAMES) {
      const result = await detectPlatform(name, { relayProbe });
      assert.ok(VALID_STATUSES.has(result.status), `${name}: ${result.status}`);
      assert.ok(Number.isInteger(result.compatibilityLevel));
      assert.ok(result.compatibilityLevel >= 0 && result.compatibilityLevel <= 4);
      for (const field of PROOF_FIELDS) {
        assert.ok(field in result.proof, `${name} missing proof.${field}`);
      }
      assert.equal(result.detected, result.proof.hostInstalled);
    }
  });

  it("fails closed for an unknown host", async () => {
    const result = await detectPlatform("does-not-exist");
    assert.equal(result.status, "error");
    assert.equal(result.compatibilityLevel, 0);
    assert.equal(result.detected, false);
  });
});

describe("human-reviewed connection plans", () => {
  it("never silently modifies another host", async () => {
    for (const name of PLATFORM_NAMES) {
      const result = await tryStartPlatform(name, {
        workspaceDir: "/tmp/eos-integration-contract",
        vaultDir: "/tmp/eos-integration-contract/.eos/vault"
      });
      assert.equal(result.started, false);
      assert.equal(result.action, "human_configuration_required");
      assert.ok(result.command || result.config || result.manualSteps);
    }
  });

  it("diagnosis keeps install, configuration and callability distinct", async () => {
    const diagnosis = await diagnosePlatform("codex", {
      relayProbe: {
        ok: true,
        serverInfo: { name: "experience-os-capture-relay" },
        protocolVersion: "2024-11-05",
        toolCount: 10,
        error: null
      }
    });
    assert.ok(VALID_STATUSES.has(diagnosis.status));
    assert.equal(diagnosis.healthy, diagnosis.result.compatibilityLevel >= 3);
    assert.ok(Array.isArray(diagnosis.advice));
  });
});
