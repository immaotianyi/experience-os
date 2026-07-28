/**
 * beta — Beta 反馈 API。
 *
 * 核心职责：
 *   - 提交 Beta 反馈、获取反馈列表
 *   - 导出反馈数据的下载 URL
 */
import { getJson, postJson } from "./client.js";

export const submitBetaFeedback = (body) => postJson("/api/beta-feedback", body);
export const fetchBetaFeedback = () => getJson("/api/beta-feedback");
export const betaFeedbackExportUrl = () => "/api/beta-feedback/export";
