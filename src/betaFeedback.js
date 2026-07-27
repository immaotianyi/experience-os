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
