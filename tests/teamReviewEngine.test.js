/**
 * Test suite for teamReviewEngine.js — assignee, votes, discussion, finalize.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { GitVault } from "../src/gitVault.js";
import { createProject, createReviewPacket } from "../src/domain.js";
import {
  DEFAULT_TEAM_THRESHOLD,
  VOTE_TYPES,
  assignReviewers,
  submitVote,
  addDiscussionComment,
  checkConfirmationStatus,
  finalizeTeamReview,
  getReviewSummary
} from "../src/teamReviewEngine.js";

let tempDir;
let vault;

before(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "eos-team-review-test-"));
  vault = new GitVault(tempDir);
  await vault.init();

  const project = createProject({ id: "project.team_review_test", name: "TRT", goal: "G" });
  await vault.save(project);
});

after(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

function makePacket(overrides = {}) {
  return createReviewPacket({
    id: `review_packet.team_test.${Date.now()}`,
    projectId: "project.team_review_test",
    targetKind: "Skill",
    targetId: "skill.test_target",
    title: "Team Review Test",
    recommendation: "approve",
    why: "testing",
    options: [{ id: "approve_candidate", label: "Approve" }],
    defaultOption: "approve_candidate",
    ...overrides
  });
}

describe("assignReviewers", () => {
  it("adds assignees to packet", () => {
    const packet = makePacket();
    assignReviewers(packet, ["user1", "user2"]);
    assert.ok(packet.assigneeIds.includes("user1"));
    assert.ok(packet.assigneeIds.includes("user2"));
  });

  it("does not duplicate assignees", () => {
    const packet = makePacket();
    assignReviewers(packet, ["user1", "user2"]);
    assignReviewers(packet, ["user1", "user3"]);
    assert.equal(packet.assigneeIds.length, 3);
  });
});

describe("submitVote", () => {
  it("records an approval vote", () => {
    const packet = makePacket();
    assignReviewers(packet, ["user1"]);
    submitVote(packet, { userId: "user1", vote: VOTE_TYPES.APPROVE, comment: "looks good" });
    assert.equal(packet.votes.length, 1);
    assert.equal(packet.votes[0].vote, VOTE_TYPES.APPROVE);
    assert.equal(packet.votes[0].comment, "looks good");
  });

  it("rejects vote from non-assignee", () => {
    const packet = makePacket();
    assignReviewers(packet, ["user1"]);
    assert.throws(
      () => submitVote(packet, { userId: "intruder", vote: VOTE_TYPES.APPROVE }),
      /not an assignee/
    );
  });

  it("rejects invalid vote type", () => {
    const packet = makePacket();
    assignReviewers(packet, ["user1"]);
    assert.throws(
      () => submitVote(packet, { userId: "user1", vote: "invalid" }),
      /Invalid vote type/
    );
  });

  it("allows changing vote (mutable)", () => {
    const packet = makePacket();
    assignReviewers(packet, ["user1"]);
    submitVote(packet, { userId: "user1", vote: VOTE_TYPES.APPROVE });
    submitVote(packet, { userId: "user1", vote: VOTE_TYPES.REJECT });
    assert.equal(packet.votes.length, 1);
    assert.equal(packet.votes[0].vote, VOTE_TYPES.REJECT);
  });
});

describe("addDiscussionComment", () => {
  it("adds a comment with mentions", () => {
    const packet = makePacket();
    addDiscussionComment(packet, { userId: "user1", message: "@user2 what do you think?", mentions: "user2" });
    assert.equal(packet.discussion.length, 1);
    assert.ok(packet.discussion[0].mentions.includes("user2"));
  });

  it("generates unique comment IDs", () => {
    const packet = makePacket();
    addDiscussionComment(packet, { userId: "user1", message: "first" });
    addDiscussionComment(packet, { userId: "user1", message: "second" });
    assert.notEqual(packet.discussion[0].id, packet.discussion[1].id);
  });
});

describe("checkConfirmationStatus", () => {
  it("returns not ready when below threshold", () => {
    const packet = makePacket();
    assignReviewers(packet, ["user1", "user2"]);
    submitVote(packet, { userId: "user1", vote: VOTE_TYPES.APPROVE });
    const status = checkConfirmationStatus(packet);
    assert.equal(status.ready, false);
    assert.equal(status.approvals, 1);
    assert.equal(status.threshold, DEFAULT_TEAM_THRESHOLD);
  });

  it("returns ready when approvals reach threshold", () => {
    const packet = makePacket();
    assignReviewers(packet, ["user1", "user2"]);
    submitVote(packet, { userId: "user1", vote: VOTE_TYPES.APPROVE });
    submitVote(packet, { userId: "user2", vote: VOTE_TYPES.APPROVE });
    const status = checkConfirmationStatus(packet);
    assert.equal(status.ready, true);
  });

  it("returns ready on early rejection", () => {
    const packet = makePacket();
    assignReviewers(packet, ["user1", "user2"]);
    submitVote(packet, { userId: "user1", vote: VOTE_TYPES.REJECT });
    const status = checkConfirmationStatus(packet);
    assert.equal(status.ready, true);
  });

  it("uses threshold=1 in solo mode", () => {
    const packet = makePacket();
    // No assignees = solo mode
    const status = checkConfirmationStatus(packet);
    assert.equal(status.threshold, 1);
  });
});

describe("finalizeTeamReview", () => {
  it("finalizes approved review", async () => {
    const packet = makePacket();
    await vault.save(packet);
    assignReviewers(packet, ["user1", "user2"]);
    submitVote(packet, { userId: "user1", vote: VOTE_TYPES.APPROVE });
    submitVote(packet, { userId: "user2", vote: VOTE_TYPES.APPROVE });
    await vault.save(packet);

    const { decision, packet: updated } = await finalizeTeamReview({
      packet,
      vault,
      finalDecisionBy: "user1"
    });

    assert.equal(decision.decision, "approve_candidate");
    assert.equal(updated.status, "decided");
    assert.ok(updated.decisionId);
    assert.ok(decision.teamReview);
    assert.equal(decision.teamReview.finalizedBy, "user1");
  });

  it("finalizes rejected review", async () => {
    const packet = makePacket({ id: `review_packet.team_reject.${Date.now()}` });
    await vault.save(packet);
    assignReviewers(packet, ["user1", "user2"]);
    submitVote(packet, { userId: "user1", vote: VOTE_TYPES.REJECT, comment: "bad" });
    await vault.save(packet);

    const { decision } = await finalizeTeamReview({ packet, vault });
    assert.equal(decision.decision, "reject_candidate");
    assert.equal(decision.resultingStatus, "rejected");
  });

  it("throws when not ready", async () => {
    const packet = makePacket({ id: `review_packet.team_notready.${Date.now()}` });
    assignReviewers(packet, ["user1", "user2"]);
    submitVote(packet, { userId: "user1", vote: VOTE_TYPES.APPROVE });
    // Only 1 approval, threshold 2

    await assert.rejects(
      finalizeTeamReview({ packet, vault }),
      /not ready/
    );
  });
});

describe("getReviewSummary", () => {
  it("returns complete summary", () => {
    const packet = makePacket();
    assignReviewers(packet, ["user1", "user2", "user3"]);
    submitVote(packet, { userId: "user1", vote: VOTE_TYPES.APPROVE });
    submitVote(packet, { userId: "user2", vote: VOTE_TYPES.REJECT });
    submitVote(packet, { userId: "user3", vote: VOTE_TYPES.ABSTAIN });
    addDiscussionComment(packet, { userId: "user1", message: "comment" });

    const summary = getReviewSummary(packet);
    assert.equal(summary.assignees.length, 3);
    assert.equal(summary.approvals, 1);
    assert.equal(summary.rejections, 1);
    assert.equal(summary.abstentions, 1);
    assert.equal(summary.discussion.length, 1);
    assert.ok(summary.threshold >= 1);
  });
});
