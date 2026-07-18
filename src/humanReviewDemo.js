import path from "node:path";
import { GitVault } from "./gitVault.js";
import { applyReviewDecision, buildHumanReviewPackets } from "./reviewEngine.js";
import { resolveVaultDir } from "./vaultPath.js";

const rootDir = resolveVaultDir("demo");
const vault = new GitVault(rootDir);

await vault.init();

const packets = await buildHumanReviewPackets({ vault });
const decisions = [];

for (const packet of packets) {
  decisions.push(await applyReviewDecision({
    vault,
    packet,
    decision: packet.defaultOption,
    rationale: "demo uses default linear review option"
  }));
}

console.log(JSON.stringify({
  vault: rootDir,
  reviewPackets: packets.map((packet) => ({
    id: packet.id,
    targetKind: packet.targetKind,
    targetId: packet.targetId,
    title: packet.title,
    recommendation: packet.recommendation,
    why: packet.why,
    evidence: packet.evidence,
    risks: packet.risks,
    options: packet.options,
    defaultOption: packet.defaultOption
  })),
  decisions: decisions.map((decision) => ({
    id: decision.id,
    reviewPacketId: decision.reviewPacketId,
    decision: decision.decision,
    resultingStatus: decision.resultingStatus
  }))
}, null, 2));
