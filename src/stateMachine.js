/**
 * State Machine — Project 的单项目状态机。
 *
 * 做什么：
 *   定义 Project 在 EOS 2.0 协作管道中的合法状态转换，并在 transition() 时
 *   原子地更新 state、updatedAt、lastTransition（from/to/reason/at）。
 *
 * 核心抽象：
 *   - 一个 Project 在任意时刻处于且仅处于一个 state。
 *   - 转换是显式的、受约束的：只能从 TRANSITIONS 中声明的 from-state 转换到 to-state。
 *     不允许"跳步"（例如不能从 IDLE 直接到 ARTIFACT_CREATED）。
 *   - 状态图是一个带环的有向图：主管道沿 IDLE→COLLABORATING→...→REUSE_READY 推进，
 *     WALL_HIT 可以回到 COLLABORATING 重试，REUSE_READY 循环回 COLLABORATING 开启下一轮。
 *
 * 管道阶段（顺序）：
 *   IDLE                 空闲，等待用户启动项目
 *   COLLABORATING        协作中：人+AI 正在探索问题、产出想法、对话
 *   DIVERGING            发散：产生多个候选方向/思路
 *   CANDIDATE_EXTRACTED  候选已提取：从发散中收敛出可验证的候选方案
 *   PRODUCTION_VALIDATING 生产验证：在真实代码/环境中验证候选方案
 *     ├─ WALL_HIT          撞墙：验证失败，记录 wallhit，可回 COLLABORATING 重新探索或继续验证
 *     └─ ARTIFACT_CREATED  产物已创建：验证通过，有了可交付的产物
 *   HUMAN_REVIEW         人工审查：等待人对产物做 review（approve/reject/request changes）
 *   EXPERIENCE_EXTRACTING 经验抽取：从产物和 review 中抽取可复用的经验
 *   ASSET_STORED         资产入库：经验已打包为 ExperienceAsset 存入 Vault
 *   REUSE_READY          可复用：资产已就绪，可供未来项目检索
 *     └─ 回到 COLLABORATING，开始下一轮
 *
 * 不变量：
 *   1. transition() 是纯函数：不修改入参 project，返回一个新对象。
 *   2. 非法转换直接 throw Error（不静默忽略），调用方必须处理或让其冒泡到全局错误处理。
 *   3. 每次转换都会更新 updatedAt 和 lastTransition，审计链不断。
 *
 * 不做什么：
 *   - 不持久化状态（调用方负责 save 到 Vault）。
 *   - 不触发副作用（不发通知、不调引擎），副作用由 projectEngine 在状态变化时编排。
 *   - 不校验 project 的其他字段，只关心 state 转换合法性。
 *
 * 与 3.0 的关系：
 *   Project.status（planning/active/...）是 3.0 生命周期状态（粗粒度，面向用户），
 *   Project.state（本文件的 STATES）是 2.0 管道状态（细粒度，面向引擎调度）。
 *   两者共存、不互斥：一个 active 的项目在管道中可以处于任何 state。
 */

import { STATES, nowIso } from "./domain.js";

/**
 * 合法状态转换表。
 * 键是 from-state，值是允许的 to-state 数组。
 * 修改此表即修改管道的合法流程——任何状态变化都必须在这里登记。
 *
 * 注意：
 *   - WALL_HIT 有两个出口：回 COLLABORATING（换思路）或继续 PRODUCTION_VALIDATING（再试）。
 *   - REUSE_READY 回 COLLABORATING 形成闭环——项目不会"结束"，而是持续沉淀经验。
 */
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

/**
 * 尝试把 project 从当前 state 转换到 nextState。
 *
 * @param {object} project - 当前 project 对象（必须含 state 字段）
 * @param {string} nextState - 目标 state（必须是 STATES 中的值）
 * @param {string} reason - 转换原因（人类可读，用于审计和 UI 展示），例：
 *   "user started session" / "validation failed with error ENOENT" / "human approved"
 * @returns {object} 新的 project 对象（浅拷贝 + state/updatedAt/lastTransition 更新）
 * @throws {Error} 当转换非法时（当前 state 不允许转到 nextState）
 */
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
