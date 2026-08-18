import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { bootstrapWorkspace } from "../src/eosBootstrap.js";
import { EOS_RELAY_PATH } from "../src/eosMcpProbe.js";
import {
  PLATFORMS,
  detectPlatform,
  checkPlatformHealth,
  getPlatformAdapter,
  tryStartPlatform,
  getInstallInstructions
} from "../src/eosPlatformAdapter.js";

const KNOWN_HOSTS = ["codex", "claude", "cursor", "trae", "vscode"];
const VALID_STATUSES = ["not_installed", "available", "configured", "callable", "observing", "error"];

let tempDirs = [];
afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

async function workspace() {
  const dir = await mkdtemp(path.join(tmpdir(), "eos-integration-"));
  tempDirs.push(dir);
  const config = await bootstrapWorkspace({ workspaceDir: dir, name: "Integration test" });
  return { dir, config };
}

describe("EOS verified integration adapters", () => {
  it("names real AI hosts rather than EOS internal components", () => {
    assert.deepEqual(PLATFORMS.map((host) => host.name), KNOWN_HOSTS);
    assert.ok(Object.isFrozen(PLATFORMS));
    for (const host of PLATFORMS) {
      assert.ok(host.label);
      assert.ok(host.description);
      assert.ok(["supported", "unverified", "mcp_only", "extension"].includes(host.hooks));
    }
  });

  it("returns an evidence-shaped result for every host", async () => {
    const { dir, config } = await workspace();
    const health = await checkPlatformHealth({
      workspaceDir: dir,
      vaultDir: config.vaultDir
    });

    assert.equal(health.summary.total, KNOWN_HOSTS.length);
    assert.equal(health.relay.ok, true);
    for (const name of KNOWN_HOSTS) {
      const result = health.platforms[name];
      assert.ok(VALID_STATUSES.includes(result.status), `${name}: ${result.status}`);
      assert.equal(typeof result.compatibilityLevel, "number");
      assert.equal(typeof result.proof.hostInstalled, "boolean");
      assert.equal(typeof result.proof.mcpRegistered, "boolean");
      assert.equal(typeof result.proof.relayConformant, "boolean");
      assert.equal(typeof result.proof.eventObserved, "boolean");
      assert.ok(result.connection);
    }
  });

  it("detects a project-level Cursor MCP registration without claiming host confirmation", async () => {
    const { dir, config } = await workspace();
    const configDir = path.join(dir, ".cursor");
    await mkdir(configDir, { recursive: true });
    await writeFile(path.join(configDir, "mcp.json"), JSON.stringify({
      mcpServers: {
        "experience-os": {
          command: process.execPath,
          args: [EOS_RELAY_PATH],
          env: {
            EOS_VAULT_DIR: config.vaultDir,
            EOS_CAPTURE_POLICY: "strict_permit"
          }
        }
      }
    }));

    const result = await detectPlatform("cursor", {
      workspaceDir: dir,
      vaultDir: config.vaultDir,
      relayProbe: { ok: true, serverInfo: { name: "experience-os-capture-relay" }, toolCount: 11 }
    });

    assert.equal(result.proof.mcpRegistered, true);
    assert.equal(result.proof.vaultBound, true);
    assert.equal(result.proof.hostConfirmed, false);
    assert.ok(["not_installed", "configured"].includes(result.status));
    assert.notEqual(result.status, "callable");
  });

  it("does not accept a legacy conversation event as observation evidence", async () => {
    const { dir, config } = await workspace();
    const result = await detectPlatform("cursor", {
      workspaceDir: dir,
      vaultDir: config.vaultDir,
      observedSourceTools: ["cursor"],
      relayProbe: { ok: true, serverInfo: { name: "experience-os-capture-relay" }, toolCount: 11 }
    });

    assert.equal(result.proof.eventObserved, false);
    if (result.proof.hostInstalled) {
      assert.equal(result.status, "available");
      assert.equal(result.compatibilityLevel, 1);
    } else {
      assert.equal(result.status, "not_installed");
    }
  });

  it("accepts only a consented HostObservation host as L4 evidence", async () => {
    const result = await detectPlatform("cursor", {
      observedHosts: ["cursor"],
      relayProbe: { ok: true, serverInfo: { name: "experience-os-capture-relay" }, toolCount: 11 }
    });
    assert.equal(result.proof.eventObserved, true);
  });

  describe("connection plans", () => {
    for (const name of KNOWN_HOSTS) {
      it(`returns reviewable instructions for ${name}`, () => {
        const instructions = getInstallInstructions(name);
        assert.ok(instructions.includes("严格许可默认开启"));
      });
    }

    it("generates a VS Code MCP config without modifying the workspace", async () => {
      const { dir, config } = await workspace();
      const result = await tryStartPlatform("vscode", {
        workspaceDir: dir,
        vaultDir: config.vaultDir
      });

      assert.equal(result.started, false);
      assert.equal(result.action, "human_configuration_required");
      assert.equal(result.configPath, path.join(dir, ".vscode", "mcp.json"));
      assert.equal(result.config.servers["experience-os"].type, "stdio");
      assert.equal(result.config.servers["experience-os"].env.EOS_CAPTURE_POLICY, "strict_permit");
    });

    it("never replaces an explicit unbootstrapped workspace with the process cwd", async () => {
      const dir = await mkdtemp(path.join(tmpdir(), "eos-explicit-workspace-"));
      tempDirs.push(dir);
      const result = await tryStartPlatform("cursor", {
        workspaceDir: dir,
        vaultDir: path.join(dir, ".eos", "vault")
      });

      assert.equal(result.configPath, path.join(dir, ".cursor", "mcp.json"));
    });
  });

  it("returns an adapter for a known host and rejects unknown names", () => {
    const adapter = getPlatformAdapter("claude");
    assert.equal(adapter.name, "claude");
    assert.equal(typeof adapter.detect, "function");
    assert.throws(() => getPlatformAdapter("tray"), /Unknown EOS integration host/);
  });

  it("fails closed for unknown connection attempts", async () => {
    const result = await tryStartPlatform("nope");
    assert.equal(result.started, false);
    assert.match(result.message, /Unknown EOS integration host/);
  });
});
