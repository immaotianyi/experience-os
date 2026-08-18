import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, utimes } from "node:fs/promises";
import os, { tmpdir } from "node:os";
import path from "node:path";
import { WorkspaceRegistry } from "../src/workspaceRegistry.js";

describe("WorkspaceRegistry", () => {
  it("bootstraps and registers an explicitly confirmed project", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "eos-registry-"));
    const workspace = path.join(root, "project");
    const registry = new WorkspaceRegistry(path.join(root, "registry.json"));
    await import("node:fs/promises").then(({ mkdir }) => mkdir(workspace));
    const entry = await registry.connect({
      workspaceDir: workspace,
      sourceHosts: ["cursor"],
      consent: true,
      confirmWrites: true
    });
    assert.equal(entry.status, "ready");
    assert.deepEqual(entry.sourceHosts, ["cursor"]);
    assert.equal((await registry.list()).length, 1);
  });

  it("refuses to write before the second confirmation", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "eos-registry-"));
    const registry = new WorkspaceRegistry(path.join(root, "registry.json"));
    await assert.rejects(registry.connect({
      workspaceDir: root,
      sourceHosts: [],
      consent: true,
      confirmWrites: false
    }), /需要确认/);
  });

  it("rejects broad directories before any workspace write", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "eos-registry-broad-"));
    const registry = new WorkspaceRegistry(path.join(root, "registry.json"));
    await assert.rejects(
      registry.connect({
        workspaceDir: os.homedir(),
        sourceHosts: ["codex"],
        consent: true,
        confirmWrites: true
      }),
      /具体项目目录/
    );
  });

  it("recovers a stale registry lock left by a crashed process", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "eos-registry-stale-"));
    const workspace = path.join(root, "project");
    const registry = new WorkspaceRegistry(path.join(root, "registry.json"));
    await mkdir(workspace);
    await mkdir(registry.lockDir);
    const old = new Date(Date.now() - 10 * 60_000);
    await utimes(registry.lockDir, old, old);

    const entry = await registry.connect({
      workspaceDir: workspace,
      sourceHosts: ["codex"],
      consent: true,
      confirmWrites: true
    });

    assert.equal(entry.status, "ready");
  });
});
