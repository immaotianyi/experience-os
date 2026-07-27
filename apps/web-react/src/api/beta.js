/**
 * Beta feedback API — submit, list, export.
 */
import { getJson, postJson } from "./client.js";

export const submitBetaFeedback = (body) => postJson("/api/beta-feedback", body);
export const fetchBetaFeedback = () => getJson("/api/beta-feedback");
export const betaFeedbackExportUrl = () => "/api/beta-feedback/export";
