/**
 * Self-observation for MCP-only hosts (TRAE, Cursor, VS Code).
 *
 * These hosts expose no lifecycle hooks, but they do spawn this relay as
 * their MCP server. The relay's own protocol lifecycle therefore mirrors the
 * host session: initialize -> SessionStart, tools/call -> tool activity,
 * stdin close -> SessionEnd. Reports reuse the consented, token-gated
 * host-observation pipeline and must never block or break MCP responses.
 */

import path from "node:path";
import os from "node:os";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import http from "node:http";
import { buildMcpRelayObservation } from "./hostObservationEngine.js";
import { MCP_RELAY_HOSTS, mcpRelayTokenPath } from "./hostHookPlan.js";

const DEFAULT_ENDPOINT = "http://127.0.0.1:4173";
const REPORT_TIMEOUT_MS = 900;

export function createRelayObserver({
  vault,
  vaultDir,
  endpoint = process.env.EOS_HOOK_ENDPOINT || DEFAULT_ENDPOINT,
  secretRoot = process.env.EOS_SECRET_ROOT || path.join(os.homedir(), ".experience-os", "secrets"),
  fetchImpl = globalThis.fetch,
  now = () => new Date()
} = {}) {
  const host = String(process.env.EOS_RELAY_HOST || "").trim().toLowerCase();
  if (!host) return disabledObserver(null);
  if (!MCP_RELAY_HOSTS.has(host)) return disabledObserver(host, "host is not an MCP relay observation host");

  const workspaceDir = inferWorkspaceDir(vaultDir);
  if (!workspaceDir) {
    return disabledObserver(host, `vault does not follow <workspace>/.eos/vault: ${vaultDir}`);
  }
  if (typeof fetchImpl !== "function") return disabledObserver(host, "fetch is unavailable");

  const sessionId = `mcp.${process.pid}.${randomBytes(8).toString("hex")}`;
  const hashSalt = randomBytes(32).toString("hex");
  let credential = null;
  let credentialResolved = false;
  let sessionEnded = false;

  async function resolveCredential() {
    if (credentialResolved) return credential;
    credentialResolved = true;
    try {
      const consent = (await vault.list("HostObservationConsent"))
        .find((item) => item?.host === host && item?.status === "active");
      if (!consent) throw new Error(`no active ${host} observation consent in this Vault`);
      const tokenPath = mcpRelayTokenPath(host, workspaceDir, secretRoot);
      const captureToken = (await readFile(tokenPath, "utf8")).trim();
      if (!captureToken.startsWith("host_capture.")) {
        throw new Error(`token file is not a host_capture credential: ${tokenPath}`);
      }
      credential = { consentId: consent.id, captureToken };
    } catch (error) {
      note(`host observation inactive: ${safeDetail(error)}`);
    }
    return credential;
  }

  async function send(eventName, { turnId = null, toolName = null } = {}) {
    const active = await resolveCredential();
    if (!active) return;
    try {
      const observation = buildMcpRelayObservation(host, eventName, {
        sessionId,
        turnId,
        toolName,
        hashSalt,
        now: now()
      });
      const url = `${endpoint}/api/host-observations`;
      const body = JSON.stringify({
        consentId: active.consentId,
        captureToken: active.captureToken,
        observation
      });
      // Production posts use a one-shot connection: pooled keep-alive sockets
      // can be black-holed after an idle gap, silently losing SessionEnd.
      // Tests inject their own fetchImpl, which still goes through fetch.
      const response = fetchImpl === globalThis.fetch
        ? await httpPostOnce(url, body, REPORT_TIMEOUT_MS)
        : await fetchImpl(url, {
            method: "POST",
            headers: { "content-type": "application/json", accept: "application/json" },
            body,
            signal: AbortSignal.timeout(REPORT_TIMEOUT_MS)
          });
      if (!response.ok) note(`EOS returned HTTP ${response.status} for ${eventName}`);
    } catch (error) {
      // Observational only; never disturb the MCP session.
      note(`report ${eventName} failed: ${safeDetail(error)}`);
    }
  }

  return {
    host,
    enabled: true,
    report(eventName, meta = {}) {
      if (sessionEnded && eventName !== "SessionEnd") return;
      void send(eventName, meta);
    },
    async close() {
      if (sessionEnded) return;
      sessionEnded = true;
      await send("SessionEnd");
      // One bounded retry: transient network drops must not lose SessionEnd.
      // The Core dedups identical observations, so a double send is safe.
      await new Promise((resolve) => setTimeout(resolve, 250));
      await send("SessionEnd");
    }
  };
}

function disabledObserver(host, reason) {
  if (host && reason) {
    note(`host observation for ${host} inactive: ${reason}`);
  }
  return { host: host || null, enabled: false, report() {}, async close() {} };
}

function inferWorkspaceDir(vaultDir) {
  if (typeof vaultDir !== "string" || !vaultDir.trim()) return null;
  const resolved = path.resolve(vaultDir);
  const eosDir = path.dirname(resolved);
  if (path.basename(eosDir) !== ".eos") return null;
  return path.dirname(eosDir);
}

function httpPostOnce(urlString, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const payload = Buffer.from(body);
    const request = http.request({
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "content-length": payload.length,
        connection: "close"
      },
      agent: false
    }, (response) => {
      response.resume();
      response.on("end", () => resolve({
        ok: response.statusCode >= 200 && response.statusCode < 300,
        status: response.statusCode
      }));
    });
    request.setTimeout(timeoutMs, () => request.destroy(new Error(`report timed out after ${timeoutMs}ms`)));
    request.on("error", reject);
    request.end(payload);
  });
}

function note(message) {
  process.stderr.write(`[EOS Relay] ${message}\n`);
}

function safeDetail(error) {
  return String(error?.message || error || "unknown error").slice(0, 200);
}
