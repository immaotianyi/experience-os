import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { bootstrapWorkspace } from "../src/eosBootstrap.js";
import {
  PLATFORMS,
  detectPlatform,
  checkPlatformHealth,
  getPlatformAdapter,
  tryStartPlatform,
  getInstallInstructions
} from "../src/eosPlatformAdapter.js";

const KNOWN_PLATFORMS = ["tray", "work", "vault", "codex", "cloud"];

let tempDirs = [];
afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

describe("EOS platform adapter", () => {
  describe("PLATFORMS constant", () => {
    it("exports the five known platform definitions in order", () => {
      const names = PLATFORMS.map((p) => p.name);
      assert.deepEqual(names, KNOWN_PLATFORMS);
      for (const p of PLATFORMS) {
        assert.equal(typeof p.name, "string");
        assert.ok(p.name.length > 0);
        assert.equal(typeof p.description, "string");
        assert.ok(p.description.length > 0);
      }
    });

    it("is frozen so callers cannot mutate the registry", () => {
      assert.ok(Object.isFrozen(PLATFORMS));
    });
  });

  describe("platform detection", () => {
    it("detects a bootstrapped workspace via the work platform", async () => {
      const workspace = await mkdtemp(path.join(tmpdir(), "eos-platform-work-"));
      tempDirs.push(workspace);
      await bootstrapWorkspace({ workspaceDir: workspace, name: "Adapter test" });

      const result = await detectPlatform("work", { workspaceDir: workspace });
      assert.equal(result.detected, true);
      assert.equal(result.status, "active");
      assert.ok(result.details.projectId, "projectId should be populated");
      assert.equal(result.details.workspace, workspace);
      assert.equal(result.details.vaultDir, path.join(workspace, ".eos", "vault"));
    });

    it("detects an initialized vault via the vault platform", async () => {
      const workspace = await mkdtemp(path.join(tmpdir(), "eos-platform-vault-"));
      tempDirs.push(workspace);
      const bootstrapped = await bootstrapWorkspace({ workspaceDir: workspace, name: "Vault test" });

      const result = await detectPlatform("vault", { vaultDir: bootstrapped.vaultDir });
      assert.equal(result.detected, true);
      assert.match(result.status, /active|ready/);
      assert.equal(result.details.vaultDir, bootstrapped.vaultDir);
      assert.equal(result.details.gitInitialized, true);
    });

    it("reports not_configured for a workspace that was never bootstrapped", async () => {
      const result = await detectPlatform("work", { workspaceDir: "/nonexistent/eos/workspace" });
      assert.equal(result.detected, false);
      assert.equal(result.status, "not_configured");
      assert.ok(Array.isArray(result.details.searched));
    });

    it("reports not_configured for a vault directory that does not exist", async () => {
      const result = await detectPlatform("vault", { vaultDir: "/nonexistent/eos/vault" });
      assert.equal(result.detected, false);
      assert.equal(result.status, "not_configured");
    });

    it("checkPlatformHealth returns a status for every platform and detects work + vault", async () => {
      const workspace = await mkdtemp(path.join(tmpdir(), "eos-platform-health-"));
      tempDirs.push(workspace);
      await bootstrapWorkspace({ workspaceDir: workspace, name: "Health test" });

      const health = await checkPlatformHealth({ workspaceDir: workspace });
      assert.equal(health.summary.total, KNOWN_PLATFORMS.length);

      for (const name of KNOWN_PLATFORMS) {
        assert.ok(health.platforms[name], `missing status for ${name}`);
        assert.ok(
          ["active", "ready", "not_configured", "error"].includes(health.platforms[name].status),
          `unexpected status for ${name}`
        );
      }

      // work and vault should both be detected against the bootstrapped workspace.
      assert.equal(health.platforms.work.detected, true);
      assert.equal(health.platforms.vault.detected, true);
      assert.ok(health.summary.detected >= 2, "at least vault and work should be detected");
    });
  });

  describe("getInstallInstructions", () => {
    for (const name of KNOWN_PLATFORMS) {
      it(`returns a non-empty instruction string for ${name}`, () => {
        const instructions = getInstallInstructions(name);
        assert.equal(typeof instructions, "string");
        assert.ok(instructions.trim().length > 0, `instructions for ${name} are empty`);
      });
    }

    it("throws for an unknown platform name", () => {
      assert.throws(() => getInstallInstructions("nope"), /Unknown EOS platform/);
    });
  });

  describe("getPlatformAdapter", () => {
    it("returns an adapter with detect/start/instructions for a known platform", () => {
      const adapter = getPlatformAdapter("vault");
      assert.equal(adapter.name, "vault");
      assert.equal(typeof adapter.detect, "function");
      assert.equal(typeof adapter.start, "function");
      assert.equal(typeof adapter.instructions, "function");
    });

    it("throws for an unknown platform name", () => {
      assert.throws(() => getPlatformAdapter("nope"), /Unknown EOS platform/);
    });
  });

  describe("tryStartPlatform", () => {
    it("throws for an unknown platform name", async () => {
      await assert.rejects(() => tryStartPlatform("nope"), /Unknown EOS platform/);
    });

    it("returns a result object for a platform with no runnable process (vault)", async () => {
      const result = await tryStartPlatform("vault");
      assert.equal(typeof result.started, "boolean");
      assert.equal(typeof result.message, "string");
      assert.ok(result.message.length > 0);
    });

    it("returns a helpful message when no workspace is bound for the workbench", async () => {
      // Ensure no ambient EOS_WORKSPACE_DIR influences the result.
      const saved = process.env.EOS_WORKSPACE_DIR;
      delete process.env.EOS_WORKSPACE_DIR;
      try {
        const result = await tryStartPlatform("work", { workspaceDir: "/nonexistent/eos/workspace" });
        assert.equal(result.started, false);
        assert.ok(result.message.length > 0);
      } finally {
        if (saved !== undefined) process.env.EOS_WORKSPACE_DIR = saved;
      }
    });
  });
});
