import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { discoverHostProjects, hostMetadataLocations } from "../src/onboardingDiscovery.js";

describe("discoverHostProjects", () => {
  it("includes both TRAE IDE and TRAE Work metadata on macOS", () => {
    const locations = hostMetadataLocations({ platform: "darwin", homeDir: "/Users/tester" });
    assert.ok(locations.trae.some((file) => file.includes("Trae CN")));
    assert.ok(locations.trae.some((file) => file.includes("TRAE SOLO CN")));
    assert.ok(locations.trae.some((file) => file.includes("TRAE Work CN")));
  });

  it("reads only authorized host metadata and merges duplicate workspace paths", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "eos-discovery-"));
    const project = path.join(root, "project-a");
    await mkdir(project);
    await writeFile(path.join(project, "package.json"), "{}");
    const cursorFile = path.join(root, "cursor.json");
    const vscodeFile = path.join(root, "vscode.json");
    const uri = pathToFileURL(project).href;
    await writeFile(cursorFile, JSON.stringify({ profileAssociations: { workspaces: { [uri]: "default" } } }));
    await writeFile(vscodeFile, JSON.stringify({ profileAssociations: { workspaces: { [uri]: "default" } } }));

    const result = await discoverHostProjects({
      consent: true,
      hosts: ["cursor", "vscode"],
      metadataFiles: { cursor: [cursorFile], vscode: [vscodeFile] }
    });
    assert.equal(result.count, 1);
    assert.deepEqual(result.projects[0].sourceHosts.sort(), ["cursor", "vscode"]);
    assert.ok(result.projects[0].markers.includes("package.json"));
  });

  it("requires explicit consent and rejects unsupported hosts", async () => {
    await assert.rejects(discoverHostProjects({ hosts: ["cursor"] }), /明确授权/);
    await assert.rejects(discoverHostProjects({ consent: true, hosts: ["fake"] }), /受支持/);
  });

  it("tolerates malformed optional VS Code metadata fields", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "eos-discovery-malformed-"));
    const project = path.join(root, "project");
    const metadata = path.join(root, "storage.json");
    await mkdir(project);
    await writeFile(path.join(project, "package.json"), "{}");
    await writeFile(metadata, JSON.stringify({
      profileAssociations: { workspaces: { [pathToFileURL(project).href]: "default" } },
      backupWorkspaces: { folders: { unexpected: true } },
      windowsState: { openedWindows: "unexpected" }
    }));

    const result = await discoverHostProjects({
      consent: true,
      hosts: ["cursor"],
      metadataFiles: { cursor: [metadata] }
    });

    assert.equal(result.count, 1);
    assert.equal(result.projects[0].path, await realpath(project));
  });

  it("tolerates malformed optional Codex metadata fields", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "eos-discovery-codex-malformed-"));
    const project = path.join(root, "project");
    const metadata = path.join(root, "codex.json");
    await mkdir(project);
    await writeFile(path.join(project, "package.json"), "{}");
    await writeFile(metadata, JSON.stringify({
      "electron-saved-workspace-roots": "unexpected",
      "active-workspace-roots": [project],
      "thread-workspace-root-hints": [],
      "local-projects": { bad: { rootPaths: "unexpected" } }
    }));

    const result = await discoverHostProjects({
      consent: true,
      hosts: ["codex"],
      metadataFiles: { codex: [metadata] }
    });

    assert.equal(result.count, 1);
    assert.equal(result.projects[0].path, await realpath(project));
  });
});
