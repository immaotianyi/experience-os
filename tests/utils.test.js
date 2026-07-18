/**
 * Test suite for utils.js — slug, latest, unique.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { slug, safeIdSlug, latest, unique } from "../src/utils.js";

describe("slug", () => {
  it("lowercases and replaces non-alphanumeric", () => {
    assert.equal(slug("Hello World"), "hello_world");
  });

  it("handles Chinese characters", () => {
    assert.equal(slug("非线性思想"), "非线性思想");
  });

  it("handles mixed content", () => {
    assert.equal(slug("Skill: 非线性 transfer"), "skill_非线性_transfer");
  });

  it("trims leading/trailing underscores", () => {
    assert.equal(slug("  spaces  "), "spaces");
  });

  it("truncates to 48 chars", () => {
    const long = "a".repeat(100);
    assert.equal(slug(long).length, 48);
  });

  it("wraps non-string input with String()", () => {
    assert.equal(slug(123), "123");
    assert.equal(slug(null), "null");
  });

  it("encodes non-ASCII slugs for filesystem-safe record IDs", () => {
    assert.equal(safeIdSlug("非线性思想"), "u975eu7ebfu6027u601du60f3");
    assert.equal(safeIdSlug("Skill: 非线性 transfer"), "skill_u975eu7ebfu6027_transfer");
  });
});

describe("latest", () => {
  it("returns most recent by updatedAt", () => {
    const records = [
      { id: "a", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
      { id: "b", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-03-01T00:00:00Z" },
      { id: "c", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-02-01T00:00:00Z" }
    ];
    const result = latest(records, 2);
    assert.equal(result[0].id, "b");
    assert.equal(result[1].id, "c");
  });

  it("falls back to createdAt when no updatedAt", () => {
    const records = [
      { id: "a", createdAt: "2026-01-01T00:00:00Z" },
      { id: "b", createdAt: "2026-06-01T00:00:00Z" }
    ];
    const result = latest(records, 1);
    assert.equal(result[0].id, "b");
  });

  it("returns empty for empty input", () => {
    assert.deepEqual(latest([], 5), []);
  });

  it("returns fewer if count exceeds length", () => {
    const records = [{ id: "a", createdAt: "2026-01-01T00:00:00Z" }];
    assert.equal(latest(records, 10).length, 1);
  });
});

describe("unique", () => {
  it("removes duplicates", () => {
    assert.deepEqual(unique(["a", "b", "a", "c", "b"]), ["a", "b", "c"]);
  });

  it("filters falsy values", () => {
    assert.deepEqual(unique(["a", null, "", undefined, "b"]), ["a", "b"]);
  });

  it("returns empty for empty input", () => {
    assert.deepEqual(unique([]), []);
  });
});
