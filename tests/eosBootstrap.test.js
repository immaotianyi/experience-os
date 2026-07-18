import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { bootstrapWorkspace } from "../src/eosBootstrap.js";

let workspaces = [];
afterEach(async () => { await Promise.all(workspaces.map((dir) => rm(dir, { recursive: true, force: true }))); workspaces = []; });

describe("EOS workspace bootstrap", () => {
  it("creates an isolated, visible EOS home without changing the workspace root", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "eos-workspace-"));
    workspaces.push(workspace);
    const result = await bootstrapWorkspace({ workspaceDir: workspace, name: "My Workspace", goal: "Test the relay" });
    assert.equal(result.projectId, "project.my_workspace");
    assert.equal(result.projectCreated, true);
    const manifest = JSON.parse(await readFile(path.join(workspace, ".eos", "project.json"), "utf8"));
    const mcp = JSON.parse(await readFile(path.join(workspace, ".eos", "mcp.json"), "utf8"));
    assert.equal(manifest.capture.defaultConsent, false);
    assert.equal(mcp.mcpServers["experience-os"].env.EOS_VAULT_DIR, path.join(workspace, ".eos", "vault"));
  });

  it("is idempotent and preserves the first project record", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "eos-workspace-"));
    workspaces.push(workspace);
    await bootstrapWorkspace({ workspaceDir: workspace, name: "Stable" });
    const second = await bootstrapWorkspace({ workspaceDir: workspace, name: "Changed" });
    assert.equal(second.projectCreated, false);
    assert.equal(second.projectId, "project.stable");
  });

  it("keeps a Chinese workspace name while creating a Vault-safe project ID", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "eos-workspace-"));
    workspaces.push(workspace);
    const result = await bootstrapWorkspace({ workspaceDir: workspace, name: "TRAE WORK 接入试验" });
    assert.equal(result.projectId, "project.trae_work_u63a5u5165u8bd5u9a8c");
    const manifest = JSON.parse(await readFile(path.join(workspace, ".eos", "project.json"), "utf8"));
    assert.equal(manifest.projectId, result.projectId);
  });
});
