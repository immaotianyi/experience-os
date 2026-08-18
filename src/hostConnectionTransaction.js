/**
 * Transactional JSON host configuration for EOS MCP registration.
 *
 * Plans are read-only and bounded. Apply requires an explicit human approval,
 * rechecks the source hash under a lock, writes atomically, verifies, and only
 * rolls back when doing so cannot overwrite a concurrent host change.
 */

import { createHash, randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  unlink,
  writeFile
} from "node:fs/promises";
import path from "node:path";

const PLAN_TTL_MS = 10 * 60 * 1000;
const LOCK_STALE_MS = 30 * 1000;
const LOCK_WAIT_MS = 5 * 1000;
const JSON_SERVER_KEYS = new Set(["mcpServers", "servers"]);

export async function buildHostConnectionPlan({
  target,
  configPath,
  desiredServer,
  serverName = "experience-os",
  serverKey = "mcpServers",
  auditDir = null,
  now = new Date()
}) {
  validatePlanInput({ target, configPath, desiredServer, serverName, serverKey });
  const absolutePath = path.resolve(configPath);
  const source = await readOptionalFile(absolutePath);
  const root = parseJsonRoot(source.content, absolutePath);
  const servers = isObject(root[serverKey]) ? root[serverKey] : {};
  const currentServer = isObject(servers[serverName]) ? servers[serverName] : null;
  const nextContent = mergeServer(root, serverKey, serverName, desiredServer);
  const createdAt = now.toISOString();

  return {
    schemaVersion: "experience-os.dev/host-connection-plan/v1",
    planId: `connection-plan.${randomUUID()}`,
    target,
    configPath: absolutePath,
    configFormat: "json",
    serverKey,
    serverName,
    desiredServer: cloneJson(desiredServer),
    configExisted: source.existed,
    expectedSourceHash: sha256(source.content),
    plannedHash: sha256(nextContent),
    backupPath: source.existed ? `${absolutePath}.eos-backup.${timestamp(now)}` : null,
    auditDir: auditDir ? path.resolve(auditDir) : null,
    createdAt,
    expiresAt: new Date(now.getTime() + PLAN_TTL_MS).toISOString(),
    diffPreview: {
      operation: currentServer ? "replace" : "add",
      serverKey,
      serverName,
      before: redactServer(currentServer),
      after: redactServer(desiredServer)
    },
    steps: [
      { id: "detect", status: "complete" },
      { id: "preview", status: "complete" },
      { id: "human-approval", status: "pending" },
      { id: "lock-and-recheck", status: "pending" },
      { id: "backup", status: source.existed ? "pending" : "not-required" },
      { id: "atomic-write", status: "pending" },
      { id: "host-verify", status: "pending" },
      { id: "rollback", status: "available" }
    ]
  };
}

export async function applyHostConnectionPlan(plan, { approved = false, verify } = {}) {
  validateStoredPlan(plan);
  if (!approved) throw new Error("Explicit human approval is required to apply a host connection plan");
  if (Date.parse(plan.expiresAt) <= Date.now()) throw new Error("Host connection plan has expired; build a new plan");
  if (typeof verify !== "function") throw new Error("A host verification callback is required");

  return withConfigLock(plan.configPath, async () => {
    const source = await readOptionalFile(plan.configPath);
    const currentHash = sha256(source.content);
    if (currentHash !== plan.expectedSourceHash || source.existed !== plan.configExisted) {
      throw new Error("Host config changed after preview; refusing to apply a stale plan");
    }

    const root = parseJsonRoot(source.content, plan.configPath);
    const nextContent = mergeServer(root, plan.serverKey, plan.serverName, plan.desiredServer);
    const appliedHash = sha256(nextContent);
    if (appliedHash !== plan.plannedHash) {
      throw new Error("Rebuilt host config does not match the reviewed plan");
    }

    await mkdir(path.dirname(plan.configPath), { recursive: true });
    if (plan.backupPath) await writeAtomically(plan.backupPath, source.content);
    await writeAtomically(plan.configPath, nextContent);

    let verification;
    try {
      verification = normalizeVerification(await verify({
        target: plan.target,
        configPath: plan.configPath,
        serverName: plan.serverName
      }));
    } catch (error) {
      verification = { ok: false, status: "verification_error", detail: error.message };
    }

    let status = "verified";
    let rollback = null;
    if (!verification.ok) {
      const afterVerify = await readOptionalFile(plan.configPath);
      if (sha256(afterVerify.content) !== appliedHash) {
        status = "rollback_blocked_concurrent_change";
        rollback = {
          restored: false,
          reason: "config_changed_after_eos_write"
        };
      } else {
        await restoreSource(plan, source.content);
        status = "rolled_back_after_failed_verification";
        rollback = {
          restored: true,
          reason: "host_verification_failed"
        };
      }
    }

    const receipt = {
      schemaVersion: "experience-os.dev/host-connection-receipt/v1",
      receiptId: `connection-receipt.${randomUUID()}`,
      planId: plan.planId,
      target: plan.target,
      configPath: plan.configPath,
      serverName: plan.serverName,
      status,
      approvedByHuman: true,
      sourceHash: plan.expectedSourceHash,
      appliedHash,
      backupPath: plan.backupPath,
      verification,
      rollback,
      createdAt: new Date().toISOString()
    };
    const receiptPath = await writeAuditReceipt(plan.auditDir, receipt);
    return { ...receipt, receiptPath };
  });
}

function validatePlanInput({ target, configPath, desiredServer, serverName, serverKey }) {
  if (!nonEmptyString(target)) throw new Error("target is required");
  if (!nonEmptyString(configPath)) throw new Error("configPath is required");
  if (!nonEmptyString(serverName)) throw new Error("serverName is required");
  if (!JSON_SERVER_KEYS.has(serverKey)) throw new Error(`Unsupported JSON MCP server key: ${serverKey}`);
  if (!isObject(desiredServer) || !nonEmptyString(desiredServer.command)) {
    throw new Error("desiredServer.command is required");
  }
  if (desiredServer.args !== undefined && !stringArray(desiredServer.args)) {
    throw new Error("desiredServer.args must be an array of strings");
  }
  if (desiredServer.env !== undefined && !stringRecord(desiredServer.env)) {
    throw new Error("desiredServer.env must contain string values");
  }
}

function validateStoredPlan(plan) {
  if (!isObject(plan) || plan.schemaVersion !== "experience-os.dev/host-connection-plan/v1") {
    throw new Error("Invalid host connection plan");
  }
  validatePlanInput(plan);
  if (!nonEmptyString(plan.expectedSourceHash) || !nonEmptyString(plan.plannedHash)) {
    throw new Error("Host connection plan hashes are required");
  }
}

function mergeServer(root, serverKey, serverName, desiredServer) {
  const servers = isObject(root[serverKey]) ? root[serverKey] : {};
  const next = {
    ...root,
    [serverKey]: {
      ...servers,
      [serverName]: cloneJson(desiredServer)
    }
  };
  return `${JSON.stringify(next, null, 2)}\n`;
}

async function restoreSource(plan, sourceContent) {
  if (plan.configExisted) {
    await writeAtomically(plan.configPath, sourceContent);
  } else {
    await unlinkIfExists(plan.configPath);
  }
}

async function withConfigLock(configPath, callback) {
  const lockPath = `${configPath}.eos-lock`;
  const deadline = Date.now() + LOCK_WAIT_MS;
  await mkdir(path.dirname(configPath), { recursive: true });
  while (true) {
    try {
      await mkdir(lockPath, { recursive: false });
      break;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      if (await isStaleLock(lockPath)) {
        await rm(lockPath, { recursive: true, force: true });
        continue;
      }
      if (Date.now() >= deadline) throw new Error("Host config is busy; no changes were written");
      await delay(25);
    }
  }
  try {
    return await callback();
  } finally {
    await rm(lockPath, { recursive: true, force: true });
  }
}

async function isStaleLock(lockPath) {
  try {
    return Date.now() - (await stat(lockPath)).mtimeMs > LOCK_STALE_MS;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function writeAuditReceipt(auditDir, receipt) {
  if (!auditDir) return null;
  await mkdir(auditDir, { recursive: true });
  const receiptPath = path.join(auditDir, `${receipt.receiptId}.json`);
  await writeAtomically(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receiptPath;
}

async function writeAtomically(filePath, content) {
  const tempPath = `${filePath}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(tempPath, content, "utf8");
  await rename(tempPath, filePath);
}

async function readOptionalFile(filePath) {
  try {
    return { existed: true, content: await readFile(filePath, "utf8") };
  } catch (error) {
    if (error?.code === "ENOENT") return { existed: false, content: "" };
    throw error;
  }
}

function parseJsonRoot(content, filePath) {
  if (!content.trim()) return {};
  let value;
  try {
    value = JSON.parse(content);
  } catch (error) {
    throw new Error(`Cannot parse host JSON config at ${filePath}: ${error.message}`);
  }
  if (!isObject(value)) throw new Error(`Host JSON config at ${filePath} must contain an object`);
  return value;
}

function redactServer(server) {
  if (!server) return null;
  return {
    command: server.command ?? null,
    args: Array.isArray(server.args) ? [...server.args] : [],
    envKeys: isObject(server.env) ? Object.keys(server.env).sort() : []
  };
}

function normalizeVerification(result) {
  if (!isObject(result) || typeof result.ok !== "boolean") {
    return { ok: false, status: "invalid_verification_result", detail: "Verifier did not return { ok: boolean }" };
  }
  return {
    ok: result.ok,
    status: nonEmptyString(result.status) ? result.status : result.ok ? "verified" : "failed",
    detail: nonEmptyString(result.detail) ? result.detail : null
  };
}

async function unlinkIfExists(filePath) {
  try {
    await unlink(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function timestamp(date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function stringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function stringRecord(value) {
  return isObject(value) && Object.values(value).every((item) => typeof item === "string");
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
