import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCapturePermitRequest,
  listCapturePermitRequests,
  approveCapturePermitRequest,
  claimCapturePermit,
  restoreCapturePermit,
  getCapturePermitStatus,
  listCapturePermitActivity
} from "../src/capturePermitStore.js";

let directories = [];
afterEach(async () => {
  await Promise.all(directories.map((directory) => rm(directory, { recursive: true, force: true })));
  directories = [];
});

async function eosDir() {
  const directory = await mkdtemp(path.join(tmpdir(), "eos-permit-"));
  directories.push(directory);
  return path.join(directory, ".eos");
}

describe("strict capture permits", () => {
  it("keeps a complete request outside the Vault until a human issues one permit", async () => {
    const root = await eosDir();
    const request = await createCapturePermitRequest(root, {
      projectId: "project.permit", actor: "codex", sourceTool: "codex", content: "Keep the migration test and its failure note."
    });
    const pending = await listCapturePermitRequests(root, "project.permit");
    assert.equal(pending.length, 1);
    assert.equal(pending[0].contentPreview, "Keep the migration test and its failure note.");

    await approveCapturePermitRequest(root, { id: request.id, projectId: "project.permit", approvedBy: "human" });
    assert.equal((await getCapturePermitStatus(root, request.id, "project.permit")).status, "issued");

    await assert.rejects(
      claimCapturePermit(root, { id: request.id, projectId: "project.permit", actor: "codex", sourceTool: "terminal", content: request.contentPreview }),
      /source tool/
    );
    assert.equal((await getCapturePermitStatus(root, request.id, "project.permit")).status, "issued");

    await claimCapturePermit(root, { id: request.id, projectId: "project.permit", actor: "codex", sourceTool: "codex", content: request.contentPreview });
    assert.equal((await getCapturePermitStatus(root, request.id, "project.permit")).status, "consumed");
    assert.equal(await restoreCapturePermit(root, request.id), true);
    assert.equal((await getCapturePermitStatus(root, request.id, "project.permit")).status, "issued");
  });

  it("fails closed when two callers try to spend the same permit", async () => {
    const root = await eosDir();
    const request = await createCapturePermitRequest(root, {
      projectId: "project.permit", actor: "codex", sourceTool: "codex", content: "One-time content."
    });
    await approveCapturePermitRequest(root, { id: request.id, projectId: "project.permit", approvedBy: "human" });
    const claim = () => claimCapturePermit(root, {
      id: request.id, projectId: "project.permit", actor: "codex", sourceTool: "codex", content: "One-time content."
    });
    const outcomes = await Promise.allSettled([claim(), claim()]);
    assert.equal(outcomes.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(outcomes.filter((result) => result.status === "rejected").length, 1);
    assert.equal((await getCapturePermitStatus(root, request.id, "project.permit")).status, "consumed");
  });

  it("rejects a fragment a human cannot read in full", async () => {
    const root = await eosDir();
    await assert.rejects(
      createCapturePermitRequest(root, { projectId: "project.permit", actor: "codex", sourceTool: "codex", content: "x".repeat(601) }),
      /limited to 600 characters/
    );
  });

  it("expires unused permits into a visible local audit state", async () => {
    const root = await eosDir();
    const request = await createCapturePermitRequest(root, {
      projectId: "project.permit", actor: "codex", sourceTool: "codex", content: "Expire this one-time request."
    });
    await approveCapturePermitRequest(root, { id: request.id, projectId: "project.permit", approvedBy: "human", ttlMs: 1 });
    const activity = await listCapturePermitActivity(root, "project.permit", 12, Date.now() + 10_000);
    assert.equal(activity[0].id, request.id);
    assert.equal(activity[0].status, "expired");
    assert.equal((await getCapturePermitStatus(root, request.id, "project.permit")).status, "expired");
    await assert.rejects(
      claimCapturePermit(root, { id: request.id, projectId: "project.permit", actor: "codex", sourceTool: "codex", content: "Expire this one-time request." }),
      /issued capture permit not found|expired/
    );
  });
});
