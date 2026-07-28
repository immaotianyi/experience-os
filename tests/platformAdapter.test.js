/**
 * Tests for eosPlatformAdapter.js — platform detection, registry, and health checks.
 *
 * These tests are defensive: they must not depend on any specific tool being
 * installed on the host. They verify the adapter's contract (shape of
 * results, error handling, registry integrity) rather than exact status
 * values, which depend on the host environment.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PLATFORMS,
  detectPlatform,
  checkPlatformHealth,
  getPlatformAdapter,
  tryStartPlatform,
  getInstallInstructions,
  diagnosePlatform
} from "../src/eosPlatformAdapter.js";

const PLATFORM_NAMES = ["tray", "work", "vault", "codex", "cloud"];
const VALID_STATUSES = new Set(["active", "ready", "not_configured", "error"]);

describe("Platform registry", () => {
  it("exports exactly the five known platforms", () => {
    const names = PLATFORMS.map((p) => p.name);
    assert.deepEqual([...names].sort(), [...PLATFORM_NAMES].sort());
  });

  it("every platform has name + description", () => {
    for (const p of PLATFORMS) {
      assert.equal(typeof p.name, "string", `${p} missing name`);
      assert.ok(p.name.length > 0, `${p} empty name`);
      assert.equal(typeof p.description, "string", `${p.name} missing description`);
      assert.ok(p.description.length > 0, `${p.name} empty description`);
    }
  });

  it("PLATFORMS is frozen", () => {
    assert.ok(Object.isFrozen(PLATFORMS), "PLATFORMS should be frozen");
  });
});

describe("getPlatformAdapter", () => {
  it("returns an adapter for each known platform", () => {
    for (const name of PLATFORM_NAMES) {
      const adapter = getPlatformAdapter(name);
      assert.equal(adapter.name, name);
      assert.equal(typeof adapter.detect, "function");
      assert.equal(typeof adapter.start, "function");
      assert.equal(typeof adapter.instructions, "function");
    }
  });

  it("throws for an unknown platform name", () => {
    assert.throws(
      () => getPlatformAdapter("unknown"),
      /Unknown EOS platform/
    );
  });
});

describe("getInstallInstructions", () => {
  it("returns non-empty instructions for every platform", () => {
    for (const name of PLATFORM_NAMES) {
      const text = getInstallInstructions(name);
      assert.equal(typeof text, "string", `${name} instructions not a string`);
      assert.ok(text.length > 10, `${name} instructions too short`);
    }
  });

  it("throws for an unknown platform", () => {
    assert.throws(() => getInstallInstructions("nope"), /Unknown EOS platform/);
  });
});

describe("detectPlatform", () => {
  it("never throws — returns an envelope with detected + status + details", async () => {
    for (const name of PLATFORM_NAMES) {
      const result = await detectPlatform(name);
      assert.equal(typeof result, "object", `${name} result not an object`);
      assert.equal(typeof result.detected, "boolean", `${name} detected not boolean`);
      assert.ok(VALID_STATUSES.has(result.status), `${name} has invalid status: ${result.status}`);
      assert.equal(typeof result.details, "object", `${name} details not an object`);
      assert.notEqual(result.details, null, `${name} details is null`);
    }
  });

  it("returns error envelope for unknown platform", async () => {
    const result = await detectPlatform("does-not-exist");
    assert.equal(result.status, "error");
    assert.equal(result.detected, false);
    assert.ok(result.details.error, "error envelope should carry an error message");
  });
});

describe("checkPlatformHealth", () => {
  it("returns a platform map keyed by name plus a summary", async () => {
    const health = await checkPlatformHealth();
    assert.equal(typeof health, "object");
    assert.equal(typeof health.platforms, "object");
    assert.equal(typeof health.summary, "object");

    for (const name of PLATFORM_NAMES) {
      assert.ok(name in health.platforms, `${name} missing from platforms map`);
    }
  });

  it("summary counts match the platform results", async () => {
    const { platforms, summary } = await checkPlatformHealth();
    const results = Object.values(platforms);

    assert.equal(summary.total, PLATFORM_NAMES.length);
    assert.equal(summary.detected, results.filter((r) => r.detected).length);
    assert.equal(summary.active, results.filter((r) => r.status === "active").length);
    assert.equal(summary.ready, results.filter((r) => r.status === "ready").length);
    assert.equal(summary.notConfigured, results.filter((r) => r.status === "not_configured").length);
    assert.equal(summary.errors, results.filter((r) => r.status === "error").length);
  });

  it("summary counts sum to total", async () => {
    const { summary } = await checkPlatformHealth();
    const sum = summary.active + summary.ready + summary.notConfigured + summary.errors;
    assert.equal(sum, summary.total, "status counts should sum to total");
  });
});

describe("tryStartPlatform", () => {
  it("never throws — returns a result envelope", async () => {
    for (const name of PLATFORM_NAMES) {
      const result = await tryStartPlatform(name, { workspaceDir: "/tmp/nonexistent-eos-test" });
      assert.equal(typeof result, "object", `${name} start result not an object`);
      assert.equal(typeof result.started, "boolean", `${name} started not boolean`);
      assert.equal(typeof result.message, "string", `${name} message not a string`);
    }
  });

  it("returns started:false for an unknown platform", async () => {
    const result = await tryStartPlatform("nope");
    assert.equal(result.started, false);
    assert.ok(result.message, "should carry an error message");
  });
});

describe("Adapter-specific contracts", () => {
  it("tray adapter reports macOS-only on other platforms", async () => {
    const result = await detectPlatform("tray");
    if (process.platform !== "darwin") {
      assert.equal(result.detected, false);
      assert.equal(result.status, "not_configured");
      assert.ok(result.details.reason, "non-macOS tray should explain why");
    }
  });

  it("vault adapter always provides a vaultDir in details", async () => {
    const result = await detectPlatform("vault");
    assert.ok(result.details.vaultDir, "vault details should include vaultDir");
    assert.equal(typeof result.details.vaultDir, "string");
  });

  it("codex adapter reports not_configured when CLI is absent", async () => {
    const result = await detectPlatform("codex");
    if (!result.detected) {
      assert.equal(result.status, "not_configured");
      assert.ok(result.details.reason || result.details.error, "absent codex should explain why");
    }
  });

  it("cloud adapter always reports dockerfile + renderYaml existence", async () => {
    const result = await detectPlatform("cloud");
    assert.ok(result.details.dockerfile, "cloud should report dockerfile info");
    assert.ok(result.details.renderYaml, "cloud should report renderYaml info");
    assert.equal(typeof result.details.dockerfile.exists, "boolean");
    assert.equal(typeof result.details.renderYaml.exists, "boolean");
  });
});

describe("diagnosePlatform", () => {
  it("never throws — returns an envelope for every known platform", async () => {
    for (const name of PLATFORM_NAMES) {
      const diag = await diagnosePlatform(name);
      assert.equal(typeof diag, "object", `${name} diagnosis not an object`);
      assert.equal(typeof diag.status, "string", `${name} status not a string`);
      assert.equal(typeof diag.healthy, "boolean", `${name} healthy not boolean`);
      assert.ok(Array.isArray(diag.advice), `${name} advice not an array`);
      assert.equal(typeof diag.result, "object", `${name} result not an object`);
    }
  });

  it("healthy platforms have empty advice", async () => {
    for (const name of PLATFORM_NAMES) {
      const diag = await diagnosePlatform(name);
      if (diag.healthy) {
        assert.equal(diag.advice.length, 0, `${name} should have no advice when healthy`);
      }
    }
  });

  it("unhealthy platforms provide at least one actionable advice string", async () => {
    for (const name of PLATFORM_NAMES) {
      const diag = await diagnosePlatform(name);
      if (!diag.healthy && diag.status !== "error") {
        assert.ok(diag.advice.length > 0, `${name} should have advice when not healthy (status=${diag.status})`);
        for (const tip of diag.advice) {
          assert.equal(typeof tip, "string");
          assert.ok(tip.length > 0, `${name} advice should be non-empty`);
        }
      }
    }
  });

  it("returns an error envelope for unknown platform without throwing", async () => {
    const diag = await diagnosePlatform("does-not-exist");
    assert.equal(diag.status, "error");
    assert.equal(diag.healthy, false);
    assert.ok(Array.isArray(diag.advice));
  });
});
