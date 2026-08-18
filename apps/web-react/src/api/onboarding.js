import { getJson, postJson } from "./client.js";

export const fetchAuthStatus = () => getJson("/api/auth/status");
export const requestAuthCode = (body) => postJson("/api/auth/request-code", body);
export const verifyAuthCode = (body) => postJson("/api/auth/verify-code", body);
export const logout = () => postJson("/api/auth/logout");

export const scanHosts = () =>
  postJson("/api/onboarding/scan-hosts", { consent: true });

export const discoverProjects = (hosts) =>
  postJson("/api/onboarding/discover-projects", { consent: true, hosts });

export const inspectManualProject = (path) =>
  postJson("/api/onboarding/inspect-manual", { consent: true, path });

export const fetchWorkspaces = () => getJson("/api/workspaces");
export const fetchDiscoveryStatus = () => getJson("/api/discovery");

export const scanDiscovery = (hosts) =>
  postJson("/api/discovery/scan", { consent: true, hosts });

export const revokeDiscovery = () =>
  postJson("/api/discovery/revoke", { confirm: true });

export const connectWorkspaces = (projects, confirmWrites) =>
  postJson("/api/workspaces/connect", {
    consent: true,
    confirmWrites,
    projects
  });

export const disconnectWorkspace = (path) =>
  postJson("/api/workspaces/disconnect", { path, confirm: true });
