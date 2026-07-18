/**
 * Quality API endpoints.
 */
import { getJson, postJson } from "./client.js";

export const fetchLeaderboard = (limit = 10) =>
  getJson(`/api/quality/leaderboard?limit=${limit}`);

export const fetchQualityReport = (skillId) =>
  getJson(`/api/quality/report?skillId=${encodeURIComponent(skillId)}`);

export const fetchRatings = (skillId) =>
  getJson(`/api/quality/ratings?skillId=${encodeURIComponent(skillId)}`);

export const submitRating = (body) => postJson("/api/quality/rate", body);

export const autoFlagLowQuality = () => postJson("/api/quality/auto-flag", {});
