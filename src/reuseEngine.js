import { createReuseContext } from "./domain.js";
import { slug, unique } from "./utils.js";

function stableKey(record) {
  if (record.kind === "Rule") return `${record.kind}:${record.title}:${record.statement}`;
  if (record.kind === "Skill") return `${record.kind}:${record.name}`;
  if (record.kind === "ReflectionMemory") return `${record.kind}:${record.lesson}`;
  if (record.kind === "WorkflowPattern") return `${record.kind}:${record.name}:${record.pattern}`;
  if (record.kind === "PreferenceHypothesis") return `${record.kind}:${record.statement}`;
  if (record.kind === "ThoughtFragment") return `${record.kind}:${record.summary}`;
  if (record.kind === "CodeGraphPattern") return `${record.kind}:${record.patternType}:${record.nodeId || record.nodeIds?.join(",")}`;
  return `${record.kind}:${record.id}`;
}

function dedupeMatches(matches) {
  const seen = new Set();
  const deduped = [];
  for (const match of matches) {
    const key = stableKey(match.record);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(match);
  }
  return deduped;
}

async function searchKind(vault, query, kind, limit) {
  const matches = await vault.search({ query, kinds: [kind], limit: limit * 4 });
  return dedupeMatches(matches).slice(0, limit);
}

function ids(matches) {
  return matches.map(({ record }) => record.id);
}

function contributionCandidates(matches) {
  return matches.map(({ record, score }) => ({
    id: record.id,
    kind: record.kind,
    expectedContribution: contributionForRecord(record),
    evidenceScore: score,
    usedInRunIds: [],
    outcome: "candidate"
  }));
}

function contributionForRecord(record) {
  if (record.kind === "Skill") return `可作为下一轮自动化动作候选：${record.name}`;
  if (record.kind === "Rule") return `可约束下一轮工程判断：${record.title}`;
  if (record.kind === "ReflectionMemory") return `可避免重复撞墙：${record.lesson}`;
  if (record.kind === "WorkflowPattern") return `可复用工作流形态：${record.name}`;
  if (record.kind === "PreferenceHypothesis") return `可作为待验证的人类偏好：${record.statement}`;
  if (record.kind === "ThoughtFragment") return `可作为思想源证据：${record.summary}`;
  if (record.kind === "CodeGraphPattern") return `代码结构模式（${record.patternType}）：${record.description}`;
  return "可作为下一轮上下文候选资产";
}

export async function buildReuseContext({ vault, projectId, query }) {
  const [
    ruleMatches,
    skillMatches,
    reflectionMatches,
    workflowMatches,
    preferenceMatches,
    thoughtMatches,
    codeGraphMatches
  ] = await Promise.all([
    searchKind(vault, query, "Rule", 3),
    searchKind(vault, query, "Skill", 3),
    searchKind(vault, query, "ReflectionMemory", 3),
    searchKind(vault, query, "WorkflowPattern", 3),
    searchKind(vault, query, "PreferenceHypothesis", 2),
    searchKind(vault, query, "ThoughtFragment", 2),
    searchKind(vault, query, "CodeGraphPattern", 3)
  ]);

  const matches = [
    ...skillMatches,
    ...ruleMatches,
    ...reflectionMatches,
    ...workflowMatches,
    ...preferenceMatches,
    ...thoughtMatches,
    ...codeGraphMatches
  ];

  const matchedRecordIds = matches.map(({ record, score }) => ({
    id: record.id,
    kind: record.kind,
    score
  }));

  const recommendedRuleIds = ids(ruleMatches);
  const recommendedSkillIds = ids(skillMatches);
  const recommendedReflectionIds = ids(reflectionMatches);
  const recommendedWorkflowIds = ids(workflowMatches);
  const preferenceIds = ids(preferenceMatches);
  const thoughtIds = ids(thoughtMatches);
  const codeGraphIds = ids(codeGraphMatches);

  return createReuseContext({
    id: `reuse.${slug(projectId)}.${Date.now()}`,
    projectId,
    query,
    matchedRecordIds,
    recommendedRuleIds: unique(recommendedRuleIds),
    recommendedSkillIds: unique(recommendedSkillIds),
    recommendedReflectionIds: unique(recommendedReflectionIds),
    recommendedWorkflowIds: unique(recommendedWorkflowIds),
    contributionCandidates: contributionCandidates(matches),
    summary: [
      `查询: ${query}`,
      `匹配记录: ${matchedRecordIds.length}`,
      `推荐规则: ${unique(recommendedRuleIds).length}`,
      `推荐 Skill: ${unique(recommendedSkillIds).length}`,
      `推荐反思: ${unique(recommendedReflectionIds).length}`,
      `推荐工作流: ${unique(recommendedWorkflowIds).length}`,
      `相关偏好假设: ${preferenceIds.length}`,
      `相关思想片段: ${thoughtIds.length}`,
      `代码结构模式: ${codeGraphIds.length}`
    ].join("\n")
  });
}
