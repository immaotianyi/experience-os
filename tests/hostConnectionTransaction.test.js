import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  applyHostConnectionPlan,
  buildHostConnectionPlan
} from "../src/hostConnectionTransaction.js";

let root;
let configPath;
let auditDir;

const desiredServer = {
  command: "/Applications/EOS.app/Contents/MacOS/EOS",
  args: ["relay:mcp"],
  env: {
    EOS_VAULT_DIR: "/tmp/project/.eos/vault",
    EOS_CAPTURE_POLICY: "strict_permit"
  }
};

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "eos-host-transaction-"));
  configPath = path.join(root, "host", "mcp.json");
  auditDir = path.join(root, "audit");
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function seedConfig() {
  await writeFile(configPath, JSON.stringify({
    theme: "dark",
    mcpServers: {
      existing: {
        command: "other-server",
        env: { SECRET_TOKEN: "must-not-enter-eos-audit" }
      }
    }
  }, null, 2) + "\n", { encoding: "utf8", flag: "wx" }).catch(async (error) => {
    if (error.code !== "ENOENT") throw error;
    const { mkdir } = await import("node:fs/promises");
    await mkdir(path.dirname(configPath), { recursive: true });
    await writeFile(configPath, JSON.stringify({
      theme: "dark",
      mcpServers: {
        existing: { command: "other-server", env: { SECRET_TOKEN: "must-not-enter-eos-audit" } }
      }
    }, null, 2) + "\n", "utf8");
  });
}

function makePlan(options = {}) {
  return buildHostConnectionPlan({
    target: "cursor",
    configPath,
    desiredServer,
    auditDir,
    ...options
  });
}

describe("host connection plan", () => {
  it("is read-only and previews only the EOS server entry", async () => {
    await seedConfig();
    const before = await readFile(configPath, "utf8");
    const plan = await makePlan();
    assert.equal(await readFile(configPath, "utf8"), before);
    assert.equal(plan.diffPreview.operation, "add");
    assert.deepEqual(plan.diffPreview.after.envKeys, ["EOS_CAPTURE_POLICY", "EOS_VAULT_DIR"]);
    assert.equal(JSON.stringify(plan).includes("must-not-enter-eos-audit"), false);
  });

  it("requires explicit human approval", async () => {
    const plan = await makePlan();
    await assert.rejects(
      applyHostConnectionPlan(plan, { verify: async () => ({ ok: true }) }),
      /human approval/
    );
  });
});

describe("host connection apply", () => {
  it("preserves unrelated settings, verifies, and writes a redacted receipt", async () => {
    await seedConfig();
    const plan = await makePlan();
    const receipt = await applyHostConnectionPlan(plan, {
      approved: true,
      verify: async () => ({ ok: true, status: "callable", detail: "MCP handshake passed" })
    });
    const config = JSON.parse(await readFile(configPath, "utf8"));
    assert.equal(config.theme, "dark");
    assert.equal(config.mcpServers.existing.command, "other-server");
    assert.deepEqual(config.mcpServers["experience-os"], desiredServer);
    assert.equal(receipt.status, "verified");
    assert.ok(receipt.backupPath);
    const audit = await readFile(receipt.receiptPath, "utf8");
    assert.equal(audit.includes("must-not-enter-eos-audit"), false);
  });

  it("rejects a stale plan before writing", async () => {
    await seedConfig();
    const plan = await makePlan();
    await writeFile(configPath, '{"changedByHost":true}\n', "utf8");
    await assert.rejects(
      applyHostConnectionPlan(plan, { approved: true, verify: async () => ({ ok: true }) }),
      /changed after preview/
    );
    assert.deepEqual(JSON.parse(await readFile(configPath, "utf8")), { changedByHost: true });
  });

  it("automatically restores an existing config after failed verification", async () => {
    await seedConfig();
    const before = await readFile(configPath, "utf8");
    const plan = await makePlan();
    const receipt = await applyHostConnectionPlan(plan, {
      approved: true,
      verify: async () => ({ ok: false, status: "handshake_failed" })
    });
    assert.equal(receipt.status, "rolled_back_after_failed_verification");
    assert.equal(await readFile(configPath, "utf8"), before);
  });

  it("removes a newly created config after failed verification", async () => {
    const plan = await makePlan();
    const receipt = await applyHostConnectionPlan(plan, {
      approved: true,
      verify: async () => ({ ok: false, status: "server_stopped" })
    });
    assert.equal(receipt.status, "rolled_back_after_failed_verification");
    await assert.rejects(readFile(configPath, "utf8"), { code: "ENOENT" });
  });

  it("does not overwrite a host change that arrives during verification", async () => {
    await seedConfig();
    const plan = await makePlan();
    const receipt = await applyHostConnectionPlan(plan, {
      approved: true,
      verify: async () => {
        await writeFile(configPath, '{"hostChangedDuringVerify":true}\n', "utf8");
        return { ok: false, status: "handshake_failed" };
      }
    });
    assert.equal(receipt.status, "rollback_blocked_concurrent_change");
    assert.deepEqual(JSON.parse(await readFile(configPath, "utf8")), { hostChangedDuringVerify: true });
  });

  it("serializes concurrent applies so only one reviewed source hash can win", async () => {
    await seedConfig();
    const first = await makePlan();
    const second = await makePlan({ serverName: "experience-os-secondary" });
    const outcomes = await Promise.allSettled([
      applyHostConnectionPlan(first, { approved: true, verify: async () => ({ ok: true }) }),
      applyHostConnectionPlan(second, { approved: true, verify: async () => ({ ok: true }) })
    ]);
    assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 1);
    assert.equal(outcomes.filter((outcome) => outcome.status === "rejected").length, 1);
  });
});
