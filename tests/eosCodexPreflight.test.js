import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { codexInstallCommand, codexSwitchCommand } from "../src/eosCodexPreflight.js";

describe("EOS Codex preflight", () => {
  it("renders an explicit opt-in command bound to one local Vault", () => {
    const command = codexInstallCommand({
      vaultDir: "/tmp/workspace/.eos/vault",
      nodePath: "/usr/local/bin/node"
    });
    assert.match(command, /^codex mcp add experience-os/);
    assert.match(command, /EOS_VAULT_DIR='\/tmp\/workspace\/\.eos\/vault'/);
    assert.match(command, /EOS_CAPTURE_POLICY=strict_permit/);
    assert.match(command, /'\/usr\/local\/bin\/node'/);
    assert.match(command, /eosRelayMcp\.js/);
  });

  it("renders an explicit remove-then-add command when a different workspace is active", () => {
    const command = codexSwitchCommand({
      vaultDir: "/tmp/next-workspace/.eos/vault",
      nodePath: "/usr/local/bin/node"
    });
    assert.match(command, /^codex mcp remove experience-os 2>\/dev\/null; codex mcp add experience-os/);
    assert.match(command, /EOS_VAULT_DIR='\/tmp\/next-workspace\/\.eos\/vault'/);
  });
});
