/**
 * quality — 质量评级 API。
 *
 * 核心职责：
 *   - 质量排行榜、单个技能质量报告
 *   - 评分列表查询与评分提交
 *   - 自动标记低质量技能
 */
import { getJson, postJson } from "./client.js";

export const fetchLeaderboard = (limit = 10) =>
  getJson(`/api/quality/leaderboard?limit=${limit}`);

export const fetchQualityReport = (skillId) =>
  getJson(`/api/quality/report?skillId=${encodeURIComponent(skillId)}`);

export const fetchRatings = (skillId, { signal } = {}) =>
  getJson(`/api/quality/ratings?skillId=${encodeURIComponent(skillId)}`, { signal });

export const submitRating = (body) => postJson("/api/quality/rate", body);

export const autoFlagLowQuality = () => postJson("/api/quality/auto-flag", {});
