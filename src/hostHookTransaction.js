/** Transactional, project-scoped installation and removal of EOS host hooks. */

import { createHash, randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  unlink,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import {
  CURSOR_HOOK_EVENT_MAP,
  CURSOR_STATUS_EVENTS,
  HOST_OBSERVATION_CONFIRMATION_SCOPE,
  STATUS_EVENTS
} from "./hostHookPlan.js";

const PLAN_TTL_MS = 10 * 60 * 1000;
const LOCK_STALE_MS = 30 * 1000;
const LOCK_WAIT_MS = 5 * 1000;
const VERIFIED_HOSTS = new Set(["codex", "claude", "cursor"]);
const isCursor = (host) => host === "cursor";

export async function buildHostHookInstallPlan(hookSpec, {
  workspaceDir,
  consentId,
  captureToken,
  auditDir = null,
  now = new Date()
} = {}) {
  validateHookSpec(hookSpec);
  if (!nonEmptyString(consentId) || !consentId.startsWith("host_consent.")) throw new Error("A valid Host observation consent is required");
  if (!nonEmptyString(captureToken) || !captureToken.startsWith("host_capture.")) throw new Error("A valid Host observation capture credential is required");
  const boundary = await resolveSafeBoundary(workspaceDir, hookSpec.targetPath);
  const secretBoundary = await resolveSafeSecretBoundary(hookSpec.secretRoot, hookSpec.consentFilePath, boundary.workspaceDir);
  const source = await readOptionalFile(boundary.configPath);
  const tokenSource = await readOptionalFile(secretBoundary.tokenPath);
  const root = parseJsonRoot(source.content, boundary.configPath);
  const handler = handlerFromSpec(hookSpec);
  const beforeCounts = countEosHandlers(root, hookSpec.host);
  const nextContent = serialize(mergeEosHooks(root, hookSpec.events, handler, hookSpec.host));
  const desiredTokenContent = serialize({ consentId, captureToken });
  return createPlan({
    operation: "install",
    host: hookSpec.host,
    workspaceDir: boundary.workspaceDir,
    configPath: boundary.configPath,
    source,
    nextContent,
    auditDir,
    now,
    eventNames: hookSpec.events,
    desiredHandler: handler,
    beforeCounts,
    endpoint: endpointFromHandler(representativeHandler(hookSpec.host, handler)),
    consentId,
    captureToken,
    secretRoot: secretBoundary.secretRoot,
    tokenPath: secretBoundary.tokenPath,
    tokenSource,
    desiredTokenContent
  });
}

export async function buildHostHookRemovalPlan({
  host,
  workspaceDir,
  configPath,
  secretRoot,
  tokenPath,
  auditDir = null,
  now = new Date()
}) {
  validateHost(host);
  const boundary = await resolveSafeBoundary(workspaceDir, configPath);
  const secretBoundary = await resolveSafeSecretBoundary(secretRoot, tokenPath, boundary.workspaceDir);
  const source = await readOptionalFile(boundary.configPath);
  const tokenSource = await readOptionalFile(secretBoundary.tokenPath);
  const root = parseJsonRoot(source.content, boundary.configPath);
  const beforeCounts = countEosHandlers(root, host);
  const nextContent = serialize(removeEosHooks(root, host));
  return createPlan({
    operation: "remove",
    host,
    workspaceDir: boundary.workspaceDir,
    configPath: boundary.configPath,
    source,
    nextContent,
    auditDir,
    now,
    eventNames: Object.keys(beforeCounts).filter((eventName) => beforeCounts[eventName] > 0),
    desiredHandler: null,
    beforeCounts,
    endpoint: null,
    consentId: null,
    secretRoot: secretBoundary.secretRoot,
    tokenPath: secretBoundary.tokenPath,
    tokenSource,
    desiredTokenContent: null
  });
}

export async function applyHostHookPlan(plan, {
  approved = false,
  confirmedScope = null,
  verify = verifyAppliedHookPlan
} = {}) {
  validateStoredPlan(plan);
  if (!approved || confirmedScope !== HOST_OBSERVATION_CONFIRMATION_SCOPE) {
    throw new Error("Explicit human approval of metadata-only operational status scope is required");
  }
  if (Date.parse(plan.expiresAt) <= Date.now()) throw new Error("Host Hook plan has expired; build a new plan");

  return withConfigLock(plan.configPath, async () => {
    await resolveSafeBoundary(plan.workspaceDir, plan.configPath);
    await resolveSafeSecretBoundary(plan.secretRoot, plan.tokenPath, plan.workspaceDir);
    const source = await readOptionalFile(plan.configPath);
    const tokenSource = await readOptionalFile(plan.tokenPath);
    if (source.existed !== plan.configExisted || sha256(source.content) !== plan.expectedSourceHash) {
      throw new Error("Host Hook config changed after preview; refusing to apply a stale plan");
    }
    if (tokenSource.existed !== plan.tokenExisted || sha256(tokenSource.content) !== plan.expectedTokenHash) {
      throw new Error("Host Hook consent token changed after preview; refusing to apply a stale plan");
    }
    const nextContent = rebuildPlanContent(plan, source.content);
    if (sha256(nextContent) !== plan.plannedHash) {
      throw new Error("Rebuilt Host Hook config does not match the reviewed plan");
    }

    try {
      await mkdir(path.dirname(plan.configPath), { recursive: true });
      await mkdir(path.dirname(plan.tokenPath), { recursive: true, mode: 0o700 });
      if (plan.backupPath) {
        await mkdir(path.dirname(plan.backupPath), { recursive: true, mode: 0o700 });
        await writeAtomically(plan.backupPath, source.content, 0o600);
      }
      if (plan.operation === "install") await writeAtomically(plan.tokenPath, plan.desiredTokenContent, 0o600);
      else await unlinkIfExists(plan.tokenPath);
      await writeAtomically(plan.configPath, nextContent, 0o600);
    } catch (error) {
      await restoreSource(plan, source.content);
      await restoreToken(plan, tokenSource);
      throw error;
    }

    let verification;
    try {
      verification = normalizeVerification(await verify(plan));
    } catch (error) {
      verification = { ok: false, status: "verification_error", detail: safeDetail(error) };
    }

    let status = plan.operation === "install" ? "installed_pending_host_confirmation" : "removed";
    let rollback = null;
    if (!verification.ok) {
      const afterVerify = await readOptionalFile(plan.configPath);
      const tokenAfterVerify = await readOptionalFile(plan.tokenPath);
      if (sha256(afterVerify.content) !== plan.plannedHash || !tokenMatchesPlan(plan, tokenAfterVerify)) {
        status = "rollback_blocked_concurrent_change";
        rollback = { restored: false, reason: "config_or_token_changed_after_eos_write" };
      } else {
        await restoreSource(plan, source.content);
        await restoreToken(plan, tokenSource);
        status = "rolled_back_after_failed_verification";
        rollback = { restored: true, reason: "hook_structure_verification_failed" };
      }
    }

    const receipt = {
      schemaVersion: "experience-os.dev/host-hook-receipt/v1",
      receiptId: `host-hook-receipt.${randomUUID()}`,
      planId: plan.planId,
      operation: plan.operation,
      host: plan.host,
      configPath: plan.configPath,
      status,
      approvedByHuman: true,
      scope: HOST_OBSERVATION_CONFIRMATION_SCOPE,
      eventNames: [...plan.eventNames],
      sourceHash: plan.expectedSourceHash,
      appliedHash: plan.plannedHash,
      backupPath: plan.backupPath,
      captureTokenHash: plan.captureTokenHash,
      tokenStorage: "external_private_file",
      verification,
      rollback,
      createdAt: new Date().toISOString()
    };
    const receiptPath = await writeAuditReceipt(plan.auditDir, receipt);
    return { ...receipt, receiptPath };
  });
}

export async function verifyAppliedHookPlan(plan) {
  const source = await readOptionalFile(plan.configPath);
  if (!source.existed) return { ok: false, status: "config_missing", detail: "Host config file is missing" };
  const root = parseJsonRoot(source.content, plan.configPath);
  const tokenSource = await readOptionalFile(plan.tokenPath);
  if (plan.operation === "remove") {
    const remaining = Object.values(countEosHandlers(root, plan.host)).reduce((sum, count) => sum + count, 0);
    const tokenRemoved = !tokenSource.existed;
    return {
      ok: remaining === 0 && tokenRemoved,
      status: remaining === 0 && tokenRemoved ? "eos_hooks_and_token_removed" : "eos_hook_removal_unverified",
      detail: remaining === 0 && tokenRemoved
        ? "EOS Hook handlers and private consent token are absent"
        : `${remaining} EOS Hook handlers remain; tokenRemoved=${tokenRemoved}`
    };
  }
  const hooksValid = plan.eventNames.every((eventName) => {
    const configEventName = isCursor(plan.host) ? CURSOR_HOOK_EVENT_MAP[eventName] : eventName;
    const handlers = eosHandlersForEvent(root, configEventName, plan.host);
    const expected = isCursor(plan.host) ? plan.desiredHandler?.[eventName] : plan.desiredHandler;
    return handlers.length === 1 && JSON.stringify(handlers[0]) === JSON.stringify(expected);
  });
  const tokenMode = tokenSource.existed ? (tokenSource.mode & 0o777) : null;
  const tokenValid = tokenSource.existed && sha256(tokenSource.content) === plan.plannedTokenHash && tokenMode === 0o600;
  const valid = hooksValid && tokenValid;
  return {
    ok: valid,
    status: valid ? "hook_and_private_token_verified" : "hook_or_private_token_unverified",
    detail: valid
      ? "EOS operational status handlers and private consent token match the reviewed plan"
      : `hooksValid=${hooksValid}; tokenValid=${tokenValid}; tokenMode=${tokenMode === null ? "missing" : tokenMode.toString(8)}`
  };
}

export async function inspectHostHookInstallation({
  host,
  workspaceDir,
  configPath,
  secretRoot,
  tokenPath,
  expectedConsentId = null,
  expectedCaptureTokenHash = null
}) {
  validateHost(host);
  try {
    const boundary = await resolveSafeBoundary(workspaceDir, configPath);
    const secretBoundary = await resolveSafeSecretBoundary(secretRoot, tokenPath, boundary.workspaceDir);
    const source = await readOptionalFile(boundary.configPath);
    const tokenSource = await readOptionalFile(secretBoundary.tokenPath);
    const tokenMode = tokenSource.existed ? (tokenSource.mode & 0o777) : null;
    const tokenBundle = tokenSource.existed ? parseCredentialBundle(tokenSource.content) : null;
    const tokenReady = tokenSource.existed
      && tokenMode === 0o600
      && nonEmptyString(expectedConsentId)
      && nonEmptyString(expectedCaptureTokenHash)
      && tokenBundle?.consentId === expectedConsentId
      && `sha256:${sha256(tokenBundle.captureToken)}` === expectedCaptureTokenHash;
    if (!source.existed) return { configured: false, tokenReady, eventNames: [], handlerCount: 0, error: null };
    const root = parseJsonRoot(source.content, boundary.configPath);
    const counts = countEosHandlers(root, host);
    const eventNames = Object.keys(counts).filter((eventName) => counts[eventName] > 0);
    const expectedEvents = isCursor(host)
      ? CURSOR_STATUS_EVENTS.map((eosEvent) => CURSOR_HOOK_EVENT_MAP[eosEvent])
      : [...STATUS_EVENTS];
    return {
      configured: expectedEvents.every((eventName) => counts[eventName] === 1),
      tokenReady,
      eventNames,
      handlerCount: Object.values(counts).reduce((sum, count) => sum + count, 0),
      error: null
    };
  } catch (error) {
    return { configured: false, tokenReady: false, eventNames: [], handlerCount: 0, error: safeDetail(error) };
  }
}

function createPlan({
  operation,
  host,
  workspaceDir,
  configPath,
  source,
  nextContent,
  auditDir,
  now,
  eventNames,
  desiredHandler,
  beforeCounts,
  endpoint,
  consentId,
  captureToken,
  secretRoot,
  tokenPath,
  tokenSource,
  desiredTokenContent
}) {
  const createdAt = now.toISOString();
  const representative = desiredHandler ? representativeHandler(host, desiredHandler) : null;
  return {
    schemaVersion: "experience-os.dev/host-hook-plan/v1",
    planId: `host-hook-plan.${randomUUID()}`,
    operation,
    host,
    workspaceDir,
    configPath,
    configExisted: source.existed,
    expectedSourceHash: sha256(source.content),
    plannedHash: sha256(nextContent),
    backupPath: source.existed
      ? path.join(path.dirname(tokenPath), "backups", `${host}-hooks-${timestamp(now)}.json`)
      : null,
    auditDir: auditDir ? path.resolve(auditDir) : null,
    eventNames: [...eventNames],
    desiredHandler: desiredHandler ? cloneJson(desiredHandler) : null,
    secretRoot,
    tokenPath,
    tokenExisted: tokenSource.existed,
    expectedTokenHash: sha256(tokenSource.content),
    plannedTokenHash: desiredTokenContent === null ? null : sha256(desiredTokenContent),
    desiredTokenContent,
    consentId,
    captureToken,
    captureTokenHash: captureToken ? sha256(captureToken) : null,
    createdAt,
    expiresAt: new Date(now.getTime() + PLAN_TTL_MS).toISOString(),
    diffPreview: {
      operation,
      events: [...eventNames],
      beforeEosHandlerCounts: beforeCounts,
      afterEosHandlerCountPerEvent: operation === "install" ? 1 : 0,
      command: representative ? path.basename(commandFromHandler(representative)) : null,
      bridge: representative ? "eosHookBridge.js" : null,
      endpoint,
      consent: operation === "install" ? "private_token_file_mode_0600" : "private_token_file_removed",
      tokenStoredOutsideWorkspace: true,
      preservesUnrelatedHooks: true
    },
    steps: [
      { id: "scope-consent", status: "complete" },
      { id: "preview", status: "complete" },
      { id: "second-human-confirmation", status: "pending" },
      { id: "lock-and-recheck", status: "pending" },
      { id: "backup", status: source.existed ? "pending" : "not-required" },
      { id: "atomic-merge", status: "pending" },
      { id: "structure-verify", status: "pending" },
      { id: "host-confirmation", status: operation === "install" ? "pending" : "not-required" },
      { id: "rollback", status: "available" }
    ]
  };
}

function rebuildPlanContent(plan, sourceContent) {
  const root = parseJsonRoot(sourceContent, plan.configPath);
  return serialize(plan.operation === "install"
    ? mergeEosHooks(root, plan.eventNames, plan.desiredHandler, plan.host)
    : removeEosHooks(root, plan.host));
}

function mergeEosHooks(root, eventNames, handler, host) {
  if (isCursor(host)) {
    const hooks = normalizeHooksRoot(root.hooks, { flat: true });
    for (const eosEvent of eventNames) {
      const cursorEvent = CURSOR_HOOK_EVENT_MAP[eosEvent];
      if (!cursorEvent) throw new Error(`Cursor has no verified hook event for: ${eosEvent}`);
      hooks[cursorEvent] = (hooks[cursorEvent] || []).filter((entry) => !isEosHandler(entry));
      hooks[cursorEvent].push(cloneJson(handler[eosEvent]));
    }
    return { version: 1, ...root, hooks };
  }
  const hooks = normalizeHooksRoot(root.hooks);
  for (const eventName of eventNames) {
    hooks[eventName] = stripEosGroups(hooks[eventName] || []);
    hooks[eventName].push({ hooks: [cloneJson(handler)] });
  }
  return { ...root, hooks };
}

function removeEosHooks(root, host) {
  const hooks = normalizeHooksRoot(root.hooks, { flat: isCursor(host) });
  for (const eventName of Object.keys(hooks)) {
    hooks[eventName] = isCursor(host)
      ? hooks[eventName].filter((entry) => !isEosHandler(entry))
      : stripEosGroups(hooks[eventName]);
  }
  return isCursor(host) ? { ...root, hooks } : { ...root, hooks };
}

function normalizeHooksRoot(value, { flat = false } = {}) {
  if (value === undefined) return {};
  if (!isObject(value)) throw new Error("Host Hook config hooks must be an object");
  const next = {};
  for (const [eventName, entries] of Object.entries(value)) {
    if (!Array.isArray(entries)) throw new Error(`Host Hook event ${eventName} must be an array`);
    next[eventName] = entries.map((entry) => {
      if (!isObject(entry)) throw new Error(`Host Hook event ${eventName} contains an invalid entry`);
      if (!flat && !Array.isArray(entry.hooks)) throw new Error(`Host Hook event ${eventName} contains an invalid group`);
      return cloneJson(entry);
    });
  }
  return next;
}

function stripEosGroups(groups) {
  return groups.flatMap((group) => {
    const remaining = group.hooks.filter((handler) => !isEosHandler(handler));
    return remaining.length ? [{ ...group, hooks: remaining }] : [];
  });
}

function countEosHandlers(root, host) {
  const hooks = normalizeHooksRoot(root.hooks, { flat: isCursor(host) });
  return Object.fromEntries(Object.entries(hooks).map(([eventName, entries]) => [
    eventName,
    (isCursor(host) ? entries : entries.flatMap((group) => group.hooks)).filter(isEosHandler).length
  ]));
}

function eosHandlersForEvent(root, eventName, host) {
  const hooks = normalizeHooksRoot(root.hooks, { flat: isCursor(host) });
  const entries = hooks[eventName] || [];
  return (isCursor(host) ? entries : entries.flatMap((group) => group.hooks)).filter(isEosHandler);
}

function isEosHandler(handler) {
  if (!isObject(handler)) return false;
  if (handler.type !== undefined && handler.type !== "command") return false;
  const command = typeof handler.command === "string" ? handler.command : "";
  const args = Array.isArray(handler.args) ? handler.args.map(String) : [];
  return command.includes("eosHookBridge.js") || args.some((arg) => path.basename(arg) === "eosHookBridge.js");
}

function handlerFromSpec(spec) {
  if (isCursor(spec.host)) {
    const byEvent = {};
    for (const eosEvent of spec.events) {
      const entry = spec.configFragment?.hooks?.[CURSOR_HOOK_EVENT_MAP[eosEvent]]?.[0];
      if (!isObject(entry) || !isEosHandler(entry)) throw new Error("Hook spec does not contain a verified EOS bridge handler");
      byEvent[eosEvent] = cloneJson(entry);
    }
    return byEvent;
  }
  const handlers = spec.events.map((eventName) => spec.configFragment?.hooks?.[eventName]?.[0]?.hooks?.[0]);
  if (handlers.some((handler) => !isEosHandler(handler))) throw new Error("Hook spec does not contain a verified EOS bridge handler");
  const serialized = handlers.map((handler) => JSON.stringify(handler));
  if (!serialized.every((value) => value === serialized[0])) throw new Error("Hook handlers must be identical for all operational status events");
  return cloneJson(handlers[0]);
}

function representativeHandler(host, handler) {
  if (!isCursor(host)) return handler;
  return Object.values(handler || {})[0] || null;
}

function commandFromHandler(handler) {
  return Array.isArray(handler.args) ? handler.command : handler.command.split(" ")[0].replaceAll("'", "");
}

function endpointFromHandler(handler) {
  const values = Array.isArray(handler.args) ? handler.args : shellTokens(handler.command);
  return valueAfter(values, "--endpoint");
}

function shellTokens(command) {
  return String(command).match(/'[^']*'|\S+/g)?.map((item) => item.replace(/^'|'$/g, "")) || [];
}

function valueAfter(values, flag) {
  const index = values.indexOf(flag);
  return index >= 0 ? values[index + 1] || null : null;
}

async function resolveSafeBoundary(workspaceDir, configPath) {
  if (!nonEmptyString(workspaceDir) || !nonEmptyString(configPath)) throw new Error("workspaceDir and configPath are required");
  const workspace = path.resolve(workspaceDir);
  const target = path.resolve(configPath);
  if (target !== workspace && !target.startsWith(`${workspace}${path.sep}`)) throw new Error("Host Hook config must stay inside the workspace");
  const workspaceReal = await realpath(workspace);
  let ancestor = target;
  while (true) {
    try {
      const ancestorReal = await realpath(ancestor);
      if (ancestorReal !== workspaceReal && !ancestorReal.startsWith(`${workspaceReal}${path.sep}`)) {
        throw new Error("Host Hook config resolves outside the workspace");
      }
      break;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      const parent = path.dirname(ancestor);
      if (parent === ancestor) throw error;
      ancestor = parent;
    }
  }
  try {
    if ((await lstat(target)).isSymbolicLink()) throw new Error("Host Hook config cannot be a symbolic link");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return { workspaceDir: workspace, configPath: target };
}

async function resolveSafeSecretBoundary(secretRoot, tokenPath, workspaceDir) {
  if (!nonEmptyString(secretRoot) || !nonEmptyString(tokenPath)) throw new Error("secretRoot and tokenPath are required");
  const root = path.resolve(secretRoot);
  const target = path.resolve(tokenPath);
  const workspace = path.resolve(workspaceDir);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error("Host Hook consent token must stay inside the EOS secret root");
  if (target === workspace || target.startsWith(`${workspace}${path.sep}`)) throw new Error("Host Hook consent token must stay outside the workspace");
  await rejectSymlinkComponents(root, target);
  return { secretRoot: root, tokenPath: target };
}

async function rejectSymlinkComponents(root, target) {
  const relative = path.relative(root, target);
  const segments = relative ? relative.split(path.sep) : [];
  let current = root;
  for (const segment of [null, ...segments]) {
    if (segment !== null) current = path.join(current, segment);
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error("EOS secret path cannot contain symbolic links");
    } catch (error) {
      if (error?.code === "ENOENT") break;
      throw error;
    }
  }
}

async function withConfigLock(configPath, callback) {
  const lockPath = `${configPath}.eos-hook-lock`;
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
      if (Date.now() >= deadline) throw new Error("Host Hook config is busy; no changes were written");
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

async function restoreSource(plan, sourceContent) {
  if (plan.configExisted) await writeAtomically(plan.configPath, sourceContent);
  else await unlinkIfExists(plan.configPath);
}

async function restoreToken(plan, tokenSource) {
  if (tokenSource.existed) await writeAtomically(plan.tokenPath, tokenSource.content, 0o600);
  else await unlinkIfExists(plan.tokenPath);
}

function tokenMatchesPlan(plan, source) {
  if (plan.operation === "remove") return !source.existed;
  return source.existed && sha256(source.content) === plan.plannedTokenHash;
}

async function writeAuditReceipt(auditDir, receipt) {
  if (!auditDir) return null;
  await mkdir(auditDir, { recursive: true });
  const receiptPath = path.join(auditDir, `${receipt.receiptId}.json`);
  await writeAtomically(receiptPath, serialize(receipt));
  return receiptPath;
}

async function writeAtomically(filePath, content, mode = 0o600) {
  const tempPath = `${filePath}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(tempPath, content, { encoding: "utf8", mode });
  await rename(tempPath, filePath);
}

async function readOptionalFile(filePath) {
  try {
    const [content, metadata] = await Promise.all([readFile(filePath, "utf8"), stat(filePath)]);
    return { existed: true, content, mode: metadata.mode };
  } catch (error) {
    if (error?.code === "ENOENT") return { existed: false, content: "", mode: null };
    throw error;
  }
}

function parseJsonRoot(content, filePath) {
  if (!content.trim()) return {};
  let value;
  try { value = JSON.parse(content); } catch (error) { throw new Error(`Cannot parse host Hook JSON at ${filePath}: ${error.message}`); }
  if (!isObject(value)) throw new Error(`Host Hook JSON at ${filePath} must contain an object`);
  return value;
}

function parseCredentialBundle(content) {
  let value;
  try { value = JSON.parse(content); } catch { return null; }
  if (!isObject(value)
    || !nonEmptyString(value.consentId)
    || !nonEmptyString(value.captureToken)
    || !value.consentId.startsWith("host_consent.")
    || !value.captureToken.startsWith("host_capture.")) return null;
  return value;
}

function validateHookSpec(spec) {
  if (!isObject(spec) || spec.status !== "review_required") throw new Error("A verified Hook review spec is required");
  validateHost(spec.host);
  const allowedEvents = isCursor(spec.host) ? CURSOR_STATUS_EVENTS : STATUS_EVENTS;
  if (!Array.isArray(spec.events)
    || spec.events.length !== allowedEvents.length
    || allowedEvents.some((eventName, index) => spec.events[index] !== eventName)) {
    throw new Error("Only the reviewed metadata-only operational status events are permitted");
  }
}

function validateHost(host) {
  if (!VERIFIED_HOSTS.has(host)) throw new Error(`Host Hook transaction is not verified for: ${host}`);
}

function validateStoredPlan(plan) {
  if (!isObject(plan) || plan.schemaVersion !== "experience-os.dev/host-hook-plan/v1") throw new Error("Invalid Host Hook plan");
  validateHost(plan.host);
  if (!['install', 'remove'].includes(plan.operation)) throw new Error("Invalid Host Hook operation");
  if (!nonEmptyString(plan.expectedSourceHash) || !nonEmptyString(plan.plannedHash)) throw new Error("Host Hook plan hashes are required");
  if (!nonEmptyString(plan.expectedTokenHash) || !nonEmptyString(plan.secretRoot) || !nonEmptyString(plan.tokenPath)) throw new Error("Host Hook token transaction metadata is required");
}

function normalizeVerification(result) {
  if (!isObject(result) || typeof result.ok !== "boolean") return { ok: false, status: "invalid_verification_result", detail: "Verifier did not return { ok: boolean }" };
  return { ok: result.ok, status: nonEmptyString(result.status) ? result.status : result.ok ? "verified" : "failed", detail: nonEmptyString(result.detail) ? result.detail : null };
}

function safeDetail(error) {
  const message = String(error?.message || "verification failed");
  return message.length <= 240 ? message : "verification failed";
}

async function unlinkIfExists(filePath) {
  try { await unlink(filePath); } catch (error) { if (error?.code !== "ENOENT") throw error; }
}

function serialize(value) { return `${JSON.stringify(value, null, 2)}\n`; }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function timestamp(date) { return date.toISOString().replace(/[:.]/g, "-"); }
function cloneJson(value) { return JSON.parse(JSON.stringify(value)); }
function nonEmptyString(value) { return typeof value === "string" && value.trim().length > 0; }
function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
