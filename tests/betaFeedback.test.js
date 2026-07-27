import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { GitVault } from "../src/gitVault.js";
import { submitBetaFeedback } from "../src/betaFeedback.js";
import { validateRecord } from "../src/validate.js";

let directories = [];
afterEach(async () => {
  await Promise.all(directories.map((directory) => rm(directory, { recursive: true, force: true })));
  directories = [];
});

describe("Beta feedback", () => {
  it("stores only a consented, bounded product report", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "eos-beta-feedback-"));
    directories.push(directory);
    const vault = new GitVault(directory);
    await vault.init();
    const feedback = await submitBetaFeedback(vault, {
      consent: true, participantId: "tester-01", stage: "after_trying", usefulness: 4, clarity: 3,
      wouldUseAgain: "yes", helped: "The review queue was clear.", blocked: "", contact: ""
    });
    assert.equal(feedback.kind, "BetaFeedback");
    assert.equal(feedback.contact, null);
    assert.equal(validateRecord(feedback).length, 0);
    assert.equal((await vault.list("BetaFeedback")).length, 1);
  });

  it("requires explicit consent and valid ratings", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "eos-beta-feedback-"));
    directories.push(directory);
    const vault = new GitVault(directory);
    await vault.init();
    await assert.rejects(() => submitBetaFeedback(vault, { stage: "after_trying", usefulness: 5, clarity: 5, wouldUseAgain: "yes" }), /consent/);
    await assert.rejects(() => submitBetaFeedback(vault, { consent: true, stage: "after_trying", usefulness: 6, clarity: 5, wouldUseAgain: "yes" }), /usefulness/);
  });
});
