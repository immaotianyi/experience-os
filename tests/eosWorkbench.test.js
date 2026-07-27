import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { bootstrapWorkspace } from "../src/eosBootstrap.js";
import { resolveWorkspaceWorkbench } from "../src/eosWorkbench.js";

let workspaces = [];
afterEach(async () => {
  await Promise.all(workspaces.map((dir) => rm(dir, { recursive: true, force: true })));
  workspaces = [];
});

describe("EOS workspace workbench", () => {
  it("binds the server to the bootstrapped workspace vault", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "eos-workbench-"));
    workspaces.push(workspace);
    const bootstrapped = await bootstrapWorkspace({ workspaceDir: workspace, name: "Workspace UI" });

    const config = await resolveWorkspaceWorkbench({ workspaceDir: workspace, port: "4181" });
    assert.equal(config.projectId, bootstrapped.projectId);
    assert.equal(config.vaultDir, path.join(workspace, ".eos", "vault"));
    assert.equal(config.port, 4181);
  });

  it("rejects an unbootstrapped workspace and unsafe ports", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "eos-workbench-"));
    workspaces.push(workspace);
    await assert.rejects(() => resolveWorkspaceWorkbench({ workspaceDir: workspace }), /run npm run bootstrap first/);
    await bootstrapWorkspace({ workspaceDir: workspace, name: "Port check" });
    await assert.rejects(() => resolveWorkspaceWorkbench({ workspaceDir: workspace, port: "not-a-port" }), /port must be an integer/);
  });
});
