/**
 * Human-issued, content-bound permits for strict external capture.
 * Pending requests are local transient staging, never Vault records or Git
 * history. An approved permit is one-time: claim it before capture, restore it
 * only when the Vault transaction fails.
 */

import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, rename, readdir, rm } from "node:fs/promises";
import path from "node:path";

const STATES = ["pending", "issued", "consumed", "rejected", "expired"];
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const MAX_CAPTURE_CONTENT_LENGTH = 600;

function ensureString(value, name) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${name} is required`);
  return value.trim();
}

function permitRoot(eosDir) {
  return path.join(eosDir, "capture-permits");
}

function stateDir(eosDir, state) {
  return path.join(permitRoot(eosDir), state);
}

function recordPath(eosDir, state, id) {
  return path.join(stateDir(eosDir, state), `${id}.json`);
}

function hashContent(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

async function initialize(eosDir) {
  await Promise.all(STATES.map((state) => mkdir(stateDir(eosDir, state), { recursive: true })));
}

async function load(eosDir, state, id) {
  try {
    return JSON.parse(await readFile(recordPath(eosDir, state, id), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function move(eosDir, from, to, id, record) {
  await initialize(eosDir);
  const fromPath = recordPath(eosDir, from, id);
  const toPath = recordPath(eosDir, to, id);
  const tempPath = `${toPath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tempPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  await rename(tempPath, toPath);
  await rm(fromPath, { force: true });
}

async function readStateRecords(eosDir, state) {
  const files = await readdir(stateDir(eosDir, state));
  return Promise.all(files.filter((file) => file.endsWith(".json")).map(async (file) => {
    try { return JSON.parse(await readFile(path.join(stateDir(eosDir, state), file), "utf8")); } catch { return null; }
  }));
}

function activityTimestamp(record) {
  return record.claimedAt || record.expiredAt || record.rejectedAt || record.issuedAt || record.requestedAt || "";
}

export async function createCapturePermitRequest(eosDir, { projectId, actor, content, sourceTool, sourceRef = null, title = null, notes = "" }) {
  ensureString(projectId, "projectId");
  ensureString(actor, "actor");
  ensureString(content, "content");
  ensureString(sourceTool, "sourceTool");
  if (content.length > MAX_CAPTURE_CONTENT_LENGTH) {
    throw new Error(`strict capture requests are limited to ${MAX_CAPTURE_CONTENT_LENGTH} characters; split the fragment so a human can review all of it`);
  }
  await initialize(eosDir);
  const id = `capture_permit.${Date.now()}.${randomBytes(5).toString("hex")}`;
  const record = {
    id,
    status: "pending",
    projectId,
    actor,
    sourceTool,
    sourceRef,
    title: title?.trim() || content.trim().slice(0, 80),
    notes: String(notes || "").trim(),
    // Strict review means the human can inspect the complete requested text,
    // never a truncated preview that could hide material content.
    contentPreview: content,
    contentHash: hashContent(content),
    requestedAt: new Date().toISOString()
  };
  await writeFile(recordPath(eosDir, "pending", id), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return record;
}

export async function listCapturePermitRequests(eosDir, projectId = null) {
  await initialize(eosDir);
  const records = await readStateRecords(eosDir, "pending");
  return records.filter((record) => record && (!projectId || record.projectId === projectId)).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

/** Move issued permits that can no longer be used into an explicit audit state. */
export async function expireIssuedCapturePermits(eosDir, now = Date.now()) {
  await initialize(eosDir);
  const issuedRecords = await readStateRecords(eosDir, "issued");
  const expired = [];
  for (const record of issuedRecords.filter(Boolean)) {
    if (!record.expiresAt || Date.parse(record.expiresAt) > now) continue;
    const expiredRecord = { ...record, status: "expired", expiredAt: new Date(now).toISOString() };
    try {
      // Rename is the state transition: it cannot race a successful claim
      // without one side observing a missing issued file.
      await rename(recordPath(eosDir, "issued", record.id), recordPath(eosDir, "expired", record.id));
      await writeFile(recordPath(eosDir, "expired", record.id), `${JSON.stringify(expiredRecord, null, 2)}\n`, "utf8");
      expired.push(expiredRecord);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return expired;
}

/**
 * Read a human-facing local permit audit trail. It intentionally returns only
 * permit metadata; the full approved fragment remains visible in the Vault
 * once captured, or in the pending review card before approval.
 */
export async function listCapturePermitActivity(eosDir, projectId, limit = 12, now = Date.now()) {
  await expireIssuedCapturePermits(eosDir, now);
  await initialize(eosDir);
  const records = (await Promise.all(STATES.map((state) => readStateRecords(eosDir, state)))).flat()
    .filter((record) => record?.projectId === projectId)
    .map((record) => ({
      id: record.id,
      status: record.status,
      title: record.title,
      actor: record.actor,
      sourceTool: record.sourceTool,
      requestedAt: record.requestedAt,
      issuedAt: record.issuedAt ?? null,
      expiresAt: record.expiresAt ?? null,
      claimedAt: record.claimedAt ?? null,
      rejectedAt: record.rejectedAt ?? null,
      expiredAt: record.expiredAt ?? null
    }))
    .sort((a, b) => activityTimestamp(b).localeCompare(activityTimestamp(a)));
  return records.slice(0, Math.max(1, Math.min(Number(limit) || 12, 100)));
}

export async function approveCapturePermitRequest(eosDir, { id, projectId, approvedBy, ttlMs = DEFAULT_TTL_MS }) {
  ensureString(id, "permit id");
  ensureString(projectId, "projectId");
  ensureString(approvedBy, "approvedBy");
  const pending = await load(eosDir, "pending", id);
  if (!pending || pending.projectId !== projectId) throw new Error("pending capture request not found for this project");
  const issuedAt = new Date();
  const issued = {
    ...pending,
    status: "issued",
    approvedBy,
    issuedAt: issuedAt.toISOString(),
    expiresAt: new Date(issuedAt.getTime() + ttlMs).toISOString()
  };
  await move(eosDir, "pending", "issued", id, issued);
  return issued;
}

export async function rejectCapturePermitRequest(eosDir, { id, projectId, rejectedBy }) {
  ensureString(id, "permit id");
  ensureString(projectId, "projectId");
  ensureString(rejectedBy, "rejectedBy");
  const pending = await load(eosDir, "pending", id);
  if (!pending || pending.projectId !== projectId) throw new Error("pending capture request not found for this project");
  const rejected = { ...pending, status: "rejected", rejectedBy, rejectedAt: new Date().toISOString() };
  await move(eosDir, "pending", "rejected", id, rejected);
  return rejected;
}

export async function claimCapturePermit(eosDir, { id, projectId, actor, content, sourceTool }) {
  ensureString(id, "permit id");
  ensureString(projectId, "projectId");
  ensureString(actor, "actor");
  ensureString(content, "content");
  ensureString(sourceTool, "sourceTool");
  const issued = await load(eosDir, "issued", id);
  if (!issued || issued.projectId !== projectId) throw new Error("issued capture permit not found for this project");
  if (Date.parse(issued.expiresAt) <= Date.now()) {
    await expireIssuedCapturePermits(eosDir);
    throw new Error("capture permit has expired");
  }
  if (issued.contentHash !== hashContent(content)) throw new Error("capture content does not match the human-approved permit");
  if (issued.actor !== actor) throw new Error("capture actor does not match the human-approved permit");
  if (issued.sourceTool !== sourceTool) throw new Error("capture source tool does not match the human-approved permit");
  const claimed = { ...issued, status: "consumed", claimedAt: new Date().toISOString() };
  try {
    // Claim by renaming the source file first: only one concurrent caller can
    // remove issued/<id>.json, so permits cannot be double-spent.
    await rename(recordPath(eosDir, "issued", id), recordPath(eosDir, "consumed", id));
    await writeFile(recordPath(eosDir, "consumed", id), `${JSON.stringify(claimed, null, 2)}\n`, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") throw new Error("capture permit was already used");
    throw error;
  }
  return claimed;
}

export async function restoreCapturePermit(eosDir, id) {
  const consumed = await load(eosDir, "consumed", id);
  if (!consumed) return false;
  if (Date.parse(consumed.expiresAt) <= Date.now()) return false;
  const restored = { ...consumed, status: "issued", restoredAt: new Date().toISOString() };
  delete restored.claimedAt;
  try {
    await rename(recordPath(eosDir, "consumed", id), recordPath(eosDir, "issued", id));
  } catch (error) {
    if (error.code === "ENOENT") return false; // Already moved by another process
    throw error;
  }
  await writeFile(recordPath(eosDir, "issued", id), `${JSON.stringify(restored, null, 2)}\n`, "utf8");
  return true;
}

export async function getCapturePermitStatus(eosDir, id, projectId) {
  for (const state of STATES) {
    const record = await load(eosDir, state, id);
    if (record && record.projectId === projectId) return { id, status: state, expiresAt: record.expiresAt ?? null };
  }
  return null;
}
