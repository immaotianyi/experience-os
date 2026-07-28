/**
 * Reuse Engine — 经验复用检索引擎，按资产类型配额从 Vault 中检索并组装 ReuseContext。
 *
 * 做什么：
 *   buildReuseContext() 接收 query 和 projectId，并行在 Vault 中按资产类型（kind）搜索
 *   相关历史记录，按配额截断后去重，组装成一个 ReuseContext 对象返回。ReuseContext 包含
 *   匹配到的记录 ID 列表、各类型的推荐 ID 列表、contributionCandidates（带预期贡献
 *   描述的候选项），以及一个人类可读的摘要。它是"下一轮协作"注入历史经验的唯一入口，
 *   被 pipeline/selfIterationEngine/projectEngine 消费。
 *
 * 核心抽象：
 *   - 按类型配额检索（searchKind）：每种资产类型独立搜索、独立截断，避免单一类型
 *     （尤其是高频的 Rule/ReflectionMemory）淹没上下文窗口。
 *   - 稳定键去重（stableKey + dedupeMatches）：同一 vault.search 可能因不同关键词
 *     命中同一条记录的不同字段，去重在截断之前完成，确保配额不会被重复记录浪费。
 *   - contributionCandidates：给每条匹配附上 expectedContribution 文本，告诉下游
 *     "这条记录能贡献什么"，并预留 usedInRunIds/outcome 字段供 selfIterationEngine
 *     回填实际使用情况，形成检索-使用的反馈闭环。
 *
 * 配额策略（每个 kind 的返回上限）：
 *   Rule ≤ 3, Skill ≤ 3, ReflectionMemory ≤ 3, WorkflowPattern ≤ 3,
 *   CodeGraphPattern ≤ 3, PreferenceHypothesis ≤ 2, ThoughtFragment ≤ 2。
 *   搜索时内部用 limit*4 扩大召回再截断，以补偿去重损耗。
 *
 * 关键不变量：
 *   1. 去重基于语义键（kind + 核心字段），不是基于 id；同一条记录即使被多次搜索命中
 *      也只会出现在最终结果中一次。
 *   2. 返回的 ReuseContext 中 recommended*Ids 列表经 unique() 去重，保证下游不会
 *      拿到重复 ID。
 *   3. searchKind 扩大 4 倍召回是为了让去重后仍能达到 limit 条；但最终结果一定 ≤ limit。
 *   4. 引擎只读 Vault，不写入任何记录（ReuseContext 的持久化由调用方负责）。
 *
 * 设计取舍：
 *   - 采用按类型硬编码配额而非按总 token 预算动态分配，因为 2.0/3.0 阶段资产类型
 *     有限、可枚举，硬配额简单可预测；动态预算留待上下文窗口管理模块实现。
 *   - 去重键选择各 kind 的"语义身份字段"（Rule 用 title+statement、Skill 用 name、
 *     ReflectionMemory 用 lesson），而非 id，因为同一经验可能在多次迭代中产生不同 id
 *     但内容等价；按语义去重才能真正避免重复经验灌入上下文。
 *   - PreferenceHypothesis 和 ThoughtFragment 配额更低（2 条），因为它们是"原始/待
 *     验证"材料，过多会稀释已沉淀的规则和技能。
 *
 * 不做什么：
 *   - 不做语义向量检索或 embedding 相似度，当前依赖 Vault 的原生 search（关键字/索引）。
 *   - 不对结果做相关性重排序（RRF/交叉编码等），按 Vault 返回的 score 顺序保留。
 *   - 不自动加载匹配记录的完整内容到上下文，只返回 ID 列表；内容加载由调用方按需进行。
 *   - 不更新 ReuseContext 的 contributionCandidates.outcome（使用反馈由
 *     selfIterationEngine.updateReuseContextOutcomes 回填）。
 */
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
