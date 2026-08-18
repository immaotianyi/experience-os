/**
 * Non-blocking metadata-only bridge for Codex and Claude Code hooks.
 *
 * Hook JSON is normalized inside this short-lived process. Only the allowlisted
 * observation is sent to EOS; raw hook input is never written or transmitted.
 */

import { stdin, stderr } from "node:process";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { normalizeHostHookEvent } from "./hostObservationEngine.js";

const MAX_STDIN_BYTES = 256 * 1024;

export async function runHookBridge({
  host,
  consentId,
  captureToken,
  endpoint = "http://127.0.0.1:4173",
  input,
  eventName = null,
  fetchImpl = globalThis.fetch,
  timeoutMs = 1200
}) {
  try {
    if (typeof fetchImpl !== "function") throw new Error("fetch is unavailable");
    const safeEndpoint = assertLoopbackEndpoint(endpoint);
    let payload = typeof input === "string" ? parseInput(input) : input;
    // Cursor native payloads do not carry the event name; the registered hook
    // entry passes it explicitly so normalization stays deterministic.
    if (eventName && isPlainObject(payload) && payload.hook_event_name === undefined) {
      payload = { ...payload, hook_event_name: eventName };
    }
    if (typeof captureToken !== "string" || !captureToken.startsWith("host_capture.")) throw new Error("capture credential is required");
    const observation = normalizeHostHookEvent(host, payload, { hashSalt: captureToken });
    const response = await fetchImpl(`${safeEndpoint}/api/host-observations`, {
      method: "POST",
      headers: { "content-type": "application/json", "accept": "application/json" },
      body: JSON.stringify({ consentId, captureToken, observation }),
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) throw new Error(`EOS returned HTTP ${response.status}`);
    return { ok: true, delivered: true, eventName: observation.eventName };
  } catch (error) {
    return {
      ok: false,
      delivered: false,
      // Hooks are observational and must never block the host's work.
      exitCode: 0,
      error: safeBridgeError(error)
    };
  }
}

export function assertLoopbackEndpoint(endpoint) {
  let parsed;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new Error("EOS Hook endpoint must be a valid loopback URL");
  }
  const loopbackHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);
  if (parsed.protocol !== "http:" || !loopbackHosts.has(parsed.hostname)) {
    throw new Error("EOS Hook endpoint must use local HTTP loopback");
  }
  if (parsed.username || parsed.password || (parsed.pathname && parsed.pathname !== "/") || parsed.search || parsed.hash) {
    throw new Error("EOS Hook endpoint must be an origin without credentials or path");
  }
  return parsed.origin;
}

async function readStdin(stream) {
  const chunks = [];
  let total = 0;
  for await (const chunk of stream) {
    total += chunk.length;
    if (total > MAX_STDIN_BYTES) throw new Error("Hook payload exceeds the metadata bridge input limit");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function parseInput(input) {
  if (Buffer.byteLength(input, "utf8") > MAX_STDIN_BYTES) throw new Error("Hook payload exceeds the metadata bridge input limit");
  try {
    return JSON.parse(input);
  } catch {
    throw new Error("Hook payload is not valid JSON");
  }
}

function safeBridgeError(error) {
  const message = String(error?.message || "Hook bridge failed");
  if (message.startsWith("EOS returned HTTP")) return message;
  if (message.includes("required") || message.includes("Unsupported") || message.includes("not valid") || message.includes("input limit") || message.includes("not verified") || message.includes("loopback") || message.includes("without credentials")) {
    return message;
  }
  return "EOS is unavailable; metadata observation was skipped";
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function readConsentTokenFile(filePath) {
  if (typeof filePath !== "string" || !filePath.trim()) throw new Error("consent token file is required");
  const content = await readFile(filePath, "utf8");
  if (Buffer.byteLength(content, "utf8") > 4096) throw new Error("consent token file is too large");
  let bundle;
  try {
    bundle = JSON.parse(content);
  } catch {
    throw new Error("consent token file is invalid");
  }
  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)
    || typeof bundle.consentId !== "string" || !bundle.consentId.startsWith("host_consent.")
    || typeof bundle.captureToken !== "string" || !bundle.captureToken.startsWith("host_capture.")
    || bundle.consentId.length > 512 || bundle.captureToken.length > 512) {
    throw new Error("consent token file is invalid");
  }
  return { consentId: bundle.consentId, captureToken: bundle.captureToken };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const host = argValue("--host");
  const consentFile = argValue("--consent-file");
  const eventName = argValue("--event");
  const endpoint = argValue("--endpoint") || process.env.EOS_HOOK_ENDPOINT || "http://127.0.0.1:4173";
  Promise.all([
    readStdin(stdin),
    consentFile
      ? readConsentTokenFile(consentFile)
      : Promise.resolve({
          consentId: argValue("--consent-id") || process.env.EOS_HOST_OBSERVATION_CONSENT_ID,
          captureToken: argValue("--capture-token") || process.env.EOS_HOST_OBSERVATION_CAPTURE_TOKEN
        })
  ])
    .then(([input, credential]) => runHookBridge({ host, ...credential, endpoint, input, eventName }))
    .then((result) => {
      if (!result.ok) stderr.write(`[EOS Hook] ${result.error}\n`);
      process.exitCode = 0;
    })
    .catch(() => {
      stderr.write("[EOS Hook] Hook payload could not be read; observation skipped\n");
      process.exitCode = 0;
    });
}
