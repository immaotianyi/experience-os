import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const EOS_RELAY_PATH = path.join(sourceRoot, "src", "eosRelayMcp.js");
export const REQUIRED_EOS_TOOLS = Object.freeze([
  "eos_capture_collaboration",
  "eos_prepare_capture_permit",
  "eos_project_readiness",
  "eos_verified_experience",
  "eos_project_timeline"
]);

/**
 * Start the packaged EOS stdio server and complete a real MCP initialize +
 * tools/list exchange. Configuration files alone never count as proof that
 * the relay is callable.
 */
export function probeEosMcpRelay({
  nodePath = process.execPath,
  relayPath = EOS_RELAY_PATH,
  vaultDir,
  timeoutMs = 4_000
} = {}) {
  return new Promise((resolve) => {
    const child = spawn(nodePath, [relayPath], {
      cwd: sourceRoot,
      env: {
        ...process.env,
        ...(vaultDir ? { EOS_VAULT_DIR: vaultDir } : {}),
        EOS_CAPTURE_POLICY: "strict_permit"
      },
      stdio: ["pipe", "pipe", "pipe"]
    });

    let settled = false;
    let stdoutBuffer = "";
    let stderr = "";
    const responses = new Map();

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.stdin.end();
      child.kill();
      resolve(result);
    };

    const inspectResponses = () => {
      const initialized = responses.get(1);
      const listed = responses.get(2);
      if (!initialized || !listed) return;

      const tools = Array.isArray(listed.result?.tools)
        ? listed.result.tools.map((tool) => tool?.name).filter(Boolean)
        : [];
      const missingTools = REQUIRED_EOS_TOOLS.filter((name) => !tools.includes(name));
      const serverInfo = initialized.result?.serverInfo ?? null;
      const protocolVersion = initialized.result?.protocolVersion ?? null;
      const ok = serverInfo?.name === "experience-os-capture-relay" && missingTools.length === 0;

      finish({
        ok,
        serverInfo,
        protocolVersion,
        toolCount: tools.length,
        requiredTools: REQUIRED_EOS_TOOLS,
        missingTools,
        error: ok ? null : "EOS relay did not satisfy the required MCP contract"
      });
    };

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk;
      let newline;
      while ((newline = stdoutBuffer.indexOf("\n")) >= 0) {
        const line = stdoutBuffer.slice(0, newline).trim();
        stdoutBuffer = stdoutBuffer.slice(newline + 1);
        if (!line) continue;
        try {
          const message = JSON.parse(line);
          if (message.id !== undefined) responses.set(message.id, message);
        } catch {
          finish({
            ok: false,
            serverInfo: null,
            protocolVersion: null,
            toolCount: 0,
            requiredTools: REQUIRED_EOS_TOOLS,
            missingTools: REQUIRED_EOS_TOOLS,
            error: "EOS relay emitted non-JSON output on stdout"
          });
          return;
        }
      }
      inspectResponses();
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      finish({
        ok: false,
        serverInfo: null,
        protocolVersion: null,
        toolCount: 0,
        requiredTools: REQUIRED_EOS_TOOLS,
        missingTools: REQUIRED_EOS_TOOLS,
        error: error.message
      });
    });
    child.on("exit", (code) => {
      if (!settled) {
        finish({
          ok: false,
          serverInfo: null,
          protocolVersion: null,
          toolCount: 0,
          requiredTools: REQUIRED_EOS_TOOLS,
          missingTools: REQUIRED_EOS_TOOLS,
          error: stderr.trim() || `EOS relay exited before handshake (code ${code})`
        });
      }
    });

    const timer = setTimeout(() => {
      finish({
        ok: false,
        serverInfo: null,
        protocolVersion: null,
        toolCount: 0,
        requiredTools: REQUIRED_EOS_TOOLS,
        missingTools: REQUIRED_EOS_TOOLS,
        error: `EOS relay handshake timed out after ${timeoutMs}ms`
      });
    }, timeoutMs);

    child.stdin.write(`${JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "eos-compatibility-probe", version: "1.0.0" }
      }
    })}\n`);
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} })}\n`);
  });
}
