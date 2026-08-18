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

const PARTICIPANT_KEY = "eos.beta.participant-id";

/**
 * Keep one anonymous participant id per browser profile so first-impression
 * and after-trying reports can be related without collecting an identity.
 */
export function getOrCreateBetaParticipantId(
  storage = globalThis.localStorage,
  createId = () => globalThis.crypto.randomUUID()
) {
  try {
    const existing = storage?.getItem(PARTICIPANT_KEY);
    if (typeof existing === "string" && existing.startsWith("anonymous.") && existing.length <= 80) {
      return existing;
    }
  } catch {
    // Private browsing or storage denial still permits an ephemeral report.
  }

  const id = `anonymous.${createId()}`;
  try {
    storage?.setItem(PARTICIPANT_KEY, id);
  } catch {
    // The id remains valid for the current page even when persistence is denied.
  }
  return id;
}
