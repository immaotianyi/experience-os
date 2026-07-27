import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GitVault } from "./gitVault.js";
import { createLLMAdapter } from "./llmAdapter.js";
import { buildAttentionSnapshot } from "./attentionStatus.js";
import { submitBetaFeedback } from "./betaFeedback.js";
import { applyReviewDecision } from "./reviewEngine.js";
import { validateVault } from "./validate.js";
import { archiveVaultCandidates, buildVaultMaintenancePreview } from "./vaultMaintenance.js";
import { latest, slug } from "./utils.js";
import { exportSkillAsMcpServer, exportAllStableSkills } from "./mcpExporter.js";
import { buildLocalIndex, searchIndex, importSkill, getSkillMetadata, listCategories } from "./skillRegistry.js";
import { assignReviewers, submitVote, addDiscussionComment, checkConfirmationStatus, finalizeTeamReview, getReviewSummary } from "./teamReviewEngine.js";
import { applyOwnership, canRead, canEdit, canReview, filterReadable, contextFromRequest } from "./accessControl.js";
import { checkPlatformHealth, tryStartPlatform, getInstallInstructions } from "./eosPlatformAdapter.js";
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
const betaFeedbackAttempts = new Map();

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

async function handleApi(request, url, response) {
  if (url.pathname === "/api/health") {
    sendJson(response, {
      ok: true,
      service: "experience-os",
      mode: deploymentMode,
      generatedAt: new Date().toISOString()
    });
    return;
  }

  if (url.pathname === "/api/platforms" && request.method === "GET") {
    try {
      const health = await checkPlatformHealth();
      for (const name of Object.keys(health.platforms)) {
        try {
          health.platforms[name].instructions = getInstallInstructions(name);
        } catch { /* unknown platform — skip instructions */ }
      }
      sendJson(response, health);
    } catch (error) {
      sendJson(response, { error: error.message }, 500);
    }
    return;
  }

  if (url.pathname.startsWith("/api/platforms/") && url.pathname.endsWith("/start") && request.method === "POST") {
    const name = url.pathname.slice("/api/platforms/".length, -"/start".length);
    try {
      const body = await readJsonBody(request).catch(() => ({}));
      const result = await tryStartPlatform(name, body || {});
      sendJson(response, result);
    } catch (error) {
      sendJson(response, { started: false, message: error.message }, 400);
    }
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
    attempts.push(now);
    betaFeedbackAttempts.set(address, attempts);
    try {
      const feedback = await submitBetaFeedback(vault, await readJsonBody(request));
      sendJson(response, { ok: true, id: feedback.id }, 201);
    } catch (error) {
      sendJson(response, { error: error.message }, 400);
    }
    return;
  }

  if (url.pathname === "/api/beta-feedback" && request.method === "GET") {
    const records = latest(await vault.list("BetaFeedback"), 100);
    const userContext = contextFromRequest(request);
    const isAdmin = !userContext || userContext.role === "admin";
    const safe = isAdmin ? records : records.map((r) => { const { contact, ...rest } = r; return rest; });
    sendJson(response, { kind: "BetaFeedback", records: safe });
    return;
  }

  if (url.pathname === "/api/beta-feedback/export" && request.method === "GET") {
    const userContext = contextFromRequest(request);
    if (userContext && userContext.role !== "admin") {
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
    sendJson(response, exported);
    return;
  }

  // Support both singular and plural paths for backward compatibility
  if (request.method === "POST" && (url.pathname === "/api/review-decisions" || url.pathname === "/api/review-decision")) {
    sendJson(response, await handleReviewDecision(request));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/vault-archive") {
    sendJson(response, await handleVaultArchive(request));
    return;
  }

  if (request.method === "POST" && (url.pathname === "/api/wallhit-resolutions" || url.pathname === "/api/wallhit-resolution")) {
    sendJson(response, await handleWallHitResolution(request));
    return;
  }

  if (request.method === "POST" && (url.pathname === "/api/reuse-feedback" || url.pathname === "/api/experience-reuse-trials" || url.pathname === "/api/experience-reuse-trials/complete" || url.pathname === "/api/skill-registry/import" || url.pathname === "/api/mcp/export" || url.pathname === "/api/mcp/export-all" || url.pathname.startsWith("/api/team-review/") || url.pathname.startsWith("/api/marketplace/") || url.pathname.startsWith("/api/quality/") || url.pathname.startsWith("/api/pricing/") || url.pathname.startsWith("/api/transaction/") || url.pathname === "/api/projects" || url.pathname === "/api/project" || url.pathname === "/api/evidence" || url.pathname === "/api/experience-receipts" || url.pathname === "/api/experience-receipt-drafts" || url.pathname === "/api/experience-receipt-drafts/accept" || url.pathname === "/api/experience-receipt-drafts/reject" || url.pathname === "/api/experience-receipt-drafts/defer" || url.pathname === "/api/experience-receipt-drafts/resume" || url.pathname === "/api/decisions" || url.pathname === "/api/outcomes" || url.pathname === "/api/relay/events" || url.pathname === "/api/work-checkpoints" || url.pathname === "/api/experience-assets" || url.pathname === "/api/capture-permits/approve" || url.pathname === "/api/capture-permits/reject")) {
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
    const [drafts, reviewPackets, wallHits] = await Promise.all([
      vault.list("ExperienceReceiptDraft"),
      vault.list("ReviewPacket"),
      vault.list("WallHit")
    ]);
    let permits = [];
    try {
      permits = await listCapturePermitRequests(requireWorkspaceEosDir());
    } catch (error) {
      if (!String(error.message).includes("bootstrapped workspace Vault")) throw error;
    }
    sendJson(response, buildAttentionSnapshot({ permits, drafts, reviewPackets, wallHits, llm: llmRuntimeStatus() }));
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
        applyOwnership(listing, userContext);
        await vault.save(listing);
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
      if (userContext && userContext.role !== "admin" && tx.buyerId !== userContext.userId && tx.sellerId !== userContext.userId) {
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
    sendJson(response, { count: filtered.length, transactions: filtered });
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
    sendJson(response, result);
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
    sendJson(response, tx);
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
    applyOwnership(reviewDecision, userContext);
    await vault.save(reviewDecision);
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
    if (!contentType.includes("application/json")) {
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
    totalRevenue: Math.round(completedTransactions.reduce((acc, t) => acc + (t.amount || 0), 0) * 100) / 100
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

function send(response, status, body, contentType) {
  if (response.writableEnded || response.destroyed) return;
  response.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "permissions-policy": "camera=(), microphone=(), geolocation=()"
  });
  response.end(body);
}
