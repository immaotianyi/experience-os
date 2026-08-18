/**
 * Metadata-only host observation for lifecycle hooks.
 *
 * Raw prompts, responses, tool arguments/results, transcript paths, and cwd
 * never belong to this model. The hook process normalizes locally, and this
 * engine reconstructs an allowlisted record before writing to the Vault.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import {
  HOST_OBSERVATION_HOSTS,
  HOST_OBSERVATION_EVENTS,
  createHostObservationConsent,
  createHostObservation
} from "./domain.js";
import { validateHostObservation, validateHostObservationConsent } from "./validate.js";

const SUPPORTED_HOOK_HOSTS = new Set(["codex", "claude", "cursor"]);
const SUPPORTED_MCP_RELAY_HOSTS = new Set(["trae", "cursor", "vscode"]);
const MCP_RELAY_EVENTS = new Set(["SessionStart", "PreToolUse", "PostToolUse", "PostToolUseFailure", "SessionEnd"]);
const ALLOWED_EVENTS = new Set(HOST_OBSERVATION_EVENTS);

export function normalizeHostHookEvent(host, payload, { hashSalt, now = new Date() } = {}) {
  if (!SUPPORTED_HOOK_HOSTS.has(host)) {
    throw new Error(`Metadata hook normalization is not verified for host: ${host}`);
  }
  if (!isObject(payload)) throw new Error("Hook payload must be a JSON object");
  if (!nonEmptyString(hashSalt)) throw new Error("hashSalt is required");

  // Cursor native payloads carry conversation_id/generation_id and no event-name
  // field; the bridge injects hook_event_name from its --event argument.
  const cursorField = (eosField, cursorField) =>
    host === "cursor" && payload[eosField] === undefined ? payload[cursorField] : payload[eosField];

  const eventName = boundedString(payload.hook_event_name, "hook_event_name", 80);
  if (!ALLOWED_EVENTS.has(eventName)) throw new Error(`Unsupported hook event: ${eventName}`);
  const sessionId = boundedString(cursorField("session_id", "conversation_id"), "session_id", 512);
  const turnId = optionalBoundedString(cursorField("turn_id", "generation_id"), 512);
  const toolName = optionalBoundedString(payload.tool_name, 120);
  const permissionMode = optionalBoundedString(payload.permission_mode, 80);

  return {
    host,
    eventName,
    eventCategory: categoryForEvent(eventName),
    sessionHash: hashOpaque(sessionId, hashSalt),
    turnHash: turnId ? hashOpaque(turnId, hashSalt) : null,
    toolName,
    permissionMode,
    outcome: outcomeForEvent(eventName),
    observedAt: now.toISOString()
  };
}

/**
 * Build one metadata-only observation for MCP-only hosts (TRAE, Cursor,
 * VS Code). Their relay process is spawned by the host itself, so its
 * protocol lifecycle is the host session lifecycle. Same allowlisted shape
 * as hook events; no content fields exist at this boundary.
 */
export function buildMcpRelayObservation(host, eventName, {
  sessionId,
  turnId = null,
  toolName = null,
  permissionMode = null,
  hashSalt,
  now = new Date()
} = {}) {
  if (!SUPPORTED_MCP_RELAY_HOSTS.has(host)) {
    throw new Error(`MCP relay observation is not verified for host: ${host}`);
  }
  if (!MCP_RELAY_EVENTS.has(eventName)) throw new Error(`Unsupported MCP relay event: ${eventName}`);
  if (!nonEmptyString(hashSalt)) throw new Error("hashSalt is required");
  const session = boundedString(sessionId, "sessionId", 512);
  return {
    host,
    eventName,
    eventCategory: categoryForEvent(eventName),
    sessionHash: hashOpaque(session, hashSalt),
    turnHash: turnId ? hashOpaque(boundedString(turnId, "turnId", 512), hashSalt) : null,
    toolName: optionalBoundedString(toolName, 120),
    permissionMode: optionalBoundedString(permissionMode, 80),
    outcome: outcomeForEvent(eventName),
    observedAt: now.toISOString()
  };
}

export async function approveHostObservationConsent(vault, {
  projectId,
  host,
  approvedBy,
  metadataOnlyAcknowledged = false
}) {
  requireString(projectId, "projectId");
  requireString(approvedBy, "approvedBy");
  if (!HOST_OBSERVATION_HOSTS.includes(host)) throw new Error("host is invalid");
  if (metadataOnlyAcknowledged !== true) {
    throw new Error("Human must explicitly acknowledge metadata-only observation");
  }
  if (!(await vault.load("Project", projectId))) throw new Error("project not found");

  const active = (await vault.list("HostObservationConsent"))
    .find((item) => item.projectId === projectId && item.host === host && item.status === "active");
  const captureToken = `host_capture.${randomBytes(32).toString("hex")}`;
  const timestamp = new Date().toISOString();
  const consent = active
    ? {
        ...active,
        approvedBy,
        approvedAt: timestamp,
        captureTokenHash: digestCaptureToken(captureToken),
        updatedAt: timestamp
      }
    : createHostObservationConsent({
        id: `host_consent.${host}.${randomBytes(12).toString("hex")}`,
        projectId,
        host,
        approvedBy,
        captureTokenHash: digestCaptureToken(captureToken)
      });
  assertValid(validateHostObservationConsent(consent));
  await vault.save(consent);
  return { ...consent, captureToken };
}

export async function revokeHostObservationConsent(vault, { consentId, projectId, revokedBy }) {
  requireString(consentId, "consentId");
  requireString(projectId, "projectId");
  requireString(revokedBy, "revokedBy");
  const consent = await vault.load("HostObservationConsent", consentId);
  if (!consent || consent.projectId !== projectId) throw new Error("host observation consent not found");
  if (consent.status === "revoked") return consent;
  const revokedAt = new Date().toISOString();
  const revoked = {
    ...consent,
    status: "revoked",
    captureTokenHash: null,
    revokedBy,
    revokedAt,
    updatedAt: revokedAt
  };
  assertValid(validateHostObservationConsent(revoked));
  await vault.save(revoked);
  return revoked;
}

export async function recordHostObservation(vault, { consentId, captureToken, observation }) {
  requireString(consentId, "consentId");
  if (!isObject(observation)) throw new Error("observation is required");
  const consent = await vault.load("HostObservationConsent", consentId);
  if (!consent || consent.status !== "active" || consent.scope !== "metadata_only") {
    throw new Error("active metadata-only host observation consent is required");
  }
  if (!verifyHostObservationCaptureToken(consent, captureToken)) {
    throw new Error("valid host observation capture credential is required");
  }
  if (observation.host !== consent.host) throw new Error("observation host does not match consent");
  if (!ALLOWED_EVENTS.has(observation.eventName)) throw new Error("observation event is not verified");
  if (!(await vault.load("Project", consent.projectId))) throw new Error("project not found");

  const duplicate = (await vault.list("HostObservation")).find((item) =>
    item.consentId === consentId
    && item.eventName === observation.eventName
    && item.sessionHash === observation.sessionHash
    && (item.turnHash ?? null) === (observation.turnHash ?? null)
  );
  if (duplicate) return duplicate;

  const record = createHostObservation({
    id: `host_observation.${consent.host}.${Date.now()}.${randomBytes(6).toString("hex")}`,
    projectId: consent.projectId,
    host: consent.host,
    eventName: observation.eventName,
    eventCategory: categoryForEvent(observation.eventName),
    sessionHash: observation.sessionHash,
    turnHash: observation.turnHash ?? null,
    toolName: observation.toolName ?? null,
    permissionMode: observation.permissionMode ?? null,
    outcome: outcomeForEvent(observation.eventName),
    consentId,
    observedAt: new Date().toISOString()
  });
  assertValid(validateHostObservation(record));
  await vault.save(record);
  return record;
}

export function verifyHostObservationCaptureToken(consent, captureToken) {
  if (!nonEmptyString(consent?.captureTokenHash) || !nonEmptyString(captureToken)) return false;
  const expected = Buffer.from(consent.captureTokenHash, "utf8");
  const actual = Buffer.from(digestCaptureToken(captureToken), "utf8");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function listHostObservations(vault, { projectId = null, host = null, limit = 100 } = {}) {
  const records = await vault.list("HostObservation");
  return records
    .filter((item) => (!projectId || item.projectId === projectId) && (!host || item.host === host))
    .sort((a, b) => String(b.observedAt).localeCompare(String(a.observedAt)))
    .slice(0, Math.max(1, Math.min(Number(limit) || 100, 500)));
}

function categoryForEvent(eventName) {
  if (eventName.includes("Session") || eventName.includes("Subagent")) return "session";
  if (eventName.includes("Tool") || eventName.includes("Permission")) return "tool";
  if (eventName === "UserPromptSubmit" || eventName.startsWith("Stop")) return "turn";
  return "lifecycle";
}

function outcomeForEvent(eventName) {
  if (eventName === "PostToolUse") return "success";
  if (eventName === "PostToolUseFailure" || eventName === "StopFailure" || eventName === "PermissionDenied") return "failure";
  return "unknown";
}

function hashOpaque(value, salt) {
  return `sha256:${createHash("sha256").update(`${salt}\0${value}`, "utf8").digest("hex")}`;
}

function digestCaptureToken(value) {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function boundedString(value, field, maxLength) {
  if (!nonEmptyString(value)) throw new Error(`${field} is required`);
  if (value.length > maxLength) throw new Error(`${field} is too long`);
  return value.trim();
}

function optionalBoundedString(value, maxLength) {
  if (value === null || value === undefined || value === "") return null;
  if (!nonEmptyString(value) || value.length > maxLength) return null;
  return value.trim();
}

function assertValid(issues) {
  if (issues.length) throw new Error(issues.join("; "));
}

function requireString(value, field) {
  if (!nonEmptyString(value)) throw new Error(`${field} is required`);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
