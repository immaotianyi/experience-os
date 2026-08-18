/**
 * platform — 平台兼容/健康 API。
 *
 * 核心职责：
 *   - 查询各平台（VS Code、JetBrains、Web 等）的健康状态
 *   - 启动指定平台的适配服务
 */
import { getJson, postJson } from "./client.js";

export const fetchPlatformHealth = () =>
  getJson("/api/platforms");

export const startPlatform = (name, options = {}) =>
  postJson(`/api/platforms/${encodeURIComponent(name)}/start`, options);

export const previewPlatformConnection = (name, projectId) =>
  postJson(`/api/platforms/${encodeURIComponent(name)}/connection-plan`, { projectId });

export const applyPlatformConnection = (name, planId) =>
  postJson(`/api/platforms/${encodeURIComponent(name)}/connection-apply`, {
    planId,
    approved: true
  });

export const approveHostObservation = ({ projectId, host }) =>
  postJson("/api/host-observation-consents", {
    projectId,
    host,
    approvedBy: "local_owner",
    metadataOnlyAcknowledged: true
  });

export const previewHostHookPlan = (name, consentId, captureToken) =>
  postJson(`/api/platforms/${encodeURIComponent(name)}/hook-plan`, { consentId, captureToken });

export const applyHostHookPlan = (name, planId) =>
  postJson(`/api/platforms/${encodeURIComponent(name)}/hook-apply`, {
    planId,
    approved: true,
    confirmedScope: "metadata_only_operational_status"
  });

export const previewHostHookRemoval = (name, projectId) =>
  postJson(`/api/platforms/${encodeURIComponent(name)}/hook-remove-plan`, { projectId });

export const applyHostHookRemoval = (name, planId, projectId) =>
  postJson(`/api/platforms/${encodeURIComponent(name)}/hook-remove-apply`, {
    planId,
    projectId,
    approved: true,
    confirmedScope: "metadata_only_operational_status"
  });
