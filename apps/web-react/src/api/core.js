/**
 * core — 核心 API（总览、注意力、校验、Vault、技能、审查、撞墙）。
 *
 * 核心职责：
 *   - 汇总数据（summary）、注意力信号（attention）、Vault 校验与维护
 *   - 技能列表与审查历史、审查包/审查决策提交
 *   - 撞墙记录与解决、审查/撞墙审计日志
 */
import { getJson, postJson } from "./client.js";

export const fetchSummary = () => getJson("/api/summary");
export const fetchAttention = () => getJson("/api/attention");
export const fetchValidation = () => getJson("/api/validation");
export const fetchVaultMaintenance = () => getJson("/api/vault-maintenance");
export const archiveVault = () => postJson("/api/vault-archive", {});
export const fetchSkills = (limit = 24) => getJson(`/api/skills?limit=${limit}`);
export const fetchSkillReviewHistory = (skillId) =>
  getJson(`/api/skill-review-history?skillId=${encodeURIComponent(skillId)}`);

export const fetchReviewPackets = (limit = 40) => getJson(`/api/review-packets?limit=${limit}`);
export const fetchReviewDecisions = (limit = 40) => getJson(`/api/review-decisions?limit=${limit}`);
export const submitReviewDecision = (body) => postJson("/api/review-decision", body);

export const fetchWallHits = (limit = 40) => getJson(`/api/wallhits?limit=${limit}`);
export const resolveWallHit = (body) => postJson("/api/wallhit-resolution", body);

export const fetchReviewAudit = (limit = 40) => getJson(`/api/review-audit?limit=${limit}`);
export const fetchWallHitAudit = (limit = 40) => getJson(`/api/wallhit-audit?limit=${limit}`);
