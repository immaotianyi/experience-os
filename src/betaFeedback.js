/**
 * Beta Feedback — Beta 测试反馈收集与入库。
 *
 * 做什么：
 *   submitBetaFeedback() 接收 Beta 参与者提交的反馈输入，执行两层校验（输入层硬校验 +
 *   validateBetaFeedback 领域校验），通过后构造 BetaFeedback 记录写入 Vault。反馈覆盖
 *   三个阶段（first_impression / after_trying / blocked），收集有用性、清晰度评分（1-5）、
 *   是否愿意再次使用（yes/no/unsure）、帮助点、阻塞点，以及可选的联系方式（需参与者
 *   显式同意联系 consent）。
 *
 * 核心抽象：
 *   - 两层校验：第一层（submitBetaFeedback 入口）做强制约束校验——必须同意 consent、
 *     stage/usefulness/clarity/wouldUseAgain 枚举合法、blocked 阶段必须填写阻塞原因；
 *     非法输入直接 throw Error，不创建任何记录。第二层用 validateBetaFeedback（来自
 *     validate.js）校验构造出的 BetaFeedback 对象结构，作为入库前的形状兜底。
 *   - boundedText() 对自由文本字段（helped/blocked/contact/participantId）做长度截断，
 *     防止单条反馈过长污染 Vault。
 *   - 匿名参与者自动生成 anonymous.<uuid> 作为 participantId，不强制要求身份信息。
 *   - contact 字段遵守"同意才收集"原则：contactConsent !== true 时 contact 强制写 null，
 *     即使调用方传入了联系方式也不存储。
 *
 * 关键不变量：
 *   1. consent 必须为 true，否则不接受反馈（GDPR/隐私最小化原则）。
 *   2. stage === "blocked" 时 blocked 字段为必填（截断后非空），因为阻塞反馈是 Beta
 *      阶段最有价值的信号，不能空泛提交。
 *   3. 所有数字评分（usefulness/clarity）必须是 1-5 的整数，不接受小数或越界值。
 *   4. 写入 Vault 的 BetaFeedback 一定通过 validateBetaFeedback 结构校验；校验失败
 *      抛出的 Error 包含所有 issues（以 "; " 连接），不会写入半成品。
 *
 * 设计取舍：
 *   - 入口校验直接 throw Error（返回 issues 数组），因为 Beta 反馈提交是面向 API/UI
 *     的操作，非法输入应立即 400 反馈，不适合走 WallHit 管道。
 *   - 不做反馈去重（同一 participant 可多次提交不同 stage 的反馈），因为 first_impression
 *     和 after_trying 是同一用户不同时点的反馈，语义不同。
 *   - 使用 randomUUID() 作为 feedback id 而非 slug+时间戳，因为反馈与 Project 解耦，
 *     不需要可读的 slug；UUID 也避免了并发提交时的 id 冲突。
 *
 * 不做什么：
 *   - 不做反馈的聚合分析/统计（平均分、NPS 等），只负责收集和存储。
 *   - 不发送确认邮件/通知，入库即完成。
 *   - 不做反垃圾/速率限制，假定 Beta 入口受控。
 *   - 不支持反馈的修改/删除（Beta 反馈是审计性记录，不允许编辑）。
 */
import { randomUUID } from "node:crypto";
import { createBetaFeedback } from "./domain.js";
import { validateBetaFeedback } from "./validate.js";

const STAGES = new Set(["first_impression", "after_trying", "blocked"]);
const AGAIN = new Set(["yes", "no", "unsure"]);

function boundedText(value, max) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function submitBetaFeedback(vault, input) {
  if (input?.consent !== true) throw new Error("feedback consent is required");
  if (!STAGES.has(input.stage)) throw new Error("feedback stage is invalid");
  if (!Number.isInteger(input.usefulness) || input.usefulness < 1 || input.usefulness > 5) throw new Error("usefulness must be an integer from 1 to 5");
  if (!Number.isInteger(input.clarity) || input.clarity < 1 || input.clarity > 5) throw new Error("clarity must be an integer from 1 to 5");
  if (!AGAIN.has(input.wouldUseAgain)) throw new Error("wouldUseAgain is invalid");
  if (input.stage === "blocked" && !boundedText(input.blocked, 1000)) {
    throw new Error("blocked field is required when stage is 'blocked'");
  }

  const feedback = createBetaFeedback({
    id: `beta_feedback.${randomUUID()}`,
    participantId: boundedText(input.participantId, 80) || `anonymous.${randomUUID()}`,
    stage: input.stage,
    usefulness: input.usefulness,
    clarity: input.clarity,
    wouldUseAgain: input.wouldUseAgain,
    helped: boundedText(input.helped, 1000),
    blocked: boundedText(input.blocked, 1000),
    contact: input.contactConsent === true ? boundedText(input.contact, 200) || null : null
  });
  const issues = validateBetaFeedback(feedback);
  if (issues.length) throw new Error(issues.join("; "));
  await vault.save(feedback);
  return feedback;
}
