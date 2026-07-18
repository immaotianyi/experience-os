import { STATES, nowIso } from "./domain.js";

const TRANSITIONS = Object.freeze({
  [STATES.IDLE]: [STATES.COLLABORATING],
  [STATES.COLLABORATING]: [STATES.DIVERGING],
  [STATES.DIVERGING]: [STATES.CANDIDATE_EXTRACTED],
  [STATES.CANDIDATE_EXTRACTED]: [STATES.PRODUCTION_VALIDATING],
  [STATES.PRODUCTION_VALIDATING]: [STATES.WALL_HIT, STATES.ARTIFACT_CREATED],
  [STATES.WALL_HIT]: [STATES.COLLABORATING, STATES.PRODUCTION_VALIDATING],
  [STATES.ARTIFACT_CREATED]: [STATES.HUMAN_REVIEW],
  [STATES.HUMAN_REVIEW]: [STATES.EXPERIENCE_EXTRACTING],
  [STATES.EXPERIENCE_EXTRACTING]: [STATES.ASSET_STORED],
  [STATES.ASSET_STORED]: [STATES.REUSE_READY],
  [STATES.REUSE_READY]: [STATES.COLLABORATING]
});

export function transition(project, nextState, reason) {
  const allowed = TRANSITIONS[project.state] ?? [];
  if (!allowed.includes(nextState)) {
    throw new Error(`Invalid transition ${project.state} -> ${nextState}`);
  }
  return {
    ...project,
    state: nextState,
    updatedAt: nowIso(),
    lastTransition: {
      from: project.state,
      to: nextState,
      reason,
      at: nowIso()
    }
  };
}
