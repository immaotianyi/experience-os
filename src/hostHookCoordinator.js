/** Holds short-lived reviewed Hook plans so clients cannot redirect config writes. */

import path from "node:path";
import os from "node:os";
import {
  buildHostHookPlan,
  HOST_OBSERVATION_CONFIRMATION_SCOPE,
  hostHookConfigPath,
  hostObservationTokenPath
} from "./hostHookPlan.js";
import {
  applyHostHookPlan,
  buildHostHookInstallPlan,
  buildHostHookRemovalPlan
} from "./hostHookTransaction.js";

export class HostHookCoordinator {
  constructor({ auditDir = null, secretRoot = path.join(os.homedir(), ".experience-os", "secrets") } = {}) {
    this.auditDir = auditDir;
    this.secretRoot = path.resolve(secretRoot);
    this.pendingPlans = new Map();
  }

  async previewInstall({ host, workspaceDir, consentId, captureToken, endpoint }) {
    this.pruneExpiredPlans();
    const spec = buildHostHookPlan({ host, workspaceDir, consentId, endpoint, secretRoot: this.secretRoot });
    if (spec.status !== "review_required") return spec;
    const plan = await buildHostHookInstallPlan(spec, {
      workspaceDir,
      consentId,
      captureToken,
      auditDir: this.auditDir
    });
    this.pendingPlans.set(plan.planId, plan);
    return publicPlan(plan, "请审查脱敏差异。再次明确确认后，EOS 才会合并项目级 Hook。", true);
  }

  async previewRemoval({ host, workspaceDir }) {
    this.pruneExpiredPlans();
    const plan = await buildHostHookRemovalPlan({
      host,
      workspaceDir,
      configPath: hostHookConfigPath(host, workspaceDir),
      secretRoot: this.secretRoot,
      tokenPath: hostObservationTokenPath(host, workspaceDir, this.secretRoot),
      auditDir: this.auditDir
    });
    this.pendingPlans.set(plan.planId, plan);
    const count = Object.values(plan.diffPreview.beforeEosHandlerCounts).reduce((sum, value) => sum + value, 0);
    return publicPlan(
      plan,
      count > 0 ? "请审查 EOS Hook 定向移除范围；其他宿主设置与 Hook 将保留。" : "当前配置中没有检测到 EOS Hook。",
      count > 0
    );
  }

  async apply(planId, { host, operation, approved = false, confirmedScope = null } = {}) {
    this.pruneExpiredPlans();
    const plan = this.pendingPlans.get(planId);
    if (!plan) throw new Error("Host Hook plan is missing, expired, or already used; build a new plan");
    if (plan.host !== host || plan.operation !== operation) throw new Error("Host Hook plan does not match the requested host or operation");
    if (!approved || confirmedScope !== HOST_OBSERVATION_CONFIRMATION_SCOPE) {
      throw new Error("Explicit second confirmation of metadata-only operational status scope is required");
    }
    this.pendingPlans.delete(planId);
    const receipt = await applyHostHookPlan(plan, {
      approved: true,
      confirmedScope
    });
    return {
      ...receipt,
      message: receipt.status === "installed_pending_host_confirmation"
        ? hostConfirmationMessage(host)
        : receipt.status === "removed"
          ? "EOS Hook 已定向移除；其他宿主设置与 Hook 保持不变。"
          : "Hook 结构验证失败；EOS 已按并发保护规则处理回滚。"
    };
  }

  getPendingPlan(planId) {
    return this.pendingPlans.get(planId) || null;
  }

  pruneExpiredPlans(now = Date.now()) {
    for (const [planId, plan] of this.pendingPlans) {
      if (Date.parse(plan.expiresAt) <= now) this.pendingPlans.delete(planId);
    }
  }
}

function publicPlan(plan, message, canApply) {
  return {
    schemaVersion: plan.schemaVersion,
    planId: plan.planId,
    operation: plan.operation,
    host: plan.host,
    status: "second_confirmation_required",
    message,
    canApply,
    writesConfig: false,
    configPath: plan.configPath,
    expiresAt: plan.expiresAt,
    diffPreview: plan.diffPreview,
    steps: plan.steps
  };
}

function hostConfirmationMessage(host) {
  if (host === "codex") {
    return "Hook 结构已验证。请在 Codex 使用 /hooks 审查并信任该项目 Hook；收到首个事件前不升级为 L4。";
  }
  if (host === "cursor") {
    return "Hook 结构已验证。Cursor 会自动重载 .cursor/hooks.json；收到首个事件前不升级为 L4。";
  }
  return "Hook 结构已验证。请重新进入或恢复 Claude Code 项目会话；收到首个事件前不升级为 L4。";
}
