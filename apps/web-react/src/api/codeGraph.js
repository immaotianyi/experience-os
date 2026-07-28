/**
 * Code Graph API endpoints — 方案C integration.
 */
import { getJson, postJson } from "./client.js";

export const fetchCodeGraphPatterns = (projectId, { patternType, limit, signal } = {}) => {
  const params = new URLSearchParams({ projectId });
  if (patternType) params.set("patternType", patternType);
  if (limit) params.set("limit", limit);
  return getJson(`/api/code-graph/patterns?${params}`, { signal });
};

export const ingestCodeGraph = (body) =>
  postJson("/api/code-graph/ingest", body);

export const computeBlastRadius = (body) =>
  postJson("/api/code-graph/blast-radius", body);
