/**
 * Server-side coordinator for reviewed host connection changes.
 *
 * The browser receives only a short-lived opaque plan id and a redacted diff.
 * The reviewed path and desired config remain in this process, so apply cannot
 * be redirected by changing the request body in developer tools.
 */

import { buildHostConnectionPlan, applyHostConnectionPlan } from "./hostConnectionTransaction.js";
import { detectPlatform, tryStartPlatform } from "./eosPlatformAdapter.js";

export class HostConnectionCoordinator {
  constructor({
    auditDir = null,
    platformPlanner = tryStartPlatform,
    platformDetector = detectPlatform,
    planBuilder = buildHostConnectionPlan,
    planApplier = applyHostConnectionPlan
  } = {}) {
    this.auditDir = auditDir;
    this.platformPlanner = platformPlanner;
    this.platformDetector = platformDetector;
    this.planBuilder = planBuilder;
    this.planApplier = planApplier;
    this.pendingPlans = new Map();
  }

  async preview(target, options = {}) {
    this.pruneExpiredPlans();
    const health = await this.platformDetector(target, options);
    const connection = await this.platformPlanner(target, options);

    if (!health.proof?.hostInstalled) {
      return {
        ...connection,
        canApply: false,
        action: "install_host_first",
        message: "EOS 未检测到该宿主。请先安装宿主，再生成连接计划。"
      };
    }

    if (connection.mode !== "json") {
      return {
        ...connection,
        canApply: false,
        action: "manual_configuration_required"
      };
    }

    const serverKey = connection.config?.servers ? "servers" : "mcpServers";
    const desiredServer = connection.config?.[serverKey]?.["experience-os"];
    const plan = await this.planBuilder({
      target,
      configPath: connection.configPath,
      desiredServer,
      serverName: "experience-os",
      serverKey,
      auditDir: this.auditDir
    });

    this.pendingPlans.set(plan.planId, {
      plan,
      workspaceDir: options.workspaceDir,
      vaultDir: options.vaultDir
    });

    return {
      started: false,
      canApply: true,
      action: "human_approval_required",
      mode: "transaction",
      message: "请审查目标文件与 EOS 专属变更。只有明确批准后才会写入。",
      planId: plan.planId,
      target,
      configPath: plan.configPath,
      expiresAt: plan.expiresAt,
      diffPreview: plan.diffPreview,
      steps: plan.steps
    };
  }

  async apply(planId, { approved = false, target = null } = {}) {
    this.pruneExpiredPlans();
    if (!approved) throw new Error("Explicit human approval is required");

    const stored = this.pendingPlans.get(planId);
    if (!stored) throw new Error("Connection plan is missing, expired, or already used; build a new plan");
    if (target && stored.plan.target !== target) {
      throw new Error("Connection plan target does not match request target");
    }

    // A reviewed plan is single-use. Retrying always requires a fresh read and diff.
    this.pendingPlans.delete(planId);
    const receipt = await this.planApplier(stored.plan, {
      approved: true,
      verify: async () => this.verifyWrittenConnection(stored)
    });
    const health = receipt.status === "verified"
      ? await this.platformDetector(stored.plan.target, {
          workspaceDir: stored.workspaceDir,
          vaultDir: stored.vaultDir
        })
      : null;

    return {
      ...receipt,
      evidenceLevel: health?.compatibilityLevel ?? null,
      hostStatus: health?.status ?? null,
      hostConfirmed: health?.proof?.hostConfirmed ?? false,
      message: receipt.status === "verified"
        ? "配置与 EOS Relay 已验证。宿主提供加载回执前，兼容等级仍停留在 L2。"
        : "连接验证失败；EOS 已按并发保护规则处理回滚。"
    };
  }

  async verifyWrittenConnection(stored) {
    const result = await this.platformDetector(stored.plan.target, {
      workspaceDir: stored.workspaceDir,
      vaultDir: stored.vaultDir
    });
    const ok = result.proof?.mcpRegistered === true
      && result.proof?.vaultBound === true
      && result.proof?.relayConformant === true;
    return {
      ok,
      status: ok ? "configuration_and_relay_verified" : "configuration_or_relay_unverified",
      detail: ok
        ? "EOS registration, Vault binding, and relay handshake passed; host load is separate evidence."
        : "EOS could not verify registration, Vault binding, and relay handshake together."
    };
  }

  pruneExpiredPlans(now = Date.now()) {
    for (const [planId, stored] of this.pendingPlans) {
      if (Date.parse(stored.plan.expiresAt) <= now) this.pendingPlans.delete(planId);
    }
  }
}
