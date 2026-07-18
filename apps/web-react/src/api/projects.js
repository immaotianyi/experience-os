import { getJson, postJson } from "./client.js";

export const fetchProjects = () => getJson("/api/projects");
export const fetchProjectTimeline = (projectId) =>
  getJson(`/api/project/timeline?id=${encodeURIComponent(projectId)}`);
export const createProject = (body) => postJson("/api/projects", body);
export const createEvidence = (body) => postJson("/api/evidence", body);
export const createExperienceReceipt = (body) => postJson("/api/experience-receipts", body);
export const fetchExperienceReceiptDrafts = (projectId) => getJson(`/api/experience-receipt-drafts?projectId=${encodeURIComponent(projectId)}`);
export const createExperienceReceiptDraft = (body) => postJson("/api/experience-receipt-drafts", body);
export const acceptExperienceReceiptDraft = (body) => postJson("/api/experience-receipt-drafts/accept", body);
export const rejectExperienceReceiptDraft = (body) => postJson("/api/experience-receipt-drafts/reject", body);
export const createDecision = (body) => postJson("/api/decisions", body);
export const createOutcome = (body) => postJson("/api/outcomes", body);
export const captureRelayEvent = (body) => postJson("/api/relay/events", body);
export const captureWorkCheckpoint = (body) => postJson("/api/work-checkpoints", body);
export const fetchReadiness = (projectId) => getJson(`/api/project/readiness?id=${encodeURIComponent(projectId)}`);
export const promoteExperienceAsset = (body) => postJson("/api/experience-assets", body);
export const fetchExperienceAssets = (projectId) => getJson(`/api/experience-assets?projectId=${encodeURIComponent(projectId)}`);
export const fetchReuseSuggestions = (projectId) => getJson(`/api/reuse-suggestions?projectId=${encodeURIComponent(projectId)}`);
export const recordReuseFeedback = (body) => postJson("/api/reuse-feedback", body);
