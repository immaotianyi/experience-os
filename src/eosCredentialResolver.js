/**
 * Host capture credential resolution shared by observation collectors
 * (session-log watcher, AgentBar protocol reader).
 *
 * A collector may only report observations for a host when the current Vault
 * holds an active metadata-only consent and the matching host_capture token
 * file exists on disk. Resolution failures degrade that host only and are
 * retried on a throttle.
 */

import path from "node:path";
import os from "node:os";
import { readFile } from "node:fs/promises";
import { mcpRelayTokenPath, hostObservationTokenPath } from "./hostHookPlan.js";

export const CREDENTIAL_RETRY_MS = 60_000;

export function inferWorkspaceDir(vaultDir) {
  if (typeof vaultDir !== "string" || !vaultDir.trim()) return null;
  const resolved = path.resolve(vaultDir);
  const eosDir = path.dirname(resolved);
  if (path.basename(eosDir) !== ".eos") return null;
  return path.dirname(eosDir);
}

export function createHostCredentialResolver({ listConsents, secretRoot, now = Date.now, log = () => {} } = {}) {
  if (typeof listConsents !== "function") throw new Error("listConsents is required");

  const credentials = new Map();
  const retryAt = new Map();

  function tokenPathFor(host, workspaceDir) {
    for (const build of [mcpRelayTokenPath, hostObservationTokenPath]) {
      try {
        return build(host, workspaceDir, secretRoot);
      } catch {
        continue;
      }
    }
    throw new Error(`token path is not verified for host: ${host}`);
  }

  return {
    async resolve(host, workspaceDir) {
      const nowMs = now();
      if (credentials.has(host)) return credentials.get(host);
      if (nowMs < (retryAt.get(host) || 0)) return null;
      retryAt.set(host, nowMs + CREDENTIAL_RETRY_MS);
      try {
        const consents = await listConsents();
        const candidates = (consents || []).filter((item) =>
          item?.host === host && item?.status === "active" && item?.scope === "metadata_only"
        );
        if (candidates.length === 0) return null;

        // The Core's own vault is an aggregator (work/vaults), so the caller's
        // workspaceDir may be null. Consents aggregated from registered
        // workspaces carry vaultDir; prefer each consent's own workspace when
        // deriving the token path, and accept the first workspace that holds a
        // valid host_capture token.
        const workspaceDirs = [];
        for (const consent of candidates) {
          const dir = inferWorkspaceDir(String(consent.vaultDir || ""));
          if (dir && !workspaceDirs.includes(dir)) workspaceDirs.push(dir);
        }
        if (workspaceDir && !workspaceDirs.includes(workspaceDir)) workspaceDirs.push(workspaceDir);

        let lastError = null;
        for (const dir of workspaceDirs) {
          let tokenPath;
          try {
            tokenPath = tokenPathFor(host, dir);
          } catch {
            continue;
          }
          try {
            const raw = (await readFile(tokenPath, "utf8")).trim();
            let consentId = null;
            let captureToken = null;
            try {
              const parsed = JSON.parse(raw);
              if (parsed && typeof parsed.captureToken === "string") {
                consentId = typeof parsed.consentId === "string" ? parsed.consentId : null;
                captureToken = parsed.captureToken;
              }
            } catch {
              captureToken = raw;
            }
            if (!captureToken || !captureToken.startsWith("host_capture.")) {
              throw new Error(`token file is not a host_capture credential: ${tokenPath}`);
            }
            const matched = consentId
              ? candidates.find((item) => item.id === consentId) || candidates[0]
              : candidates[0];
            const credential = { consentId: matched.id, captureToken, workspaceDir: dir };
            credentials.set(host, credential);
            return credential;
          } catch (error) {
            lastError = error;
          }
        }
        if (lastError) throw lastError;
        throw new Error("no active consent resolves to a workspace with a host_capture token");
      } catch (error) {
        log(`credential for ${host} unavailable: ${safeDetail(error)}`);
        return null;
      }
    }
  };
}

function safeDetail(error) {
  return String(error?.message || error || "unknown").slice(0, 200);
}
