/**
 * Test suite for accessControl.js — permission model.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ROLES,
  VISIBILITY,
  DEFAULT_OWNER,
  applyOwnership,
  canRead,
  canEdit,
  canDelete,
  canReview,
  filterReadable,
  contextFromRequest
} from "../src/accessControl.js";

describe("applyOwnership", () => {
  it("adds ownerId and visibility defaults", () => {
    const record = { id: "r1", kind: "Skill" };
    applyOwnership(record);
    assert.equal(record.ownerId, DEFAULT_OWNER);
    assert.equal(record.visibility, VISIBILITY.PRIVATE);
  });

  it("uses context userId when provided", () => {
    const record = { id: "r1", kind: "Skill" };
    applyOwnership(record, { userId: "user1", visibility: VISIBILITY.TEAM });
    assert.equal(record.ownerId, "user1");
    assert.equal(record.visibility, VISIBILITY.TEAM);
  });

  it("preserves existing ownerId", () => {
    const record = { id: "r1", ownerId: "original", visibility: VISIBILITY.PUBLIC };
    applyOwnership(record, { userId: "newuser" });
    assert.equal(record.ownerId, "original");
    assert.equal(record.visibility, VISIBILITY.PUBLIC);
  });
});

describe("canRead", () => {
  it("allows all in single-user mode", () => {
    const record = { ownerId: "someone_else", visibility: VISIBILITY.PRIVATE };
    assert.equal(canRead(record, {}), true);
  });

  it("allows owner to read own private record", () => {
    const record = { ownerId: "user1", visibility: VISIBILITY.PRIVATE };
    assert.equal(canRead(record, { userId: "user1" }), true);
  });

  it("blocks non-owner from reading private record", () => {
    const record = { ownerId: "user1", visibility: VISIBILITY.PRIVATE };
    assert.equal(canRead(record, { userId: "user2" }), false);
  });

  it("allows anyone to read public record", () => {
    const record = { ownerId: "user1", visibility: VISIBILITY.PUBLIC };
    assert.equal(canRead(record, { userId: "user2" }), true);
  });

  it("allows team members to read team record", () => {
    const record = { ownerId: "user1", visibility: VISIBILITY.TEAM };
    assert.equal(canRead(record, { userId: "user2" }), true);
  });
});

describe("canEdit", () => {
  it("allows all in single-user mode", () => {
    assert.equal(canEdit({ ownerId: "x", visibility: VISIBILITY.PRIVATE }, {}), true);
  });

  it("allows owner to edit", () => {
    const record = { ownerId: "user1", visibility: VISIBILITY.PRIVATE };
    assert.equal(canEdit(record, { userId: "user1" }), true);
  });

  it("allows editor to edit team records", () => {
    const record = { ownerId: "user1", visibility: VISIBILITY.TEAM };
    assert.equal(canEdit(record, { userId: "user2", role: ROLES.EDITOR }), true);
  });

  it("blocks editor from editing private records", () => {
    const record = { ownerId: "user1", visibility: VISIBILITY.PRIVATE };
    assert.equal(canEdit(record, { userId: "user2", role: ROLES.EDITOR }), false);
  });

  it("blocks viewer from editing", () => {
    const record = { ownerId: "user1", visibility: VISIBILITY.TEAM };
    assert.equal(canEdit(record, { userId: "user2", role: ROLES.VIEWER }), false);
  });
});

describe("canDelete", () => {
  it("allows all in single-user mode", () => {
    assert.equal(canDelete({ ownerId: "x" }, {}), true);
  });

  it("allows owner to delete", () => {
    assert.equal(canDelete({ ownerId: "user1" }, { userId: "user1" }), true);
  });

  it("blocks non-owner from deleting", () => {
    assert.equal(canDelete({ ownerId: "user1" }, { userId: "user2", role: ROLES.EDITOR }), false);
  });
});

describe("canReview", () => {
  it("allows all in single-user mode", () => {
    assert.equal(canReview({ ownerId: "x" }, {}), true);
  });

  it("allows owner to review", () => {
    assert.equal(canReview({ ownerId: "user1" }, { userId: "user1" }), true);
  });

  it("allows editor to review", () => {
    assert.equal(canReview({ ownerId: "user1" }, { userId: "user2", role: ROLES.EDITOR }), true);
  });

  it("blocks viewer from reviewing", () => {
    assert.equal(canReview({ ownerId: "user1" }, { userId: "user2", role: ROLES.VIEWER }), false);
  });
});

describe("filterReadable", () => {
  it("returns all in single-user mode", () => {
    const records = [
      { ownerId: "a", visibility: VISIBILITY.PRIVATE },
      { ownerId: "b", visibility: VISIBILITY.PUBLIC }
    ];
    assert.equal(filterReadable(records, {}).length, 2);
  });

  it("filters by read permission in multi-user mode", () => {
    const records = [
      { ownerId: "user1", visibility: VISIBILITY.PRIVATE },
      { ownerId: "user1", visibility: VISIBILITY.TEAM },
      { ownerId: "user1", visibility: VISIBILITY.PUBLIC },
      { ownerId: "other", visibility: VISIBILITY.PRIVATE }
    ];
    const filtered = filterReadable(records, { userId: "user2" });
    assert.equal(filtered.length, 2); // team + public
  });
});

describe("contextFromRequest", () => {
  it("returns null when no user headers", () => {
    assert.equal(contextFromRequest({ headers: {} }), null);
  });

  it("extracts user context from headers", () => {
    const ctx = contextFromRequest({
      headers: { "x-user-id": "user1", "x-user-role": "editor" }
    });
    assert.equal(ctx.userId, "user1");
    assert.equal(ctx.role, ROLES.EDITOR);
  });

  it("defaults role to viewer", () => {
    const ctx = contextFromRequest({
      headers: { "x-user-id": "user1" }
    });
    assert.equal(ctx.role, ROLES.VIEWER);
  });
});

describe("constants", () => {
  it("ROLES has 3 roles", () => {
    assert.equal(Object.keys(ROLES).length, 3);
  });

  it("VISIBILITY has 3 levels", () => {
    assert.equal(Object.keys(VISIBILITY).length, 3);
  });
});
