import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { promoteRegisteredWorkspaceBindings } from "../src/platformEvidence.js";

function health(vaultBound = false) {
  return {
    platforms: {
      codex: {
        status: "configured",
        compatibilityLevel: 2,
        proof: {
          hostInstalled: true,
          mcpRegistered: true,
          hostConfirmed: true,
          relayConformant: true,
          vaultBound,
          eventObserved: false
        },
        details: { configuredVault: "/projects/demo/.eos/vault" }
      }
    },
    summary: {}
  };
}

const workspace = {
  id: "workspace.demo",
  name: "demo",
  workspace: "/projects/demo",
  projectId: "project.demo",
  vaultDir: "/projects/demo/.eos/vault",
  sourceHosts: ["codex"],
  status: "ready"
};

describe("promoteRegisteredWorkspaceBindings", () => {
  it("recognizes a host bound to an explicitly registered project Vault", () => {
    const result = promoteRegisteredWorkspaceBindings(health(), { workspaces: [workspace] });
    assert.equal(result.platforms.codex.status, "callable");
    assert.equal(result.platforms.codex.compatibilityLevel, 3);
    assert.equal(result.platforms.codex.proof.vaultBound, true);
    assert.equal(result.platforms.codex.details.boundWorkspace.projectId, "project.demo");
    assert.equal(result.summary.callable, 1);
  });

  it("requires a matching host assignment and Vault path", () => {
    const wrongHost = { ...workspace, sourceHosts: ["claude"] };
    const result = promoteRegisteredWorkspaceBindings(health(), { workspaces: [wrongHost] });
    assert.equal(result.platforms.codex.status, "configured");
    assert.equal(result.platforms.codex.compatibilityLevel, 2);
  });

  it("promotes to observing only after a real event exists", () => {
    const result = promoteRegisteredWorkspaceBindings(health(), {
      workspaces: [workspace],
      observations: [{ id: "event.1", host: "codex", projectId: "project.demo" }]
    });
    assert.equal(result.platforms.codex.status, "observing");
    assert.equal(result.platforms.codex.compatibilityLevel, 4);
    assert.equal(result.summary.observing, 1);
  });

  it("does not reuse an observation from another project", () => {
    const result = promoteRegisteredWorkspaceBindings(health(), {
      workspaces: [workspace],
      observations: [{ id: "event.other", host: "codex", projectId: "project.other" }]
    });
    assert.equal(result.platforms.codex.status, "callable");
    assert.equal(result.platforms.codex.compatibilityLevel, 3);
  });
});


describe("promoteRegisteredWorkspaceBindings (MCP relay hosts)", () => {
  const traeHealth = () => ({
    platforms: {
      trae: {
        status: "available",
        compatibilityLevel: 1,
        proof: {
          hostInstalled: true,
          mcpRegistered: false,
          hostConfirmed: false,
          relayConformant: false,
          vaultBound: false,
          eventObserved: false
        },
        details: { hooks: "mcp_only", configuredVault: null }
      }
    },
    summary: {}
  });

  const traeWorkspace = {
    id: "workspace.trae",
    name: "trae-demo",
    workspace: "/projects/trae-demo",
    projectId: "project.trae",
    vaultDir: "/projects/trae-demo/.eos/vault",
    sourceHosts: ["trae"],
    status: "ready"
  };

  const traeObservation = { host: "trae", projectId: "project.trae", eventName: "SessionStart" };

  it("promotes a registered MCP-only host from a token-gated observation", () => {
    const result = promoteRegisteredWorkspaceBindings(traeHealth(), {
      workspaces: [traeWorkspace],
      observations: [traeObservation]
    });
    const trae = result.platforms.trae;
    assert.equal(trae.status, "observing");
    assert.equal(trae.compatibilityLevel, 4);
    assert.equal(trae.proof.mcpRegistered, true);
    assert.equal(trae.proof.hostConfirmed, true);
    assert.equal(trae.proof.relayConformant, true);
    assert.equal(trae.details.bindingScope, "registered_workspace_mcp_relay");
    assert.equal(trae.details.boundWorkspace.projectId, "project.trae");
    assert.equal(result.summary.observing, 1);
  });

  it("leaves an MCP-only host unpromoted without observations", () => {
    const result = promoteRegisteredWorkspaceBindings(traeHealth(), { workspaces: [traeWorkspace] });
    assert.equal(result.platforms.trae.status, "available");
    assert.equal(result.platforms.trae.compatibilityLevel, 1);
    assert.equal(result.summary.observing, 0);
  });

  it("keeps hook hosts on the file-binding scope", () => {
    const result = promoteRegisteredWorkspaceBindings(health(), {
      workspaces: [workspace],
      observations: [{ host: "codex", projectId: "project.demo", eventName: "SessionStart" }]
    });
    assert.equal(result.platforms.codex.details.bindingScope, "registered_workspace");
  });
});
