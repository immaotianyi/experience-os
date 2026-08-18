import path from "node:path";

/**
 * A desktop control-plane Vault may differ from the project Vault configured
 * in an AI host. Promote the host only when that configured Vault is present
 * in the explicit workspace registry for the same host.
 *
 * MCP-only hosts (TRAE-style) keep their MCP registration inside their own
 * UI, so no public config file can prove it. For those hosts a token-gated
 * observation is the binding proof: only a host that actually spawned the
 * consented relay can produce one.
 */
export function promoteRegisteredWorkspaceBindings(health, {
  workspaces = [],
  observedHosts = [],
  observations = []
} = {}) {
  const next = structuredClone(health);
  const observed = new Set(observedHosts.map((host) => String(host).toLowerCase()));

  for (const [host, result] of Object.entries(next.platforms || {})) {
    const configuredVault = result?.details?.configuredVault;
    const mcpOnly = result?.details?.hooks === "mcp_only";
    let relayEvidence = false;

    let boundWorkspace = workspaces.find((workspace) =>
      workspace?.status === "ready"
      && Array.isArray(workspace.sourceHosts)
      && workspace.sourceHosts.includes(host)
      && samePath(workspace.vaultDir, configuredVault)
    );

    if (mcpOnly) {
      const observedProjectIds = new Set(
        observations
          .filter((event) => event?.host === host && event?.projectId)
          .map((event) => event.projectId)
      );
      if (observedProjectIds.size > 0) {
        if (!boundWorkspace) {
          boundWorkspace = workspaces.find((workspace) =>
            workspace?.status === "ready"
            && Array.isArray(workspace.sourceHosts)
            && workspace.sourceHosts.includes(host)
            && observedProjectIds.has(workspace.projectId)
          ) || null;
        }
        relayEvidence = Boolean(boundWorkspace);
      }
    }

    if (!boundWorkspace) continue;

    if (relayEvidence) {
      result.proof.mcpRegistered = true;
      result.proof.hostConfirmed = true;
      result.proof.relayConformant = true;
    }
    const callable = result.proof?.mcpRegistered
      && result.proof?.hostConfirmed
      && result.proof?.relayConformant;
    if (!callable) continue;

    const eventObserved = observations.length > 0
      ? relayEvidence
        || observations.some((event) => event?.host === host && event?.projectId === boundWorkspace.projectId)
      : observed.has(host);
    result.proof.vaultBound = true;
    result.proof.eventObserved = eventObserved;
    result.status = eventObserved ? "observing" : "callable";
    result.compatibilityLevel = eventObserved ? 4 : 3;
    result.details.bindingScope = relayEvidence ? "registered_workspace_mcp_relay" : "registered_workspace";
    result.details.boundWorkspace = {
      id: boundWorkspace.id,
      name: boundWorkspace.name,
      workspace: boundWorkspace.workspace,
      projectId: boundWorkspace.projectId,
      vaultDir: boundWorkspace.vaultDir
    };
  }

  const results = Object.values(next.platforms || {});
  next.summary = {
    total: results.length,
    installed: results.filter((result) => result.proof?.hostInstalled).length,
    configured: results.filter((result) => result.proof?.mcpRegistered).length,
    callable: results.filter((result) => result.compatibilityLevel >= 3).length,
    observing: results.filter((result) => result.compatibilityLevel >= 4).length,
    errors: results.filter((result) => result.status === "error").length
  };
  return next;
}

function samePath(left, right) {
  if (!left || !right) return false;
  return path.resolve(left) === path.resolve(right);
}
