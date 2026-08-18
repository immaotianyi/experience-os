import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { probeEosMcpRelay, REQUIRED_EOS_TOOLS } from "../src/eosMcpProbe.js";

describe("probeEosMcpRelay", () => {
  it("completes a real initialize and tools/list handshake", async () => {
    const result = await probeEosMcpRelay();

    assert.equal(result.ok, true);
    assert.equal(result.serverInfo.name, "experience-os-capture-relay");
    assert.equal(result.protocolVersion, "2024-11-05");
    assert.ok(result.toolCount >= REQUIRED_EOS_TOOLS.length);
    assert.deepEqual(result.missingTools, []);
  });

  it("fails closed when the relay executable is missing", async () => {
    const result = await probeEosMcpRelay({
      nodePath: "/nonexistent/eos-node",
      timeoutMs: 100
    });

    assert.equal(result.ok, false);
    assert.ok(result.error);
    assert.deepEqual(result.missingTools, REQUIRED_EOS_TOOLS);
  });
});
