/**
 * codeGraph — 代码图谱 API（方案C 集成）。
 *
 * 核心职责：
 *   - 查询代码结构模式（枢纽/热点/循环依赖/叶子/桥接节点）
 *   - 触发代码图谱入库分析
 *   - 计算变更爆炸半径
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
