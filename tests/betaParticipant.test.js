import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getOrCreateBetaParticipantId } from "../apps/web-react/src/api/beta.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}

describe("getOrCreateBetaParticipantId", () => {
  it("reuses one anonymous id across feedback stages", () => {
    const storage = memoryStorage();
    const first = getOrCreateBetaParticipantId(storage, () => "tester-uuid");
    const second = getOrCreateBetaParticipantId(storage, () => "different-uuid");
    assert.equal(first, "anonymous.tester-uuid");
    assert.equal(second, first);
  });

  it("falls back to an ephemeral id when storage is unavailable", () => {
    const storage = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); }
    };
    assert.equal(
      getOrCreateBetaParticipantId(storage, () => "ephemeral-uuid"),
      "anonymous.ephemeral-uuid"
    );
  });
});
