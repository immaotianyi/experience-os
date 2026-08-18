import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { HostConnectionCoordinator } from "../src/hostConnectionCoordinator.js";

let tempDirs = [];
afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

async function fixture({ mode = "json", installed = true } = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), "eos-host-coordinator-"));
  tempDirs.push(dir);
  const configPath = path.join(dir, ".cursor", "mcp.json");
  const desiredServer = {
    command: "/usr/bin/node",
    args: ["/opt/eos/relay.js"],
    env: {
      EOS_VAULT_DIR: path.join(dir, ".eos", "vault"),
      EOS_CAPTURE_POLICY: "strict_permit"
    }
  };
  const detector = async () => ({
    status: installed ? "configured" : "not_installed",
    compatibilityLevel: installed ? 2 : 0,
    proof: {
      hostInstalled: installed,
      mcpRegistered: true,
      vaultBound: true,
      relayConformant: true,
      hostConfirmed: false
    }
  });
  const planner = async () => mode === "json"
    ? {
        started: false,
        mode,
        configPath,
        config: { mcpServers: { "experience-os": desiredServer } }
      }
    : {
        started: false,
        mode,
        command: "codex mcp add experience-os"
      };
  const coordinator = new HostConnectionCoordinator({
    auditDir: path.join(dir, "audit"),
    platformPlanner: planner,
    platformDetector: detector
  });
  return { coordinator, configPath, dir };
}

describe("HostConnectionCoordinator", () => {
  it("keeps preview read-only and returns a redacted, server-held plan", async () => {
    const { coordinator, configPath } = await fixture();
    const result = await coordinator.preview("cursor", { vaultDir: "/private/vault" });

    assert.equal(result.canApply, true);
    assert.equal(result.action, "human_approval_required");
    assert.ok(result.planId.startsWith("connection-plan."));
    assert.equal(result.diffPreview.after.envKeys.includes("EOS_CAPTURE_POLICY"), true);
    assert.equal(JSON.stringify(result).includes("strict_permit"), false);
    await assert.rejects(readFile(configPath, "utf8"), { code: "ENOENT" });
  });

  it("requires explicit approval, preserves unrelated settings, and consumes the plan once", async () => {
    const { coordinator, configPath } = await fixture();
    await writeFile(configPath, JSON.stringify({ editor: { fontSize: 15 } }), { encoding: "utf8", flag: "wx" }).catch(async (error) => {
      if (error.code !== "ENOENT") throw error;
      const { mkdir } = await import("node:fs/promises");
      await mkdir(path.dirname(configPath), { recursive: true });
      await writeFile(configPath, JSON.stringify({ editor: { fontSize: 15 } }), "utf8");
    });
    const preview = await coordinator.preview("cursor");

    await assert.rejects(coordinator.apply(preview.planId), /approval/);
    const receipt = await coordinator.apply(preview.planId, { approved: true });

    assert.equal(receipt.status, "verified");
    assert.equal(receipt.evidenceLevel, 2);
    assert.equal(receipt.hostConfirmed, false);
    assert.deepEqual(JSON.parse(await readFile(configPath, "utf8")).editor, { fontSize: 15 });
    await assert.rejects(
      coordinator.apply(preview.planId, { approved: true }),
      /missing, expired, or already used/
    );
  });

  it("never offers automatic apply for command or manual integrations", async () => {
    for (const mode of ["command", "manual"]) {
      const { coordinator } = await fixture({ mode });
      const result = await coordinator.preview(mode === "command" ? "codex" : "trae");
      assert.equal(result.canApply, false);
      assert.equal(result.action, "manual_configuration_required");
      assert.equal(coordinator.pendingPlans.size, 0);
    }
  });

  it("checks the route target before consuming or applying a reviewed plan", async () => {
    const { coordinator } = await fixture();
    const preview = await coordinator.preview("cursor");
    await assert.rejects(
      coordinator.apply(preview.planId, { approved: true, target: "vscode" }),
      /target does not match/
    );
    const receipt = await coordinator.apply(preview.planId, { approved: true, target: "cursor" });
    assert.equal(receipt.status, "verified");
  });

  it("refuses to prepare writes for an uninstalled host", async () => {
    const { coordinator } = await fixture({ installed: false });
    const result = await coordinator.preview("cursor");
    assert.equal(result.canApply, false);
    assert.equal(result.action, "install_host_first");
    assert.equal(coordinator.pendingPlans.size, 0);
  });
});
