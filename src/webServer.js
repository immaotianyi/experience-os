/**
 * Web Server — Experience OS 的本地 HTTP 入口。
 *
 * 做什么：
 *   启动一个绑定到 127.0.0.1 的 Node 原生 HTTP 服务器（零 Web 框架依赖），同时承载：
 *     1. React 前端静态资源（apps/web 或 apps/web-react 的构建产物）
 *     2. 70+ 个 REST API 端点，是前端/MCP/tray/codex relay 访问 Vault 和各引擎的唯一网络入口
 *   所有 API 端点都直接编排底层引擎（projectEngine / reviewEngine / marketplace 等），
 *   不引入额外的服务层——本文件就是控制器层。
 *
 * 架构：
 *   - 单进程、单实例：启动时创建一个 GitVault 实例和一个 LLM Adapter 实例，所有请求共享。
 *   - 无框架路由：通过 url.pathname 字符串匹配分发（见 handleApi 内的 if-else 链）。
 *     之所以不用 Express/Koa，是为了零依赖 + 冷启动快 + 攻击面小。
 *   - 中间件层：createServer 回调在进入 handleApi 之前依次执行：
 *       a. CORS 头（Access-Control-Allow-Origin: *，因绑定 127.0.0.1 仅限本机）
 *       b. JSON body 解析（readJsonBody）
 *       c. 鉴权上下文（contextFromRequest 从 x-eos-identity 头解析身份和角色）
 *       d. 全局异常兜底（safeErrorMessage 过滤敏感信息后返回 400/500）
 *
 * API 端点分组（按业务域）：
 *   健康/平台：/api/health, /api/platforms, /api/platforms/:name/start|connection-plan|connection-apply|diagnose
 *   Beta反馈： /api/beta-feedback (GET/POST), /api/beta-feedback/export
 *   审查：    /api/review-decisions, /api/review-audit, /api/skill-review-history
 *   Vault：   /api/vault-archive, /api/vault-maintenance, /api/validation, /api/summary,
 *             /api/git/history, /api/git/stats
 *   LLM：     /api/llm/status
 *   注意力：  /api/attention
 *   项目：    /api/projects (GET/POST), /api/project (GET/POST), /api/project/timeline,
 *             /api/project/readiness, /api/project/trial-evidence
 *   捕获许可：/api/capture-permits, /api/capture-permits/approve, /api/capture-permits/reject
 *   复用：    /api/reuse-suggestions, /api/reuse-feedback, /api/experience-reuse-trials,
 *             /api/experience-reuse-trials/complete
 *   证据/收据：/api/evidence, /api/experience-receipt-drafts, /api/experience-receipt-drafts/accept|reject|defer|resume,
 *             /api/experience-receipts, /api/decisions, /api/outcomes
 *   Relay：   /api/relay/events (POST/GET) — Codex MCP relay 的事件上报端点
 *   Hook观测：/api/host-observation-consents, /api/host-observations
 *   检查点：  /api/work-checkpoints (GET/POST)
 *   资产：    /api/experience-assets (GET/POST)
 *   技能市场：/api/marketplace/* (search/publish/unpublish/suspend/listing/versions/download/stats)
 *   质量：    /api/quality/* (rate/ratings/report/flag/leaderboard)
 *   交易：    /api/transactions/*, /api/revenue/*, /api/pricing/*
 *   团队审查：/api/team-review/* (assign/vote/discuss/summary/finalize)
 *   技能注册：/api/skill-registry, /api/skill-registry/import, /api/skills/metadata
 *   MCP导出： /api/mcp/export, /api/mcp/export-all, /api/mcp/list
 *   代码图谱：/api/code-graph/* (ingest/parse-project/patterns/blast-radius)
 *   撞墙解决：/api/wallhit-resolutions, /api/wallhit-audit
 *
 * 关键不变量：
 *   1. 本地模式默认仅监听 127.0.0.1，把回环边界视为可信单用户环境。
 *   2. 非本地部署通过 x-eos-identity 传递可信身份；高风险操作要求 admin。
 *      普通记录操作继续由 accessControl 按所有权与可见性检查。
 *   3. 错误响应统一走 safeErrorMessage，不把堆栈/文件路径/原始错误消息泄露给客户端。
 *   4. 静态文件只从 apps/web 或 apps/web-react/dist 提供，禁止路径穿越（resolve 后检查前缀）。
 *   5. Beta 反馈提交有 IP 级速率限制（betaFeedbackAttempts Map），每小时每 IP 最多 5 条。
 *
 * 环境变量：
 *   PORT               监听端口，默认 4173
 *   EOS_HOST           绑定地址，默认 127.0.0.1
 *   EOS_VAULT_DIR      Vault 根目录，默认 work/vaults；真实工作区应显式指向 <workspace>/.eos/vault
 *   EOS_ALLOW_MOCK_DRAFTS  设为 "1" 时允许 mock LLM 草稿（演示用）
 *   EOS_DEPLOYMENT_MODE  "local"（默认）、"private_beta" 或 "cloud"
 *   EOS_AUTH_DEV_OTP     仅本地开发可设为 "1"，在界面显示本机验证码
 *
 * 不做什么：
 *   - 不保存密码；开发验证码会话只存在进程内。生产身份仍由受信 OIDC/反向代理提供。
 *   - 不做请求体 schema 校验（由 validate.js 在引擎层校验）。
 *   - 不做日志框架：用 console.log/error 输出到 stdout/stderr，由 launchd/Docker 收集。
 *   - 不做 WebSocket/SSE：当前所有端点都是 HTTP request-response；实时更新靠前端轮询。
 */

import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GitVault } from "./gitVault.js";
import { createLLMAdapter } from "./llmAdapter.js";
import { buildAttentionSnapshot } from "./attentionStatus.js";
import { buildAgentStatus } from "./agentStatus.js";
import { promoteRegisteredWorkspaceBindings } from "./platformEvidence.js";
import { submitBetaFeedback } from "./betaFeedback.js";
import { applyReviewDecision } from "./reviewEngine.js";
import { validateVault } from "./validate.js";
import { archiveVaultCandidates, buildVaultMaintenancePreview } from "./vaultMaintenance.js";
import { latest, slug } from "./utils.js";
import { exportSkillAsMcpServer, exportAllStableSkills } from "./mcpExporter.js";
import { buildLocalIndex, searchIndex, importSkill, getSkillMetadata, listCategories } from "./skillRegistry.js";
import { listPresetSkills, installPresetSkills, PRESET_SCHEMA_VERSION } from "./eosPresetSkills.js";
import { assignReviewers, submitVote, addDiscussionComment, checkConfirmationStatus, finalizeTeamReview, getReviewSummary } from "./teamReviewEngine.js";
import {
  applyOwnership,
  canRead,
  canEdit,
  canReview,
  filterReadable,
  contextFromRequest,
  hasPrivilegedAccess
} from "./accessControl.js";
import {
  buildPlatformConnectionPlan,
  checkPlatformHealth,
  tryStartPlatform,
  getInstallInstructions,
  PLATFORMS
} from "./eosPlatformAdapter.js";
import { HostConnectionCoordinator } from "./hostConnectionCoordinator.js";
import { HostHookCoordinator } from "./hostHookCoordinator.js";
import { hostHookConfigPath, hostObservationTokenPath } from "./hostHookPlan.js";
import { createSessionLogWatcher } from "./eosSessionLogWatcher.js";
import { createAgentbarReader, defaultAgentbarStateDir } from "./agentbarReader.js";
import { inspectHostHookInstallation } from "./hostHookTransaction.js";
import {
  approveHostObservationConsent,
  revokeHostObservationConsent,
  recordHostObservation,
  listHostObservations,
  verifyHostObservationCaptureToken
} from "./hostObservationEngine.js";
import { AuthService } from "./authService.js";
import { discoverHostProjects, inspectManualProject } from "./onboardingDiscovery.js";
import { WorkspaceRegistry } from "./workspaceRegistry.js";
import { HostDiscoveryStore } from "./hostDiscoveryStore.js";
import { publishSkill, unpublishSkill, suspendListing, searchMarketplace, getListingDetails, listPublishedVersions, recordDownload, getMarketplaceStats } from "./marketplace.js";
import { submitRating, getRatingSummary, getSkillQualityReport, autoFlagLowQuality, getQualityLeaderboard } from "./qualityRating.js";
import { validatePricing, calculateCommission, checkTrial, computePurchaseBreakdown, verifyLicenseKey } from "./pricingEngine.js";
import { processPurchase, processTrial, refundTransaction, getTransactionHistory, getRevenueSummary, verifyBuyerLicense, getTransaction } from "./transactionLog.js";
import {
  startProject,
  updateProject,
  getProject,
  addEvidenceLink,
  listEvidenceForProject,
  writeExperienceReceipt,
  listReceiptsForProject,
  proposeExperienceReceiptDraft,
  listExperienceReceiptDrafts,
  acceptExperienceReceiptDraft,
  rejectExperienceReceiptDraft,
  deferExperienceReceiptDraft,
  resumeExperienceReceiptDraft,
  recordDecision,
  recordOutcome,
  buildProjectTimeline,
  captureCollaborationEvent,
  captureWorkCheckpoint,
  promoteExperienceAsset,
  getVerifiedExperienceSuggestions,
  recordExperienceReuseFeedback,
  startExperienceReuseTrial,
  completeExperienceReuseTrial,
  listExperienceReuseTrials,
  getProjectReadiness,
  getProjectTrialEvidence
} from "./projectEngine.js";
import { resolveVaultDir, projectRoot } from "./vaultPath.js";
import {
  listCapturePermitRequests,
  listCapturePermitActivity,
  approveCapturePermitRequest,
  rejectCapturePermitRequest
} from "./capturePermitStore.js";
import {
  ingestCodeGraphSnapshot,
  queryCodeGraphPatterns,
  computeBlastRadius,
  normalizeGraphSnapshot
} from "./eosCodeGraphAdapter.js";
import { parseProjectDependencies, resolveProjectRoot } from "./eosDependencyParser.js";
import { EOS_VERSION } from "./version.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = projectRoot;
const webDir = path.join(rootDir, "apps", "web");
// web server uses the REAL project vault by default; demo/verify scripts use work/fixtures.
// Override either with EOS_VAULT_DIR.
const vault = new GitVault(resolveVaultDir("real"));
const llm = createLLMAdapter({ maxTotalTokens: 100000 });
const port = Number(process.env.PORT ?? 4173);
const host = process.env.EOS_HOST ?? "127.0.0.1";
const mockDraftsAllowed = process.env.EOS_ALLOW_MOCK_DRAFTS === "1";
const deploymentMode = process.env.EOS_DEPLOYMENT_MODE ?? "local";
const isLocalDeployment = deploymentMode === "local";
const auth = new AuthService({
  devOtpEnabled: isLocalDeployment && process.env.EOS_AUTH_DEV_OTP === "1"
});
const workspaceRegistry = new WorkspaceRegistry();
const hostDiscoveryStore = new HostDiscoveryStore();
const hostConnectionCoordinator = new HostConnectionCoordinator({
  auditDir: path.join(path.dirname(vault.rootDir), "connection-receipts")
});
const hostHookCoordinator = new HostHookCoordinator({
  auditDir: path.join(path.dirname(vault.rootDir), "host-hook-receipts"),
  ...(process.env.EOS_SECRET_DIR ? { secretRoot: process.env.EOS_SECRET_DIR } : {})
});
const betaFeedbackAttempts = new Map();
const PLATFORM_HEALTH_CACHE_MS = 30_000;
let platformHealthCache = null;
let platformHealthPromise = null;
const WORKSPACE_EVIDENCE_CACHE_MS = 5_000;
let workspaceEvidenceCache = null;
let workspaceEvidencePromise = null;

// Periodic cleanup of expired rate-limit entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of betaFeedbackAttempts) {
    const fresh = timestamps.filter((t) => now - t < 3600_000);
    if (fresh.length === 0) {
      betaFeedbackAttempts.delete(key);
    } else if (fresh.length !== timestamps.length) {
      betaFeedbackAttempts.set(key, fresh);
    }
  }
}, 600_000).unref();

function llmRuntimeStatus() {
  return {
    adapter: llm.name,
    model: llm.defaultModel,
    mode: llm.mode,
    isLive: llm.mode === "live",
    mockDraftsAllowed,
    fallbackReason: llm.fallbackReason,
    totalUsage: llm.totalUsage,
    budgetRemaining: llm.budgetRemaining,
    maxTotalTokens: llm.maxTotalTokens
  };
}

async function cachedPlatformHealth(observedHosts = []) {
  const observedKey = [...new Set(observedHosts)].sort().join(",");
  const now = Date.now();
  if (
    platformHealthCache
    && platformHealthCache.observedKey === observedKey
    && now - platformHealthCache.updatedAt < PLATFORM_HEALTH_CACHE_MS
  ) {
    return structuredClone(platformHealthCache.value);
  }
  if (platformHealthPromise) {
    if (platformHealthPromise.observedKey === observedKey) {
      return structuredClone(await platformHealthPromise.promise);
    }
    try { await platformHealthPromise.promise; } catch { /* retry below with the requested scope */ }
    return cachedPlatformHealth(observedHosts);
  }
  const promise = checkPlatformHealth({ vaultDir: vault.rootDir, observedHosts })
    .then((value) => {
      platformHealthCache = { observedKey, updatedAt: Date.now(), value };
      return value;
    })
    .finally(() => {
      if (platformHealthPromise?.promise === promise) platformHealthPromise = null;
    });
  platformHealthPromise = { observedKey, promise };
  return structuredClone(await promise);
}

async function collectWorkspaceEvidence() {
  if (workspaceEvidenceCache && Date.now() - workspaceEvidenceCache.updatedAt < WORKSPACE_EVIDENCE_CACHE_MS) {
    return structuredClone(workspaceEvidenceCache.value);
  }
  if (workspaceEvidencePromise) return structuredClone(await workspaceEvidencePromise);

  workspaceEvidencePromise = (async () => {
    const workspaces = await workspaceRegistry.list();
    const observations = [];
    const consents = [];
    const seenVaults = new Set([path.resolve(vault.rootDir)]);
    for (const workspace of workspaces) {
      if (workspace.status !== "ready" || !workspace.vaultDir) continue;
      const vaultDir = path.resolve(workspace.vaultDir);
      if (seenVaults.has(vaultDir)) continue;
      seenVaults.add(vaultDir);
      try {
        const workspaceVault = new GitVault(vaultDir);
        const [workspaceObservations, workspaceConsents] = await Promise.all([
          workspaceVault.list("HostObservation"),
          workspaceVault.list("HostObservationConsent")
        ]);
        observations.push(...workspaceObservations);
        consents.push(...workspaceConsents.map((item) => ({ ...item, vaultDir })));
      } catch (error) {
        console.error(`[webServer] skipped workspace evidence ${workspace.name}:`, error.message);
      }
    }
    const value = { workspaces, observations, consents };
    workspaceEvidenceCache = { updatedAt: Date.now(), value };
    return value;
  })().finally(() => {
    workspaceEvidencePromise = null;
  });
  return structuredClone(await workspaceEvidencePromise);
}

// 观察器/AgentBar 读取器的凭证候选来源：主 vault + 已注册工作区聚合。
// collectWorkspaceEvidence 会跳过主 vault（去重），而 host consent 通常就批在主 vault，
// 缺少这一合并会让采集器静默拿不到凭证（resolve 返回 null，不发观察不留日志）。
async function listCollectorConsents() {
  const own = (await vault.list("HostObservationConsent"))
    .map((item) => ({ ...item, vaultDir: vault.rootDir }));
  const aggregated = (await collectWorkspaceEvidence()).consents;
  const seen = new Set(own.map((item) => item.id));
  return [...own, ...aggregated.filter((item) => !seen.has(item.id))];
}

function dedupeRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = `${record.kind || "record"}:${record.id}`;
    if (!record.id || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function clearWorkspaceEvidenceCache() {
  workspaceEvidenceCache = null;
}

async function resolveVaultScopeForProject(projectId) {
  if (typeof projectId !== "string" || !projectId.trim()) throw new Error("projectId is required");
  const localProject = await vault.load("Project", projectId);
  if (localProject) {
    return { vault, projectId, vaultDir: vault.rootDir, workspaceDir: currentWorkspaceDir(), workspace: null };
  }

  const workspaces = await workspaceRegistry.list();
  const workspace = workspaces.find((item) => item.status === "ready" && item.projectId === projectId);
  if (!workspace?.vaultDir) throw new Error("project is not registered with EOS");
  const scopedVault = new GitVault(workspace.vaultDir);
  await scopedVault.init();
  if (!(await scopedVault.load("Project", projectId))) throw new Error("registered project record is missing");
  return {
    vault: scopedVault,
    projectId,
    vaultDir: workspace.vaultDir,
    workspaceDir: workspace.workspace,
    workspace
  };
}

async function resolveVaultScopeForConsent(consentId) {
  if (typeof consentId !== "string" || !consentId.trim()) throw new Error("consentId is required");
  const localConsent = await vault.load("HostObservationConsent", consentId);
  if (localConsent) {
    return {
      vault,
      consent: localConsent,
      projectId: localConsent.projectId,
      vaultDir: vault.rootDir,
      workspaceDir: currentWorkspaceDir(),
      workspace: null
    };
  }

  const workspaces = await workspaceRegistry.list();
  const seenVaults = new Set([path.resolve(vault.rootDir)]);
  for (const workspace of workspaces) {
    if (workspace.status !== "ready" || !workspace.vaultDir) continue;
    const vaultDir = path.resolve(workspace.vaultDir);
    if (seenVaults.has(vaultDir)) continue;
    seenVaults.add(vaultDir);
    const scopedVault = new GitVault(vaultDir);
    await scopedVault.init();
    const consent = await scopedVault.load("HostObservationConsent", consentId);
    if (consent) {
      return {
        vault: scopedVault,
        consent,
        projectId: consent.projectId,
        vaultDir,
        workspaceDir: workspace.workspace,
        workspace
      };
    }
  }
  throw new Error("host observation consent not found in registered workspaces");
}

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8"
};

await vault.init();

// Global crash protection — prevents single request errors from killing the process
process.on("unhandledRejection", (reason) => {
  console.error("[webServer] unhandledRejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[webServer] uncaughtException:", err.message);
});

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, url, response);
      return;
    }

    let filePath = url.pathname === "/"
      ? path.join(webDir, "index.html")
      : path.join(webDir, path.normalize(url.pathname));

    // Use path.sep to prevent prefix-directory bypass (e.g. /web-secret)
    if (filePath !== webDir && !filePath.startsWith(webDir + path.sep)) {
      send(response, 403, "Forbidden", "text/plain; charset=utf-8");
      return;
    }

    try {
      const body = await readFile(filePath);
      send(response, 200, body, contentTypes[path.extname(filePath)] ?? "application/octet-stream");
    } catch (error) {
      if (error.code === "ENOENT") {
        // SPA fallback: serve index.html for client-side routing
        const indexPath = path.join(webDir, "index.html");
        try {
          const indexBody = await readFile(indexPath);
          send(response, 200, indexBody, contentTypes[".html"]);
        } catch {
          send(response, 404, "Not found", "text/plain; charset=utf-8");
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    const status = error.code === "ENOENT" ? 404 : (error.statusCode ?? 500);
    const body = safeErrorMessage(error);
    send(response, status, body, "text/plain; charset=utf-8");
  }
}).listen(port, host, () => {
  console.log(`Experience OS Web UI (${deploymentMode}): http://${host}:${port}`);
});

// 统一原生会话日志观察器：宿主零安装（无 Hook、无 MCP 注册）的状态监控。
// EOS_SESSION_LOG_WATCHER=0 可关闭。详见 src/eosSessionLogWatcher.js。
const sessionLogWatcher = createSessionLogWatcher({
  vaultDir: vault.rootDir,
  agentbarStateDir: process.env.EOS_AGENTBAR_PUBLISH === "0" ? null : defaultAgentbarStateDir(),
  listConsents: listCollectorConsents,
  record: async (payload) => {
    const consentScope = await resolveVaultScopeForConsent(payload.consentId);
    const result = await recordHostObservation(consentScope.vault, payload);
    clearWorkspaceEvidenceCache();
    platformHealthCache = null;
    return result;
  }
});
if (process.env.EOS_SESSION_LOG_WATCHER !== "0") {
  sessionLogWatcher.start().catch((error) => {
    console.error("[webServer] session log watcher failed to start:", error.message);
  });
}

// AgentBar 协议读取器：~/.agentbar/state.d → host-observation 管线。
// 有 Hook 宿主装上 AgentBar hooks（MIT）即零适配进入 EOS；trae 由 session-log
// watcher 直接上报并发布协议文件，读取器跳过避免双通道重复。EOS_AGENTBAR_READER=0 可关闭。
const agentbarReader = createAgentbarReader({
  vaultDir: vault.rootDir,
  skipHosts: process.env.EOS_SESSION_LOG_WATCHER === "0" || process.env.EOS_AGENTBAR_PUBLISH === "0"
    ? []
    : sessionLogWatcher.agentbarPublishHosts,
  listConsents: listCollectorConsents,
  record: async (payload) => {
    const consentScope = await resolveVaultScopeForConsent(payload.consentId);
    const result = await recordHostObservation(consentScope.vault, payload);
    clearWorkspaceEvidenceCache();
    platformHealthCache = null;
    return result;
  }
});
if (process.env.EOS_AGENTBAR_READER !== "0") {
  agentbarReader.start().catch((error) => {
    console.error("[webServer] agentbar reader failed to start:", error.message);
  });
}

/**
 * Clamp a limit query parameter to a safe range.
 * Prevents abuse via ?limit=999999999.
 */
const MAX_LIMIT = 500;
function clampLimit(value, fallback = 24) {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(Math.floor(n), MAX_LIMIT);
}

/**
 * Sanitize error messages for client responses.
 * Never leaks stack traces — returns a generic message for 500 errors.
 */
function safeErrorMessage(error) {
  if (error.statusCode === 400 || error.statusCode === 413 || error.statusCode === 415) {
    return error.message;
  }
  if (error.code === "ENOENT") return "Not found";
  // For unexpected errors, log server-side but don't expose details
  console.error("[webServer] unhandled error:", error.message);
  return "Internal server error";
}

const AUTH_COOKIE = "eos_session";
const AUTH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function cookieValue(request, name) {
  const raw = String(request.headers.cookie || "");
  for (const pair of raw.split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0) continue;
    if (pair.slice(0, separator).trim() === name) {
      try {
        return decodeURIComponent(pair.slice(separator + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

function authCookie(token) {
  return `${AUTH_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${AUTH_MAX_AGE_SECONDS}`;
}

function clearAuthCookie() {
  return `${AUTH_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

function currentWorkspaceDir() {
  return path.basename(path.dirname(vault.rootDir)) === ".eos"
    ? path.dirname(path.dirname(vault.rootDir))
    : rootDir;
}

async function currentWorkspaceProjectId() {
  try {
    const manifest = JSON.parse(await readFile(path.join(currentWorkspaceDir(), ".eos", "project.json"), "utf8"));
    return typeof manifest.projectId === "string" && manifest.projectId.trim() ? manifest.projectId : null;
  } catch {
    return null;
  }
}

function requireLocalOwner(request, response) {
  const userContext = contextFromRequest(request);
  if (hasPrivilegedAccess(userContext, { localMode: isLocalDeployment })) return true;
  sendJson(response, {
    error: userContext
      ? "Admin access required for local machine discovery"
      : "Authentication required for local machine discovery"
  }, userContext ? 403 : 401);
  return false;
}

async function handleApi(request, url, response) {
  if (url.pathname === "/api/health") {
    sendJson(response, {
      ok: true,
      service: "experience-os",
      version: EOS_VERSION,
      mode: deploymentMode,
      identityProtocol: "x-eos-identity",
      localPrivilegedActions: isLocalDeployment,
      generatedAt: new Date().toISOString()
    });
    return;
  }

  if (url.pathname === "/api/auth/status" && request.method === "GET") {
    sendJson(response, auth.status(cookieValue(request, AUTH_COOKIE)));
    return;
  }

  if (url.pathname === "/api/auth/request-code" && request.method === "POST") {
    try {
      sendJson(response, await auth.requestCode(await readJsonBody(request)));
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/auth/verify-code" && request.method === "POST") {
    try {
      const result = auth.verifyCode(await readJsonBody(request));
      response.setHeader("set-cookie", authCookie(result.token));
      sendJson(response, { ok: true, session: result.session });
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    auth.logout(cookieValue(request, AUTH_COOKIE));
    response.setHeader("set-cookie", clearAuthCookie());
    sendJson(response, { ok: true });
    return;
  }

  if (url.pathname === "/api/workspaces" && request.method === "GET") {
    if (!requireLocalOwner(request, response)) return;
    try {
      const workspaces = await workspaceRegistry.list();
      sendJson(response, {
        workspaces,
        count: workspaces.length,
        currentWorkspace: currentWorkspaceDir()
      });
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/discovery" && request.method === "GET") {
    if (!requireLocalOwner(request, response)) return;
    try {
      sendJson(response, await hostDiscoveryStore.summary());
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/discovery/scan" && request.method === "POST") {
    if (!requireLocalOwner(request, response)) return;
    try {
      const body = await readJsonBody(request);
      if (body.consent !== true) throw new Error("重新扫描需要用户明确授权");
      const health = await checkPlatformHealth({ vaultDir: vault.rootDir, observedSourceTools: [] });
      const discovery = await discoverHostProjects({
        consent: true,
        hosts: body.hosts,
        currentWorkspace: currentWorkspaceDir()
      });
      const hostResults = Object.fromEntries(discovery.selectedHosts.map((name) => {
        const result = health.platforms[name];
        return [name, {
          installed: Boolean(result?.proof?.hostInstalled),
          status: result?.status || "unknown",
          compatibilityLevel: result?.compatibilityLevel ?? 0,
          version: result?.details?.version || null
        }];
      }));
      const run = await hostDiscoveryStore.recordScan({
        consent: true,
        selectedHosts: discovery.selectedHosts,
        hostResults,
        discovery
      });
      sendJson(response, {
        run,
        projects: discovery.projects,
        metadataDiagnostics: discovery.metadataDiagnostics
      }, 201);
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/discovery/revoke" && request.method === "POST") {
    if (!requireLocalOwner(request, response)) return;
    try {
      const body = await readJsonBody(request);
      sendJson(response, { grant: await hostDiscoveryStore.revoke({ confirm: body.confirm }) });
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/onboarding/scan-hosts" && request.method === "POST") {
    if (!requireLocalOwner(request, response)) return;
    try {
      const body = await readJsonBody(request);
      if (body.consent !== true) throw new Error("宿主检测需要用户明确授权");
      const health = await checkPlatformHealth({ vaultDir: vault.rootDir, observedSourceTools: [] });
      const hosts = PLATFORMS.map((definition) => {
        const result = health.platforms[definition.name];
        return {
          name: definition.name,
          label: definition.label,
          description: definition.description,
          installed: Boolean(result?.proof?.hostInstalled),
          version: result?.details?.version || null,
          compatibilityLevel: result?.compatibilityLevel ?? 0,
          status: result?.status || "unknown"
        };
      });
      sendJson(response, {
        consented: true,
        scanScope: ["宿主是否安装", "宿主版本", "EOS 连接证据"],
        excludedScope: ["聊天正文", "源码内容", "项目文件内容"],
        hosts
      });
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/onboarding/discover-projects" && request.method === "POST") {
    if (!requireLocalOwner(request, response)) return;
    try {
      const body = await readJsonBody(request);
      sendJson(response, await discoverHostProjects({
        consent: body.consent,
        hosts: body.hosts,
        currentWorkspace: currentWorkspaceDir()
      }));
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/onboarding/inspect-manual" && request.method === "POST") {
    if (!requireLocalOwner(request, response)) return;
    try {
      const body = await readJsonBody(request);
      if (body.consent !== true) throw new Error("手动添加项目需要用户明确授权");
      sendJson(response, await inspectManualProject(body.path));
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/workspaces/connect" && request.method === "POST") {
    if (!requireLocalOwner(request, response)) return;
    try {
      const body = await readJsonBody(request);
      if (!Array.isArray(body.projects) || body.projects.length === 0) {
        throw new Error("请选择至少一个项目");
      }
      if (body.projects.length > 30) throw new Error("每次最多接入 30 个项目");
      const connected = [];
      const failed = [];
      // Intentionally sequential: bootstrap and registry writes must never race.
      for (const candidate of body.projects) {
        try {
          connected.push(await workspaceRegistry.connect({
            workspaceDir: candidate?.path,
            sourceHosts: (candidate?.sourceHosts || []).filter((host) =>
              ["codex", "claude", "cursor", "trae", "vscode"].includes(host)
            ),
            consent: body.consent,
            confirmWrites: body.confirmWrites
          }));
        } catch (error) {
          failed.push({ path: candidate?.path || null, error: error.message });
        }
      }
      sendJson(response, { ok: failed.length === 0, connected, failed }, failed.length ? 207 : 201);
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/workspaces/disconnect" && request.method === "POST") {
    if (!requireLocalOwner(request, response)) return;
    try {
      const body = await readJsonBody(request);
      sendJson(response, await workspaceRegistry.disconnect({
        workspaceDir: body.path,
        confirm: body.confirm
      }));
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/platforms" && request.method === "GET") {
    try {
      const [localObservations, localConsents, projectId, workspaceEvidence] = await Promise.all([
        vault.list("HostObservation"),
        vault.list("HostObservationConsent"),
        currentWorkspaceProjectId(),
        collectWorkspaceEvidence()
      ]);
      const hostObservations = dedupeRecords([...localObservations, ...workspaceEvidence.observations]);
      const observationConsents = dedupeRecords([...localConsents, ...workspaceEvidence.consents]);
      const observedHosts = [...new Set(hostObservations.map((event) => event.host).filter(Boolean))];
      const baseHealth = await cachedPlatformHealth(observedHosts);
      const health = promoteRegisteredWorkspaceBindings(baseHealth, {
        workspaces: workspaceEvidence.workspaces,
        observedHosts,
        observations: hostObservations
      });
      health.scope = {
        mode: "registered_workspaces",
        vaultDir: vault.rootDir,
        projectId,
        workspaceCount: workspaceEvidence.workspaces.filter((item) => item.status === "ready").length
      };
      for (const name of Object.keys(health.platforms)) {
        try {
          health.platforms[name].instructions = getInstallInstructions(name);
        } catch { /* unknown platform — skip instructions */ }
        if (["codex", "claude", "cursor"].includes(name)) {
          const boundWorkspace = health.platforms[name].details.boundWorkspace;
          const scopedProjectId = boundWorkspace?.projectId || projectId;
          const scopedWorkspaceDir = boundWorkspace?.workspace || currentWorkspaceDir();
          if (boundWorkspace) {
            health.platforms[name].connection = buildPlatformConnectionPlan(
              name,
              boundWorkspace.workspace,
              boundWorkspace.vaultDir
            );
          }
          const activeConsent = observationConsents.find((item) =>
            item.projectId === scopedProjectId && item.host === name && item.status === "active"
          );
          health.platforms[name].details.hookInstallation = await inspectHostHookInstallation({
            host: name,
            workspaceDir: scopedWorkspaceDir,
            configPath: hostHookConfigPath(name, scopedWorkspaceDir),
            secretRoot: hostHookCoordinator.secretRoot,
            tokenPath: hostObservationTokenPath(name, scopedWorkspaceDir, hostHookCoordinator.secretRoot),
            expectedConsentId: activeConsent?.id || null,
            expectedCaptureTokenHash: activeConsent?.captureTokenHash || null
          });
          health.platforms[name].details.observationConsentActive = Boolean(activeConsent);
        }
      }
      sendJson(response, health);
    } catch (error) {
      // Don't leak internal error details — log server-side, return generic message
      console.error("[webServer] /api/platforms error:", error.message);
      sendJson(response, { error: "Failed to check platform health" }, 500);
    }
    return;
  }

  if (url.pathname.startsWith("/api/platforms/") && url.pathname.endsWith("/start") && request.method === "POST") {
    // Connection plans expose machine-local paths, so they remain trusted on
    // loopback and admin-only elsewhere.
    const userContext = contextFromRequest(request);
    if (!hasPrivilegedAccess(userContext, { localMode: isLocalDeployment })) {
      sendJson(response, {
        started: false,
        message: userContext
          ? "Admin access required to start platform components."
          : "Authentication required to start platform components."
      }, userContext ? 403 : 401);
      return;
    }
    const name = url.pathname.slice("/api/platforms/".length, -"/start".length);
    try {
      const body = await readJsonBody(request).catch(() => ({}));
      const result = await tryStartPlatform(name, {
        ...(body || {}),
        vaultDir: vault.rootDir
      });
      sendJson(response, result);
    } catch (error) {
      sendJson(response, { started: false, message: error.message }, 400);
    }
    return;
  }

  if (url.pathname.startsWith("/api/platforms/") && url.pathname.endsWith("/connection-plan") && request.method === "POST") {
    if (!requireLocalOwner(request, response)) return;
    const name = url.pathname.slice("/api/platforms/".length, -"/connection-plan".length);
    try {
      const body = await readJsonBody(request).catch(() => ({}));
      const projectScope = body.projectId
        ? await resolveVaultScopeForProject(body.projectId)
        : { workspaceDir: currentWorkspaceDir(), vaultDir: vault.rootDir };
      sendJson(response, await hostConnectionCoordinator.preview(name, {
        workspaceDir: projectScope.workspaceDir,
        vaultDir: projectScope.vaultDir
      }));
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname.startsWith("/api/platforms/") && url.pathname.endsWith("/connection-apply") && request.method === "POST") {
    if (!requireLocalOwner(request, response)) return;
    const name = url.pathname.slice("/api/platforms/".length, -"/connection-apply".length);
    try {
      const body = await readJsonBody(request);
      if (body.approved !== true) {
        sendJson(response, { error: "Explicit human approval is required" }, 400);
        return;
      }
      const receipt = await hostConnectionCoordinator.apply(body.planId, {
        approved: true,
        target: name
      });
      sendJson(response, receipt);
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname.startsWith("/api/platforms/") && url.pathname.endsWith("/diagnose") && request.method === "GET") {
    const name = url.pathname.slice("/api/platforms/".length, -"/diagnose".length);
    try {
      const { diagnosePlatform } = await import("./eosPlatformAdapter.js");
      const hostObservations = await vault.list("HostObservation");
      const observedHosts = [...new Set(hostObservations.map((event) => event.host).filter(Boolean))];
      const diagnosis = await diagnosePlatform(name, {
        vaultDir: vault.rootDir,
        observedHosts
      });
      sendJson(response, diagnosis);
    } catch (error) {
      sendJson(response, { status: "error", healthy: false, advice: [error.message], result: null }, 400);
    }
    return;
  }

  if (url.pathname.startsWith("/api/platforms/") && url.pathname.endsWith("/hook-plan") && request.method === "POST") {
    if (!requireLocalOwner(request, response)) return;
    const name = url.pathname.slice("/api/platforms/".length, -"/hook-plan".length);
    try {
      const body = await readJsonBody(request).catch(() => ({}));
      if (["codex", "claude", "cursor"].includes(name)) {
        const consentScope = await resolveVaultScopeForConsent(body.consentId);
        const consent = consentScope.consent;
        if (!consent || consent.status !== "active" || consent.scope !== "metadata_only" || consent.host !== name) {
          sendJson(response, { error: "Active metadata-only consent for this host is required" }, 400);
          return;
        }
        if (!verifyHostObservationCaptureToken(consent, body.captureToken)) {
          sendJson(response, { error: "Valid Host observation capture credential is required" }, 400);
          return;
        }
        body.workspaceDir = consentScope.workspaceDir;
      }
      sendJson(response, await hostHookCoordinator.previewInstall({
        host: name,
        workspaceDir: body.workspaceDir || currentWorkspaceDir(),
        consentId: body.consentId,
        captureToken: body.captureToken,
        endpoint: body.endpoint || `http://127.0.0.1:${port}`
      }));
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname.startsWith("/api/platforms/") && url.pathname.endsWith("/hook-apply") && request.method === "POST") {
    if (!requireLocalOwner(request, response)) return;
    const name = url.pathname.slice("/api/platforms/".length, -"/hook-apply".length);
    try {
      const body = await readJsonBody(request);
      const pending = hostHookCoordinator.getPendingPlan(body.planId);
      if (!pending || pending.operation !== "install" || pending.host !== name) throw new Error("Install Hook plan is missing or does not match host");
      const consentScope = await resolveVaultScopeForConsent(pending.consentId);
      const consent = consentScope.consent;
      if (path.resolve(pending.workspaceDir) !== path.resolve(consentScope.workspaceDir)) {
        throw new Error("Hook plan workspace no longer matches the consent workspace");
      }
      if (!consent || consent.status !== "active" || consent.scope !== "metadata_only" || consent.host !== name) {
        throw new Error("Active metadata-only consent for this Hook plan is required");
      }
      if (!verifyHostObservationCaptureToken(consent, pending.captureToken)) {
        throw new Error("Host observation capture credential changed after preview; build a new plan");
      }
      sendJson(response, await hostHookCoordinator.apply(body.planId, {
        host: name,
        operation: "install",
        approved: body.approved,
        confirmedScope: body.confirmedScope
      }));
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname.startsWith("/api/platforms/") && url.pathname.endsWith("/hook-remove-plan") && request.method === "POST") {
    if (!requireLocalOwner(request, response)) return;
    const name = url.pathname.slice("/api/platforms/".length, -"/hook-remove-plan".length);
    try {
      const body = await readJsonBody(request).catch(() => ({}));
      const projectScope = await resolveVaultScopeForProject(body.projectId);
      sendJson(response, await hostHookCoordinator.previewRemoval({
        host: name,
        workspaceDir: projectScope.workspaceDir
      }));
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname.startsWith("/api/platforms/") && url.pathname.endsWith("/hook-remove-apply") && request.method === "POST") {
    if (!requireLocalOwner(request, response)) return;
    const name = url.pathname.slice("/api/platforms/".length, -"/hook-remove-apply".length);
    let consentRevoked = false;
    try {
      const body = await readJsonBody(request);
      const pending = hostHookCoordinator.getPendingPlan(body.planId);
      if (!pending || pending.operation !== "remove" || pending.host !== name) throw new Error("Remove Hook plan is missing or does not match host");
      if (body.approved !== true || body.confirmedScope !== "metadata_only_operational_status") {
        throw new Error("Explicit second confirmation is required to remove EOS Hooks");
      }
      const projectScope = await resolveVaultScopeForProject(body.projectId);
      const consent = (await projectScope.vault.list("HostObservationConsent"))
        .filter((item) => item.projectId === projectScope.projectId && item.host === name && item.status === "active")
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0] || null;
      if (consent) {
        await revokeHostObservationConsent(projectScope.vault, {
          consentId: consent.id,
          projectId: consent.projectId,
          revokedBy: "local_owner"
        });
        consentRevoked = true;
        clearWorkspaceEvidenceCache();
      }
      const receipt = await hostHookCoordinator.apply(body.planId, {
        host: name,
        operation: "remove",
        approved: true,
        confirmedScope: body.confirmedScope
      });
      sendJson(response, { ...receipt, consentRevoked });
    } catch (error) {
      sendJson(response, { error: error.message, consentRevoked }, 400);
    }
    return;
  }

  if (url.pathname === "/api/host-observation-consents" && request.method === "GET") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) { sendJson(response, { error: "projectId is required" }, 400); return; }
    const projectScope = await resolveVaultScopeForProject(projectId);
    const records = (await projectScope.vault.list("HostObservationConsent"))
      .filter((item) => item.projectId === projectId)
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    sendJson(response, { count: records.length, records });
    return;
  }

  if (url.pathname === "/api/host-observation-consents" && request.method === "POST") {
    if (!requireLocalOwner(request, response)) return;
    try {
      const body = await readJsonBody(request);
      const projectScope = await resolveVaultScopeForProject(body.projectId);
      const result = await approveHostObservationConsent(projectScope.vault, body);
      clearWorkspaceEvidenceCache();
      sendJson(response, result, 201);
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/host-observation-consents/revoke" && request.method === "POST") {
    if (!requireLocalOwner(request, response)) return;
    try {
      const body = await readJsonBody(request);
      const consentScope = await resolveVaultScopeForConsent(body.consentId);
      const result = await revokeHostObservationConsent(consentScope.vault, body);
      clearWorkspaceEvidenceCache();
      sendJson(response, result);
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/host-observations" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      console.log("[OBS-DEBUG]", JSON.stringify({ host: body?.observation?.host, event: body?.observation?.eventName, tool: body?.observation?.toolName, sessionHash: body?.observation?.sessionHash?.slice(0, 16), consentId: body?.consentId, socket: `${request.socket?.remoteAddress}:${request.socket?.remotePort}` }));
      const consentScope = await resolveVaultScopeForConsent(body.consentId);
      const result = await recordHostObservation(consentScope.vault, body);
      clearWorkspaceEvidenceCache();
      platformHealthCache = null;
      sendJson(response, result, 201);
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/host-observations" && request.method === "GET") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) { sendJson(response, { error: "projectId is required" }, 400); return; }
    const projectScope = await resolveVaultScopeForProject(projectId);
    sendJson(response, {
      records: await listHostObservations(projectScope.vault, {
        projectId,
        host: url.searchParams.get("host"),
        limit: clampLimit(url.searchParams.get("limit"), 100)
      })
    });
    return;
  }

  if (url.pathname === "/api/beta-feedback" && request.method === "POST") {
    const address = request.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    const attempts = (betaFeedbackAttempts.get(address) ?? []).filter((at) => now - at < 60 * 60 * 1000);
    if (attempts.length === 0) betaFeedbackAttempts.delete(address);
    if (attempts.length >= 5) {
      sendJson(response, { error: "Too many feedback submissions. Please try again later." }, 429);
      return;
    }
    // Reserve the slot BEFORE the async submission to close the TOCTOU gap:
    // two concurrent requests could both pass the `>= 5` check and push,
    // allowing 6 submissions. By pushing synchronously here, the second
    // request sees the updated count.
    attempts.push(now);
    betaFeedbackAttempts.set(address, attempts);
    try {
      const feedback = await submitBetaFeedback(vault, await readJsonBody(request));
      sendJson(response, {
        ok: true,
        id: feedback.id,
        participantId: feedback.participantId,
        storageScope: isLocalDeployment ? "local" : "service",
        canExport: isLocalDeployment
      }, 201);
    } catch (error) {
      // Submission failed — release the reserved slot so the user can retry
      attempts.pop();
      if (attempts.length === 0) betaFeedbackAttempts.delete(address);
      else betaFeedbackAttempts.set(address, attempts);
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/beta-feedback" && request.method === "GET") {
    const records = latest(await vault.list("BetaFeedback"), 100);
    const userContext = contextFromRequest(request);
    const canExport = hasPrivilegedAccess(userContext, { localMode: isLocalDeployment });
    // Remote participants may submit but cannot enumerate other testers' reports.
    const safe = canExport ? records : [];
    sendJson(response, {
      kind: "BetaFeedback",
      records: safe,
      canExport,
      storageScope: isLocalDeployment ? "local" : "service"
    });
    return;
  }

  if (url.pathname === "/api/beta-feedback/export" && request.method === "GET") {
    const userContext = contextFromRequest(request);
    // A local tester owns this Vault. Remote/private-beta exports remain admin-only.
    if (!hasPrivilegedAccess(userContext, { localMode: isLocalDeployment })) {
      sendJson(response, { error: "Admin access required for export" }, 403);
      return;
    }
    const records = await vault.list("BetaFeedback");
    const exported = {
      exportedAt: new Date().toISOString(),
      count: records.length,
      feedback: records.map((r) => ({
        participantId: r.participantId,
        stage: r.stage,
        usefulness: r.usefulness,
        clarity: r.clarity,
        wouldUseAgain: r.wouldUseAgain,
        helped: r.helped,
        blocked: r.blocked,
        contact: r.contact,
        createdAt: r.createdAt
      }))
    };
    response.setHeader(
      "content-disposition",
      `attachment; filename="eos-beta-feedback-${new Date().toISOString().slice(0, 10)}.json"`
    );
    sendJson(response, exported);
    return;
  }

  // Support both singular and plural paths for backward compatibility
  if (request.method === "POST" && (url.pathname === "/api/review-decisions" || url.pathname === "/api/review-decision")) {
    const result = await handleReviewDecision(request);
    sendJson(response, result, result.error ? 400 : 200);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/vault-archive") {
    const result = await handleVaultArchive(request);
    sendJson(response, result, result.error ? 400 : 200);
    return;
  }

  if (request.method === "POST" && (url.pathname === "/api/wallhit-resolutions" || url.pathname === "/api/wallhit-resolution")) {
    const result = await handleWallHitResolution(request);
    sendJson(response, result, result.error ? 400 : 200);
    return;
  }

  if (request.method === "POST" && (url.pathname === "/api/reuse-feedback" || url.pathname === "/api/experience-reuse-trials" || url.pathname === "/api/experience-reuse-trials/complete" || url.pathname === "/api/skill-registry/import" || url.pathname === "/api/mcp/export" || url.pathname === "/api/mcp/export-all" || url.pathname.startsWith("/api/team-review/") || url.pathname.startsWith("/api/marketplace/") || url.pathname.startsWith("/api/quality/") || url.pathname.startsWith("/api/pricing/") || url.pathname.startsWith("/api/transaction/") || url.pathname === "/api/projects" || url.pathname === "/api/project" || url.pathname === "/api/evidence" || url.pathname === "/api/experience-receipts" || url.pathname === "/api/experience-receipt-drafts" || url.pathname === "/api/experience-receipt-drafts/accept" || url.pathname === "/api/experience-receipt-drafts/reject" || url.pathname === "/api/experience-receipt-drafts/defer" || url.pathname === "/api/experience-receipt-drafts/resume" || url.pathname === "/api/decisions" || url.pathname === "/api/outcomes" || url.pathname === "/api/relay/events" || url.pathname === "/api/work-checkpoints" || url.pathname === "/api/experience-assets" || url.pathname === "/api/capture-permits/approve" || url.pathname === "/api/capture-permits/reject" || url.pathname === "/api/code-graph/ingest" || url.pathname === "/api/code-graph/blast-radius" || url.pathname === "/api/code-graph/parse-project" || url.pathname === "/api/beta-feedback")) {
    // Handle below in the specific route handlers
  } else if (request.method !== "GET") {
    sendJson(response, { error: "Method not allowed" }, 405);
    return;
  }

  const kind = kindForPath(url.pathname);
  if (url.pathname === "/api/summary") {
    sendJson(response, await buildSummary());
    return;
  }

  if (url.pathname === "/api/validation") {
    sendJson(response, await validateVault(vault));
    return;
  }

  if (url.pathname === "/api/vault-maintenance") {
    sendJson(response, await buildVaultMaintenancePreview(vault));
    return;
  }

  if (url.pathname === "/api/review-audit") {
    const limit = clampLimit(url.searchParams.get("limit"), 40);
    sendJson(response, await buildReviewAudit(limit));
    return;
  }

  if (url.pathname === "/api/skill-review-history") {
    const skillId = url.searchParams.get("skillId");
    if (!skillId) {
      sendJson(response, { error: "skillId is required" }, 400);
      return;
    }
    sendJson(response, await buildSkillReviewHistory(skillId));
    return;
  }

  if (url.pathname === "/api/wallhit-audit") {
    const limit = clampLimit(url.searchParams.get("limit"), 40);
    sendJson(response, await buildWallHitAudit(limit));
    return;
  }

  if (url.pathname === "/api/git/history") {
    const recordId = url.searchParams.get("recordId");
    if (!recordId) {
      sendJson(response, { error: "recordId is required" }, 400);
      return;
    }
    sendJson(response, { recordId, history: vault.history(recordId) });
    return;
  }

  if (url.pathname === "/api/git/stats") {
    sendJson(response, vault.stats());
    return;
  }

  if (url.pathname === "/api/llm/status") {
    sendJson(response, llmRuntimeStatus());
    return;
  }

  if (url.pathname === "/api/attention") {
    const [drafts, reviewPackets, wallHits, localObservations, projectId, workspaceEvidence] = await Promise.all([
      vault.list("ExperienceReceiptDraft"),
      vault.list("ReviewPacket"),
      vault.list("WallHit"),
      vault.list("HostObservation"),
      currentWorkspaceProjectId(),
      collectWorkspaceEvidence()
    ]);
    const hostObservations = dedupeRecords([...localObservations, ...workspaceEvidence.observations]);
    const observedHosts = [...new Set(hostObservations.map((event) => event.host).filter(Boolean))];
    const baseHealth = await cachedPlatformHealth(observedHosts);
    const health = promoteRegisteredWorkspaceBindings(baseHealth, {
      workspaces: workspaceEvidence.workspaces,
      observedHosts,
      observations: hostObservations
    });
    const scopedHostObservations = hostObservations.filter((observation) => {
      const boundProjectId = health.platforms?.[observation.host]?.details?.boundWorkspace?.projectId;
      const consentedProject = workspaceEvidence.consents.some((consent) =>
        consent.host === observation.host
        && consent.projectId === observation.projectId
        && consent.status === "active");
      return !boundProjectId || observation.projectId === boundProjectId || consentedProject;
    });
    const agentStatus = buildAgentStatus({
      platforms: health.platforms,
      observations: scopedHostObservations
    });
    let permits = [];
    try {
      permits = await listCapturePermitRequests(requireWorkspaceEosDir());
    } catch (error) {
      if (!String(error.message).includes("bootstrapped workspace Vault")) throw error;
    }
    sendJson(response, buildAttentionSnapshot({
      permits,
      drafts,
      reviewPackets,
      wallHits,
      agents: agentStatus.agents,
      agentSummary: agentStatus.summary,
      llm: llmRuntimeStatus()
    }));
    return;
  }

  // ============================================================
  // 3.0 Project API — the real main loop
  // ============================================================

  if (url.pathname === "/api/projects" && request.method === "GET") {
    const projects = await vault.list("Project");
    const status = url.searchParams.get("status");
    const filtered = status ? projects.filter((p) => p.status === status) : projects;
    sendJson(response, { count: filtered.length, records: filtered });
    return;
  }

  if (url.pathname === "/api/projects" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const project = await startProject(vault, body);
      sendJson(response, project);
    } catch (err) {
      sendJson(response, { error: err.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/project" && request.method === "GET") {
    const projectId = url.searchParams.get("id");
    if (!projectId) { sendJson(response, { error: "id is required" }, 400); return; }
    const project = await getProject(vault, projectId);
    if (!project) { sendJson(response, { error: "project not found" }, 404); return; }
    sendJson(response, project);
    return;
  }

  if (url.pathname === "/api/project" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const { id, ...updates } = body;
      if (!id) { sendJson(response, { error: "id is required" }, 400); return; }
      const updated = await updateProject(vault, id, updates);
      sendJson(response, updated);
    } catch (err) {
      sendJson(response, { error: err.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/project/timeline" && request.method === "GET") {
    const projectId = url.searchParams.get("id");
    if (!projectId) { sendJson(response, { error: "id is required" }, 400); return; }
    try {
      const timeline = await buildProjectTimeline(vault, projectId);
      sendJson(response, timeline);
    } catch (err) {
      const status = String(err.message).includes("not found") ? 404 : 400;
      sendJson(response, { error: err.message }, status);
    }
    return;
  }

  if (url.pathname === "/api/project/readiness" && request.method === "GET") {
    const projectId = url.searchParams.get("id");
    if (!projectId) { sendJson(response, { error: "id is required" }, 400); return; }
    try {
      sendJson(response, await getProjectReadiness(vault, projectId));
    } catch (err) {
      const status = String(err.message).includes("not found") ? 404 : 400;
      sendJson(response, { error: err.message }, status);
    }
    return;
  }

  if (url.pathname === "/api/project/trial-evidence" && request.method === "GET") {
    const projectId = url.searchParams.get("id");
    if (!projectId) { sendJson(response, { error: "id is required" }, 400); return; }
    try {
      sendJson(response, await getProjectTrialEvidence(vault, projectId));
    } catch (err) {
      const status = String(err.message).includes("not found") ? 404 : 400;
      sendJson(response, { error: err.message }, status);
    }
    return;
  }

  if (url.pathname === "/api/capture-permits" && request.method === "GET") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) { sendJson(response, { error: "projectId is required" }, 400); return; }
    try {
      const eosDir = requireWorkspaceEosDir();
      const [records, activity] = await Promise.all([
        listCapturePermitRequests(eosDir, projectId),
        listCapturePermitActivity(eosDir, projectId)
      ]);
      sendJson(response, { records, activity, strictPermitsAvailable: true });
    } catch (err) {
      // The default product Vault intentionally has no workspace-local permit
      // staging area. Treat that as an empty queue, not a broken project view.
      if (String(err.message).includes("bootstrapped workspace Vault")) {
        sendJson(response, { records: [], activity: [], strictPermitsAvailable: false });
      } else {
        sendJson(response, { error: err.message }, 400);
      }
    }
    return;
  }

  if (url.pathname === "/api/capture-permits/approve" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      sendJson(response, await approveCapturePermitRequest(requireWorkspaceEosDir(), {
        id: body.id,
        projectId: body.projectId,
        approvedBy: body.approvedBy || "human"
      }));
    } catch (err) {
      sendJson(response, { error: err.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/capture-permits/reject" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      sendJson(response, await rejectCapturePermitRequest(requireWorkspaceEosDir(), {
        id: body.id,
        projectId: body.projectId,
        rejectedBy: body.rejectedBy || "human"
      }));
    } catch (err) {
      sendJson(response, { error: err.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/reuse-suggestions" && request.method === "GET") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) { sendJson(response, { error: "projectId is required" }, 400); return; }
    try { sendJson(response, { records: await getVerifiedExperienceSuggestions(vault, projectId, url.searchParams.get("q") || "") }); }
    catch (err) {
      const status = String(err.message).includes("not found") ? 404 : 400;
      sendJson(response, { error: err.message }, status);
    }
    return;
  }
  if (url.pathname === "/api/reuse-feedback" && request.method === "POST") {
    try { sendJson(response, await recordExperienceReuseFeedback(vault, await readJsonBody(request))); }
    catch (err) { sendJson(response, { error: err.message }, 400); }
    return;
  }
  if (url.pathname === "/api/experience-reuse-trials" && request.method === "GET") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) { sendJson(response, { error: "projectId is required" }, 400); return; }
    try { sendJson(response, { records: await listExperienceReuseTrials(vault, projectId) }); }
    catch (err) { sendJson(response, { error: err.message }, 400); }
    return;
  }
  if (url.pathname === "/api/experience-reuse-trials" && request.method === "POST") {
    try { sendJson(response, await startExperienceReuseTrial(vault, await readJsonBody(request))); }
    catch (err) { sendJson(response, { error: err.message }, 400); }
    return;
  }
  if (url.pathname === "/api/experience-reuse-trials/complete" && request.method === "POST") {
    try { sendJson(response, await completeExperienceReuseTrial(vault, await readJsonBody(request))); }
    catch (err) { sendJson(response, { error: err.message }, 400); }
    return;
  }

  // Evidence links

  if (url.pathname === "/api/evidence" && request.method === "GET") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) { sendJson(response, { error: "projectId is required" }, 400); return; }
    const evidence = await listEvidenceForProject(vault, projectId);
    sendJson(response, { count: evidence.length, records: evidence });
    return;
  }

  if (url.pathname === "/api/evidence" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const link = await addEvidenceLink(vault, body);
      sendJson(response, link);
    } catch (err) {
      sendJson(response, { error: err.message }, 400);
    }
    return;
  }

  // Experience receipts

  if (url.pathname === "/api/experience-receipt-drafts" && request.method === "GET") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) { sendJson(response, { error: "projectId is required" }, 400); return; }
    try {
      const drafts = await listExperienceReceiptDrafts(vault, projectId);
      sendJson(response, { count: drafts.length, records: drafts });
    } catch (err) { sendJson(response, { error: err.message }, 404); }
    return;
  }

  if (url.pathname === "/api/experience-receipt-drafts" && request.method === "POST") {
    try {
      if (llm.mode !== "live" && !mockDraftsAllowed) {
        sendJson(response, {
          error: "真实 LLM 尚未配置，草案生成已锁定。请配置 LLM_PROVIDER 与对应 API Key；仅用于离线演练时可显式设置 EOS_ALLOW_MOCK_DRAFTS=1。"
        }, 409);
        return;
      }
      const body = await readJsonBody(request);
      sendJson(response, await proposeExperienceReceiptDraft(vault, llm, body));
    } catch (err) { sendJson(response, { error: err.message }, 400); }
    return;
  }

  if (url.pathname === "/api/experience-receipt-drafts/accept" && request.method === "POST") {
    try {
      sendJson(response, await acceptExperienceReceiptDraft(vault, await readJsonBody(request)));
    } catch (err) { sendJson(response, { error: err.message }, 400); }
    return;
  }

  if (url.pathname === "/api/experience-receipt-drafts/reject" && request.method === "POST") {
    try {
      sendJson(response, await rejectExperienceReceiptDraft(vault, await readJsonBody(request)));
    } catch (err) { sendJson(response, { error: err.message }, 400); }
    return;
  }

  if (url.pathname === "/api/experience-receipt-drafts/defer" && request.method === "POST") {
    try {
      sendJson(response, await deferExperienceReceiptDraft(vault, await readJsonBody(request)));
    } catch (err) { sendJson(response, { error: err.message }, 400); }
    return;
  }

  if (url.pathname === "/api/experience-receipt-drafts/resume" && request.method === "POST") {
    try {
      sendJson(response, await resumeExperienceReceiptDraft(vault, await readJsonBody(request)));
    } catch (err) { sendJson(response, { error: err.message }, 400); }
    return;
  }

  if (url.pathname === "/api/experience-receipts" && request.method === "GET") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) { sendJson(response, { error: "projectId is required" }, 400); return; }
    const receipts = await listReceiptsForProject(vault, projectId);
    sendJson(response, { count: receipts.length, records: receipts });
    return;
  }

  if (url.pathname === "/api/experience-receipts" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const receipt = await writeExperienceReceipt(vault, body);
      sendJson(response, receipt);
    } catch (err) {
      sendJson(response, { error: err.message }, 400);
    }
    return;
  }

  // Decision receipts

  if (url.pathname === "/api/decisions" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const decision = await recordDecision(vault, body);
      sendJson(response, decision);
    } catch (err) {
      sendJson(response, { error: err.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/decisions" && request.method === "GET") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) { sendJson(response, { error: "projectId is required" }, 400); return; }
    const all = await vault.list("DecisionReceipt");
    const decisions = all.filter((d) => d.projectId === projectId);
    sendJson(response, { count: decisions.length, records: decisions });
    return;
  }

  // Outcome records

  if (url.pathname === "/api/outcomes" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const outcome = await recordOutcome(vault, body);
      sendJson(response, outcome);
    } catch (err) {
      sendJson(response, { error: err.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/outcomes" && request.method === "GET") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) { sendJson(response, { error: "projectId is required" }, 400); return; }
    const all = await vault.list("OutcomeRecord");
    const outcomes = all.filter((o) => o.projectId === projectId);
    sendJson(response, { count: outcomes.length, records: outcomes });
    return;
  }

  // Consent-based, tool-agnostic Capture Relay.
  if (url.pathname === "/api/relay/events" && request.method === "POST") {
    try {
      sendJson(response, await captureCollaborationEvent(vault, await readJsonBody(request)));
    } catch (err) {
      sendJson(response, { error: err.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/relay/events" && request.method === "GET") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) { sendJson(response, { error: "projectId is required" }, 400); return; }
    const events = (await vault.list("ConversationEvent"))
      .filter((event) => event.projectId === projectId)
      .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
    sendJson(response, { count: events.length, records: events });
    return;
  }

  // The simplest consented project input: one work boundary creates replayable
  // source event + evidence + a human-readable checkpoint in one operation.
  if (url.pathname === "/api/work-checkpoints" && request.method === "POST") {
    try {
      sendJson(response, await captureWorkCheckpoint(vault, await readJsonBody(request)));
    } catch (err) {
      sendJson(response, { error: err.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/work-checkpoints" && request.method === "GET") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) { sendJson(response, { error: "projectId is required" }, 400); return; }
    const checkpoints = (await vault.list("WorkCheckpoint"))
      .filter((checkpoint) => checkpoint.projectId === projectId)
      .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
    sendJson(response, { count: checkpoints.length, records: checkpoints });
    return;
  }

  if (url.pathname === "/api/experience-assets" && request.method === "POST") {
    try {
      sendJson(response, await promoteExperienceAsset(vault, await readJsonBody(request)));
    } catch (err) {
      sendJson(response, { error: err.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/experience-assets" && request.method === "GET") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) { sendJson(response, { error: "projectId is required" }, 400); return; }
    const assets = (await vault.list("ExperienceAsset"))
      .filter((asset) => asset.projectId === projectId)
      .sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
    sendJson(response, { count: assets.length, records: assets });
    return;
  }

  if (url.pathname === "/api/skill-registry" && request.method === "GET") {
    const index = await buildLocalIndex(vault);
    const query = url.searchParams.get("q");
    const skillLevel = url.searchParams.get("level");
    const status = url.searchParams.get("status");
    const sortBy = url.searchParams.get("sort") || "quality";
    const limit = clampLimit(url.searchParams.get("limit"), 50);
    const results = searchIndex(index, { query, skillLevel, status, sortBy, limit });
    sendJson(response, {
      total: index.length,
      returned: results.length,
      categories: listCategories(index),
      skills: results
    });
    return;
  }

  if (url.pathname === "/api/skill-registry/import" && request.method === "POST") {
    const body = await readJsonBody(request);
    if (!body.skillData || !body.projectId) {
      sendJson(response, { error: "skillData and projectId are required" }, 400);
      return;
    }
    const userContext = contextFromRequest(request);
    const skill = await importSkill({
      vault,
      skillData: body.skillData,
      projectId: body.projectId,
      source: body.source || "web-import"
    });
    if (userContext) {
      applyOwnership(skill, userContext);
      await vault.save(skill);
    }
    sendJson(response, { ok: true, skill });
    return;
  }

  if (url.pathname === "/api/skills/presets" && request.method === "GET") {
    const presets = await listPresetSkills();
    sendJson(response, { ok: true, presets, schemaVersion: PRESET_SCHEMA_VERSION });
    return;
  }

  if (url.pathname === "/api/skills/presets/install" && request.method === "POST") {
    const body = await readJsonBody(request);
    const projectId = typeof activeProjectId === "string" ? activeProjectId : (typeof body === "object" && body && typeof body.projectId === "string" ? body.projectId : null);
    if (!projectId) {
      sendJson(response, { error: "projectId is required (no active project)" }, 400);
      return;
    }
    const result = await installPresetSkills({ vault, projectId, skillNames: (typeof body === "object" && body && Array.isArray(body.skillNames)) ? body.skillNames : null });
    sendJson(response, { ok: true, ...result });
    return;
  }

  if (url.pathname === "/api/skills/metadata" && request.method === "GET") {
    const skillId = url.searchParams.get("skillId");
    if (!skillId) {
      sendJson(response, { error: "skillId is required" }, 400);
      return;
    }
    const metadata = await getSkillMetadata(vault, skillId);
    if (!metadata) {
      sendJson(response, { error: "Skill not found" }, 404);
      return;
    }
    sendJson(response, metadata);
    return;
  }

  if (url.pathname === "/api/mcp/export" && request.method === "POST") {
    const body = await readJsonBody(request);
    if (!body.skillId) {
      sendJson(response, { error: "skillId is required" }, 400);
      return;
    }
    const skill = await vault.load("Skill", body.skillId).catch(() => null);
    if (!skill) {
      sendJson(response, { error: "Skill not found" }, 404);
      return;
    }
    const outputDir = path.join(rootDir, "work", "mcp-servers");
    try {
      const result = await exportSkillAsMcpServer({
        skill,
        outputDir,
        options: { transport: body.transport || "stdio", version: body.version || "1.0.0" }
      });
      sendJson(response, { ok: true, serverName: result.serverName, serverDir: result.serverDir, files: result.files.length });
    } catch (error) {
      sendJson(response, { ok: false, error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/mcp/export-all" && request.method === "POST") {
    const skills = await vault.list("Skill");
    const outputDir = path.join(rootDir, "work", "mcp-servers");
    const results = await exportAllStableSkills({ skills, outputDir });
    sendJson(response, {
      total: skills.length,
      exported: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results
    });
    return;
  }

  if (url.pathname === "/api/mcp/list" && request.method === "GET") {
    const mcpDir = path.join(rootDir, "work", "mcp-servers");
    try {
      const { readdir } = await import("node:fs/promises");
      const entries = await readdir(mcpDir, { withFileTypes: true });
      const servers = entries
        .filter((e) => e.isDirectory())
        .map((e) => ({ name: e.name, dir: path.join(mcpDir, e.name) }));
      sendJson(response, { servers });
    } catch {
      sendJson(response, { servers: [] });
    }
    return;
  }

  if (url.pathname === "/api/team-review/assign" && request.method === "POST") {
    const body = await readJsonBody(request);
    if (!body.packetId || !body.userIds) {
      sendJson(response, { error: "packetId and userIds are required" }, 400);
      return;
    }
    const doAssign = async () => {
      const fresh = await vault.load("ReviewPacket", body.packetId).catch(() => null);
      if (!fresh) return { error: "ReviewPacket not found", status: 404 };
      assignReviewers(fresh, body.userIds);
      await vault.save(fresh);
      return { ok: true, packet: fresh };
    };
    const result = typeof vault.withWriteLock === "function" ? await vault.withWriteLock(doAssign) : await doAssign();
    sendJson(response, result, result.status ?? 200);
    return;
  }

  if (url.pathname === "/api/team-review/vote" && request.method === "POST") {
    const body = await readJsonBody(request);
    if (!body.packetId || !body.userId || !body.vote) {
      sendJson(response, { error: "packetId, userId, and vote are required" }, 400);
      return;
    }
    const doVote = async () => {
      const fresh = await vault.load("ReviewPacket", body.packetId).catch(() => null);
      if (!fresh) return { error: "ReviewPacket not found", status: 404 };
      try {
        submitVote(fresh, { userId: body.userId, vote: body.vote, comment: body.comment });
        await vault.save(fresh);
        const status = checkConfirmationStatus(fresh);
        return { ok: true, packet: fresh, status };
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    };
    const result = typeof vault.withWriteLock === "function" ? await vault.withWriteLock(doVote) : await doVote();
    sendJson(response, result, result.status ?? 200);
    return;
  }

  if (url.pathname === "/api/team-review/discuss" && request.method === "POST") {
    const body = await readJsonBody(request);
    if (!body.packetId || !body.userId || !body.message) {
      sendJson(response, { error: "packetId, userId, and message are required" }, 400);
      return;
    }
    const doDiscuss = async () => {
      const fresh = await vault.load("ReviewPacket", body.packetId).catch(() => null);
      if (!fresh) return { error: "ReviewPacket not found", status: 404 };
      addDiscussionComment(fresh, { userId: body.userId, message: body.message, mentions: body.mentions });
      await vault.save(fresh);
      return { ok: true, discussion: fresh.discussion };
    };
    const result = typeof vault.withWriteLock === "function" ? await vault.withWriteLock(doDiscuss) : await doDiscuss();
    sendJson(response, result, result.status ?? 200);
    return;
  }

  if (url.pathname === "/api/team-review/summary" && request.method === "GET") {
    const packetId = url.searchParams.get("packetId");
    if (!packetId) {
      sendJson(response, { error: "packetId is required" }, 400);
      return;
    }
    const packet = await vault.load("ReviewPacket", packetId).catch(() => null);
    if (!packet) {
      sendJson(response, { error: "ReviewPacket not found" }, 404);
      return;
    }
    sendJson(response, getReviewSummary(packet));
    return;
  }

  if (url.pathname === "/api/team-review/finalize" && request.method === "POST") {
    const body = await readJsonBody(request);
    if (!body.packetId) {
      sendJson(response, { error: "packetId is required" }, 400);
      return;
    }
    const packet = await vault.load("ReviewPacket", body.packetId).catch(() => null);
    if (!packet) {
      sendJson(response, { error: "ReviewPacket not found" }, 404);
      return;
    }
    try {
      const result = await finalizeTeamReview({ packet, vault, finalDecisionBy: body.userId });
      sendJson(response, { ok: true, decision: result.decision, packet: result.packet });
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  // ========================================================================
  // 2.0-C: Marketplace endpoints
  // ========================================================================

  if (url.pathname === "/api/marketplace/search" && request.method === "GET") {
    const options = {
      query: url.searchParams.get("query") || undefined,
      license: url.searchParams.get("license") || undefined,
      pricingModel: url.searchParams.get("pricingModel") || undefined,
      sellerId: url.searchParams.get("sellerId") || undefined,
      sortBy: url.searchParams.get("sortBy") || "recent",
      limit: clampLimit(url.searchParams.get("limit"), 20)
    };
    const results = await searchMarketplace(vault, options);
    const userContext = contextFromRequest(request);
    const filtered = filterReadable(results, userContext);
    sendJson(response, { count: filtered.length, listings: filtered });
    return;
  }

  if (url.pathname === "/api/marketplace/publish" && request.method === "POST") {
    const body = await readJsonBody(request);
    const userContext = contextFromRequest(request);
    try {
      const listing = await publishSkill(vault, body);
      if (userContext) {
        // Apply ownership inside the write lock to prevent a race where
        // another request reads the listing before ownership is attached.
        const doOwnershipSave = async () => {
          applyOwnership(listing, userContext);
          await vault.save(listing);
        };
        if (typeof vault.withWriteLock === "function") {
          await vault.withWriteLock(doOwnershipSave);
        } else {
          await doOwnershipSave();
        }
      }
      sendJson(response, { ok: true, listing });
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/marketplace/unpublish" && request.method === "POST") {
    const body = await readJsonBody(request);
    try {
      const listing = await vault.load("MarketplaceListing", body.listingId);
      if (!listing) throw new Error("Listing not found");
      const userContext = contextFromRequest(request);
      if (userContext && !canEdit(listing, userContext)) {
        sendJson(response, { error: "Permission denied: you cannot unpublish this listing" }, 403);
        return;
      }
      if (listing.status === "suspended") throw new Error("cannot unpublish a suspended listing");
      const result = await unpublishSkill(vault, body.listingId);
      sendJson(response, { ok: true, listing: result });
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/marketplace/suspend" && request.method === "POST") {
    const body = await readJsonBody(request);
    try {
      const listing = await vault.load("MarketplaceListing", body.listingId);
      if (!listing) throw new Error("Listing not found");
      const userContext = contextFromRequest(request);
      if (userContext && userContext.role !== "admin") {
        sendJson(response, { error: "Permission denied: only admins can suspend listings" }, 403);
        return;
      }
      const result = await suspendListing(vault, body.listingId);
      sendJson(response, { ok: true, listing: result });
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/marketplace/listing" && request.method === "GET") {
    const listingId = url.searchParams.get("listingId");
    if (!listingId) {
      sendJson(response, { error: "listingId is required" }, 400);
      return;
    }
    const details = await getListingDetails(vault, listingId);
    if (!details) {
      sendJson(response, { error: "Listing not found" }, 404);
      return;
    }
    sendJson(response, details);
    return;
  }

  if (url.pathname === "/api/marketplace/versions" && request.method === "GET") {
    const skillId = url.searchParams.get("skillId");
    if (!skillId) {
      sendJson(response, { error: "skillId is required" }, 400);
      return;
    }
    const versions = await listPublishedVersions(vault, skillId);
    sendJson(response, { skillId, versions });
    return;
  }

  if (url.pathname === "/api/marketplace/download" && request.method === "POST") {
    const body = await readJsonBody(request);
    try {
      const listing = await recordDownload(vault, body.listingId);
      sendJson(response, { ok: true, downloads: listing.downloads });
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/marketplace/stats" && request.method === "GET") {
    const stats = await getMarketplaceStats(vault);
    sendJson(response, stats);
    return;
  }

  // ========================================================================
  // 2.0-C: Quality rating endpoints
  // ========================================================================

  if (url.pathname === "/api/quality/rate" && request.method === "POST") {
    const body = await readJsonBody(request);
    try {
      // submitRating already calls syncListingRatings internally,
      // so no need to call it again here.
      const rating = await submitRating(vault, body);
      sendJson(response, { ok: true, rating });
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/quality/ratings" && request.method === "GET") {
    const skillId = url.searchParams.get("skillId");
    if (!skillId) {
      sendJson(response, { error: "skillId is required" }, 400);
      return;
    }
    const summary = await getRatingSummary(vault, skillId);
    sendJson(response, summary);
    return;
  }

  if (url.pathname === "/api/quality/report" && request.method === "GET") {
    const skillId = url.searchParams.get("skillId");
    if (!skillId) {
      sendJson(response, { error: "skillId is required" }, 400);
      return;
    }
    const report = await getSkillQualityReport(vault, skillId);
    if (!report) {
      sendJson(response, { error: "Skill not found" }, 404);
      return;
    }
    sendJson(response, report);
    return;
  }

  if (url.pathname === "/api/quality/leaderboard" && request.method === "GET") {
    const limit = clampLimit(url.searchParams.get("limit"), 10);
    const board = await getQualityLeaderboard(vault, limit);
    sendJson(response, { leaderboard: board });
    return;
  }

  if (url.pathname === "/api/quality/auto-flag" && request.method === "POST") {
    const flagged = await autoFlagLowQuality(vault);
    sendJson(response, { ok: true, flaggedCount: flagged.length, flagged });
    return;
  }

  // ========================================================================
  // 2.0-C: Pricing endpoints
  // ========================================================================

  if (url.pathname === "/api/pricing/validate" && request.method === "POST") {
    const body = await readJsonBody(request);
    const issues = validatePricing(body.pricing);
    sendJson(response, { valid: issues.length === 0, issues });
    return;
  }

  if (url.pathname === "/api/pricing/commission" && request.method === "GET") {
    const rawAmount = Number(url.searchParams.get("amount") ?? 0);
    if (!Number.isFinite(rawAmount) || rawAmount < 0) {
      sendJson(response, { error: "amount must be a non-negative finite number" }, 400);
      return;
    }
    const split = calculateCommission(rawAmount);
    sendJson(response, split);
    return;
  }

  if (url.pathname === "/api/pricing/trial" && request.method === "GET") {
    const listingId = url.searchParams.get("listingId");
    const buyerId = url.searchParams.get("buyerId");
    if (!listingId || !buyerId) {
      sendJson(response, { error: "listingId and buyerId are required" }, 400);
      return;
    }
    const trial = await checkTrial(vault, listingId, buyerId);
    sendJson(response, trial);
    return;
  }

  if (url.pathname === "/api/pricing/breakdown" && request.method === "GET") {
    const listingId = url.searchParams.get("listingId");
    if (!listingId) {
      sendJson(response, { error: "listingId is required" }, 400);
      return;
    }
    const listing = await vault.load("MarketplaceListing", listingId).catch(() => null);
    if (!listing) {
      sendJson(response, { error: "Listing not found" }, 404);
      return;
    }
    const purchaseType = url.searchParams.get("type") || "purchase";
    const breakdown = computePurchaseBreakdown(listing, purchaseType);
    sendJson(response, breakdown);
    return;
  }

  if (url.pathname === "/api/pricing/verify-license" && request.method === "POST") {
    const body = await readJsonBody(request);
    const result = verifyLicenseKey(body.licenseKey);
    sendJson(response, result);
    return;
  }

  // ========================================================================
  // 2.0-C: Transaction endpoints
  // ========================================================================

  if (url.pathname === "/api/transaction/purchase" && request.method === "POST") {
    const body = await readJsonBody(request);
    try {
      const result = await processPurchase(vault, body);
      sendJson(response, { ok: true, ...result });
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/transaction/trial" && request.method === "POST") {
    const body = await readJsonBody(request);
    try {
      const result = await processTrial(vault, body);
      sendJson(response, { ok: true, ...result });
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/transaction/refund" && request.method === "POST") {
    const body = await readJsonBody(request);
    try {
      const tx = await getTransaction(vault, body.transactionId);
      if (!tx) throw new Error("Transaction not found");
      const userContext = contextFromRequest(request);
      // Default-deny: when no user context (unauthenticated), reject the
      // refund. Previously the `userContext &&` guard short-circuited to
      // false, allowing unauthenticated refunds.
      if (!userContext || (userContext.role !== "admin" && tx.buyerId !== userContext.userId && tx.sellerId !== userContext.userId)) {
        sendJson(response, { error: "Permission denied: only the buyer, seller, or admin can refund" }, 403);
        return;
      }
      const transaction = await refundTransaction(vault, body.transactionId);
      sendJson(response, { ok: true, transaction });
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/transaction/history" && request.method === "GET") {
    const options = {
      buyerId: url.searchParams.get("buyerId") || undefined,
      listingId: url.searchParams.get("listingId") || undefined,
      sellerId: url.searchParams.get("sellerId") || undefined,
      limit: clampLimit(url.searchParams.get("limit"), 50)
    };
    const history = await getTransactionHistory(vault, options);
    const userContext = contextFromRequest(request);
    const filtered = filterReadable(history, userContext);
    // Mask license keys for non-owners to prevent leakage.
    const safeFiltered = filtered.map((tx) => {
      if (!tx.licenseKey) return tx;
      const isOwner = userContext && (tx.buyerId === userContext.userId || tx.sellerId === userContext.userId || userContext.role === "admin");
      return isOwner ? tx : { ...tx, licenseKey: maskKey(tx.licenseKey) };
    });
    sendJson(response, { count: safeFiltered.length, transactions: safeFiltered });
    return;
  }

  if (url.pathname === "/api/transaction/revenue" && request.method === "GET") {
    const sellerId = url.searchParams.get("sellerId");
    if (!sellerId) {
      sendJson(response, { error: "sellerId is required" }, 400);
      return;
    }
    const summary = await getRevenueSummary(vault, sellerId);
    sendJson(response, summary);
    return;
  }

  if (url.pathname === "/api/transaction/verify-license" && request.method === "GET") {
    const listingId = url.searchParams.get("listingId");
    const buyerId = url.searchParams.get("buyerId");
    if (!listingId || !buyerId) {
      sendJson(response, { error: "listingId and buyerId are required" }, 400);
      return;
    }
    const result = await verifyBuyerLicense(vault, listingId, buyerId);
    // Mask the license key — only reveal whether a license exists, not the
    // full key, to prevent PII leakage via unauthenticated GET.
    const masked = result.hasLicense
      ? { hasLicense: true, licenseType: result.licenseType, licenseKey: maskKey(result.licenseKey) }
      : { hasLicense: false };
    sendJson(response, masked);
    return;
  }

  if (url.pathname === "/api/transaction/get" && request.method === "GET") {
    const transactionId = url.searchParams.get("transactionId");
    if (!transactionId) {
      sendJson(response, { error: "transactionId is required" }, 400);
      return;
    }
    const tx = await getTransaction(vault, transactionId);
    if (!tx) {
      sendJson(response, { error: "Transaction not found" }, 404);
      return;
    }
    // Mask license key to prevent leakage via unauthenticated GET.
    const userContext = contextFromRequest(request);
    const isOwner = userContext && (tx.buyerId === userContext.userId || tx.sellerId === userContext.userId || userContext.role === "admin");
    const safeTx = { ...tx };
    if (!isOwner && safeTx.licenseKey) {
      safeTx.licenseKey = maskKey(safeTx.licenseKey);
    }
    sendJson(response, safeTx);
    return;
  }

  // ========================================================================
  // 方案C: Code Graph endpoints
  // ========================================================================

  if (url.pathname === "/api/code-graph/ingest" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      if (!body.projectId || !body.snapshot) {
        sendJson(response, { error: "projectId and snapshot are required" }, 400);
        return;
      }
      const result = await ingestCodeGraphSnapshot(vault, {
        projectId: body.projectId,
        snapshot: body.snapshot,
        sourceTool: body.sourceTool || "external",
        sourceRef: body.sourceRef || null
      });
      sendJson(response, {
        ok: true,
        snapshotId: result.snapshotId,
        summary: result.summary,
        patternCount: result.records.length,
        patterns: result.records
      });
    } catch (error) {
      sendJson(response, { error: safeErrorMessage(error) }, 400);
    }
    return;
  }

  if (url.pathname === "/api/code-graph/patterns" && request.method === "GET") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      sendJson(response, { error: "projectId is required" }, 400);
      return;
    }
    const patternType = url.searchParams.get("patternType") || null;
    const limit = clampLimit(url.searchParams.get("limit"), 50);
    const patterns = await queryCodeGraphPatterns(vault, { projectId, patternType, limit });
    sendJson(response, { count: patterns.length, patterns });
    return;
  }

  if (url.pathname === "/api/code-graph/blast-radius" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      if (!body.projectId || !body.targetId || !body.snapshot) {
        sendJson(response, { error: "projectId, targetId, and snapshot are required" }, 400);
        return;
      }
      const result = computeBlastRadius(normalizeGraphSnapshot(body.snapshot), body.targetId);
      sendJson(response, result);
    } catch (error) {
      sendJson(response, { error: safeErrorMessage(error) }, 400);
    }
    return;
  }


  if (url.pathname === "/api/code-graph/parse-project" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      if (!body.projectId || !body.rootDir) {
        sendJson(response, { error: "projectId and rootDir are required" }, 400);
        return;
      }
      const projectRootPath = resolveProjectRoot(String(body.rootDir), { baseDir: rootDir });
      const snapshot = await parseProjectDependencies(projectRootPath, {
        includeExternal: body.includeExternal !== false,
        includeNodeBuiltins: body.includeNodeBuiltins === true
      });
      const result = await ingestCodeGraphSnapshot(vault, {
        projectId: body.projectId,
        snapshot,
        sourceTool: "eos-dependency-parser",
        sourceRef: projectRootPath
      });
      sendJson(response, {
        ok: true,
        snapshotId: result.snapshotId,
        summary: result.summary,
        patternCount: result.records.length
      });
    } catch (error) {
      sendJson(response, { error: safeErrorMessage(error) }, 400);
    }
    return;
  }

  if (!kind) {
    sendJson(response, { error: "Unknown endpoint" }, 404);
    return;
  }

  const userContext = contextFromRequest(request);
  const limit = clampLimit(url.searchParams.get("limit"), 24);
  const records = filterReadable(await vault.list(kind), userContext);
  sendJson(response, {
    kind,
    records: latest(records, limit)
  });
}

function requireWorkspaceEosDir() {
  const eosDir = path.dirname(vault.rootDir);
  if (path.basename(eosDir) !== ".eos" || path.basename(vault.rootDir) !== "vault") {
    throw new Error("strict capture permits require a bootstrapped workspace Vault");
  }
  return eosDir;
}

async function handleReviewDecision(request) {
  const body = await readJsonBody(request);
  const packetId = body.reviewPacketId;
  const decision = body.decision;
  const rationale = body.rationale ?? "web ui decision";

  if (!packetId || !decision) {
    return { error: "reviewPacketId and decision are required" };
  }

  const packet = await vault.load("ReviewPacket", packetId);
  if (!packet) {
    return { error: "ReviewPacket not found", reviewPacketId: packetId };
  }
  if (packet.status === "decided") {
    return { error: "ReviewPacket is already decided", packet };
  }

  // Access control: check if user can review this packet
  const userContext = contextFromRequest(request);
  if (userContext && !canReview(packet, userContext)) {
    return { error: "Permission denied: you cannot review this packet" };
  }

  const allowedDecisionIds = new Set((packet.options ?? []).map((option) => option.id));
  if (!allowedDecisionIds.has(decision)) {
    return { error: "Decision is not allowed for this packet", allowedDecisionIds: [...allowedDecisionIds] };
  }

  const reviewDecision = await applyReviewDecision({ vault, packet, decision, rationale });
  if (userContext) {
    // Apply ownership inside the write lock to prevent a race where
    // another request reads the decision before ownership is attached.
    const doOwnershipSave = async () => {
      applyOwnership(reviewDecision, userContext);
      await vault.save(reviewDecision);
    };
    if (typeof vault.withWriteLock === "function") {
      await vault.withWriteLock(doOwnershipSave);
    } else {
      await doOwnershipSave();
    }
  }
  return {
    ok: true,
    reviewDecision,
    packet: await vault.load("ReviewPacket", packet.id),
    target: await maybeLoad(packet.targetKind, packet.targetId)
  };
}

async function handleVaultArchive(request) {
  const body = await readJsonBody(request);
  const limit = Math.max(0, Math.min(Number(body.limit ?? 10) || 0, 100));
  if (limit < 1) {
    return { error: "limit must be between 1 and 100" };
  }
  return archiveVaultCandidates({
    vault,
    limit,
    reason: body.reason ?? "web ui archive"
  });
}

async function handleWallHitResolution(request) {
  const body = await readJsonBody(request);
  const wallHitId = body.wallHitId;
  if (!wallHitId) {
    return { error: "wallHitId is required" };
  }

  // Access control: check if user can edit this wall hit
  const userContext = contextFromRequest(request);
  const resolvedAt = new Date().toISOString();

  const doResolve = async () => {
    const fresh = await vault.load("WallHit", wallHitId);
    if (!fresh) {
      return { error: "WallHit not found", wallHitId };
    }
    if (userContext && !canEdit(fresh, userContext)) {
      return { error: "Permission denied: you cannot resolve this wall hit" };
    }
    const resolvedByIds = [...new Set([...(fresh.resolvedByIds ?? []), ...(body.resolvedByIds ?? [])].filter(Boolean))];
    const updatedWallHit = {
      ...fresh,
      status: "resolved",
      humanDecisionNeeded: false,
      resolvedByIds,
      resolvedAt,
      resolutionRationale: body.rationale ?? "human marked resolved",
      updatedAt: resolvedAt
    };
    await vault.save(updatedWallHit);
    return { ok: true, wallHit: updatedWallHit };
  };

  if (typeof vault.withWriteLock === "function") {
    return vault.withWriteLock(doResolve);
  }
  return doResolve();
}

const MAX_BODY_BYTES = 1024 * 1024; // 1 MiB cap for JSON request bodies

async function readJsonBody(request) {
  // Validate Content-Type for POST/PUT requests with a body
  const method = request.method?.toUpperCase();
  if (method === "POST" || method === "PUT" || method === "PATCH") {
    const contentType = request.headers["content-type"] || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      const error = new Error("Content-Type must be application/json");
      error.statusCode = 415;
      throw error;
    }
  }
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      request.destroy();
      const error = new Error(`Request body exceeds ${MAX_BODY_BYTES} byte limit`);
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    // Guard against valid-but-null JSON bodies (e.g. "null") and arrays
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    error.statusCode = 400;
    throw error;
  }
}

async function maybeLoad(kind, id) {
  try {
    return await vault.load(kind, id);
  } catch {
    return null;
  }
}

function kindForPath(pathname) {
  return {
    "/api/projects": "Project",
    "/api/reuse-contexts": "ReuseContext",
    "/api/review-packets": "ReviewPacket",
    "/api/review-decisions": "ReviewDecision",
    "/api/wallhits": "WallHit",
    "/api/skills": "Skill",
    "/api/self-iteration-runs": "SelfIterationRun",
    "/api/reflection-memories": "ReflectionMemory",
    "/api/workflow-patterns": "WorkflowPattern",
    "/api/preference-hypotheses": "PreferenceHypothesis"
  }[pathname];
}

async function buildSummary() {
  const kinds = [
    "Project",
    "Skill",
    "WallHit",
    "ReuseContext",
    "SelfIterationRun",
    "ReviewPacket",
    "ReviewDecision",
    "ReflectionMemory",
    "WorkflowPattern",
    "PreferenceHypothesis",
    "MarketplaceListing",
    "Transaction",
    "SkillRating",
    "EvidenceLink",
    "ExperienceReceipt",
    "ExperienceReceiptDraft",
    "DecisionReceipt",
    "OutcomeRecord",
    "ExperienceAsset",
    "ExperienceReuseTrial",
    "BetaFeedback",
    "WorkCheckpoint"
  ];
  const entries = await Promise.all(kinds.map(async (kind) => [kind, await vault.list(kind)]));
  const recordsByKind = Object.fromEntries(entries);
  const latestSkillRun = latest(recordsByKind.SelfIterationRun, 1)[0] ?? null;
  const latestReviewPackets = latest(recordsByKind.ReviewPacket, 4);
  const pendingReviewCount = recordsByKind.ReviewPacket.filter((packet) => packet.status !== "decided").length;
  const latestWallHit = latest(recordsByKind.WallHit, 1)[0] ?? null;
  const latestReuseContext = latest(recordsByKind.ReuseContext, 1)[0] ?? null;

  // 2.0-C marketplace stats for overview
  const activeListings = (recordsByKind.MarketplaceListing || []).filter((l) => l.status === "active");
  const completedTransactions = (recordsByKind.Transaction || []).filter((t) => t.status === "completed" && t.type !== "trial");
  const marketplaceStats = {
    activeListings: activeListings.length,
    totalTransactions: completedTransactions.length,
    totalRevenue: completedTransactions.reduce((acc, t) => acc + Math.round((t.amount || 0) * 100), 0) / 100
  };

  return {
    generatedAt: new Date().toISOString(),
    counts: Object.fromEntries(entries.map(([kind, records]) => [kind, records.length])),
    latest: {
      project: latest(recordsByKind.Project, 1)[0] ?? null,
      skillRun: latestSkillRun,
      reviewPackets: latestReviewPackets,
      wallHit: latestWallHit,
      reuseContext: latestReuseContext,
      skills: latest(recordsByKind.Skill, 8),
      reflections: latest(recordsByKind.ReflectionMemory, 4),
      preferences: latest(recordsByKind.PreferenceHypothesis, 4)
    },
    health: {
      selfIterationHealthy: Boolean(
        latestSkillRun?.acceptedSkillIds?.length ||
        latestSkillRun?.candidateSkillIds?.length
      ),
      humanReviewReady: pendingReviewCount > 0,
      wallFeedbackLoopReady: Boolean(latestWallHit),
      reuseReady: Boolean(latestReuseContext)
    },
    reviewQueue: {
      pendingReviewCount,
      latestReviewPacketCount: latestReviewPackets.length
    },
    marketplace: marketplaceStats
  };
}

async function buildReviewAudit(limit) {
  const decisions = latest(await vault.list("ReviewDecision"), limit);
  const entries = [];
  for (const decision of decisions) {
    const [packet, target] = await Promise.all([
      maybeLoad("ReviewPacket", decision.reviewPacketId),
      maybeLoad(decision.targetKind, decision.targetId)
    ]);
    entries.push({
      id: decision.id,
      kind: "ReviewAuditEntry",
      decision,
      packet,
      target,
      targetStatus: target?.status ?? "missing",
      targetReviewedAt: target?.reviewedAt ?? null,
      targetLastReviewDecisionId: target?.lastReviewDecisionId ?? null,
      linked: Boolean(packet && target),
      createdAt: decision.createdAt
    });
  }
  return {
    count: entries.length,
    brokenLinkCount: entries.filter((entry) => !entry.linked).length,
    entries
  };
}

async function buildSkillReviewHistory(skillId) {
  const [skill, packets, decisions] = await Promise.all([
    maybeLoad("Skill", skillId),
    vault.list("ReviewPacket"),
    vault.list("ReviewDecision")
  ]);
  const relatedPackets = packets.filter((packet) => packet.targetKind === "Skill" && packet.targetId === skillId);
  const relatedPacketIds = new Set(relatedPackets.map((packet) => packet.id));
  const relatedDecisions = decisions.filter((decision) => (
    decision.targetKind === "Skill" &&
    decision.targetId === skillId &&
    relatedPacketIds.has(decision.reviewPacketId)
  ));

  return {
    skillId,
    skill,
    reviewPacketCount: relatedPackets.length,
    reviewDecisionCount: relatedDecisions.length,
    reviewPackets: latest(relatedPackets, relatedPackets.length),
    reviewDecisions: latest(relatedDecisions, relatedDecisions.length)
  };
}

async function buildWallHitAudit(limit) {
  const [wallHits, reflections, trajectories] = await Promise.all([
    vault.list("WallHit"),
    vault.list("ReflectionMemory"),
    vault.list("MotherSkillTrajectory")
  ]);
  const records = latest(wallHits, limit).map((wallHit) => {
    const relatedReflections = reflections.filter((reflection) => reflection.sourceWallHitId === wallHit.id);
    const relatedTrajectories = trajectories.filter((trajectory) => (trajectory.wallHitIds ?? []).includes(wallHit.id));
    return {
      id: wallHit.id,
      kind: "WallHitAuditEntry",
      wallHit,
      status: wallHit.status ?? "open",
      reflected: relatedReflections.length > 0,
      reflectionIds: relatedReflections.map((reflection) => reflection.id),
      trajectoryIds: relatedTrajectories.map((trajectory) => trajectory.id),
      resolvedByIds: wallHit.resolvedByIds ?? [],
      resolvedAt: wallHit.resolvedAt ?? null
    };
  });

  return {
    count: records.length,
    openCount: records.filter((record) => record.status === "open").length,
    reflectedCount: records.filter((record) => record.reflected).length,
    records
  };
}

function sendJson(response, value, status = 200) {
  send(response, status, `${JSON.stringify(value, null, 2)}\n`, "application/json; charset=utf-8");
}

/**
 * Mask a license key for display in unauthenticated contexts.
 * Shows only the first 4 and last 4 characters; the rest is replaced with *.
 */
function maskKey(key) {
  if (typeof key !== "string" || key.length <= 8) return "****";
  return `${key.slice(0, 4)}${"*".repeat(Math.max(4, key.length - 8))}${key.slice(-4)}`;
}

function send(response, status, body, contentType) {
  if (response.writableEnded || response.destroyed) return;
  response.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"
  });
  response.end(body);
}
