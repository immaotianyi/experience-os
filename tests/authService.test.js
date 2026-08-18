import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AuthService, maskAuthIdentifier, normalizeAuthIdentifier } from "../src/authService.js";

describe("AuthService", () => {
  it("normalizes mainland phone and international email identities", () => {
    assert.equal(normalizeAuthIdentifier("phone", "138 0013 8000"), "+8613800138000");
    assert.equal(normalizeAuthIdentifier("email", " User@Example.COM "), "user@example.com");
    assert.equal(maskAuthIdentifier("phone", "+8613800138000"), "+8613****8000");
  });

  it("runs a real local development OTP session without persisting the raw identity", async () => {
    const auth = new AuthService({ devOtpEnabled: true });
    const requested = await auth.requestCode({ channel: "phone", identifier: "13800138000" });
    assert.match(requested.devCode, /^\d{6}$/);
    const verified = auth.verifyCode({
      channel: "phone",
      identifier: "13800138000",
      code: requested.devCode
    });
    assert.equal(auth.sessionForToken(verified.token).userId, verified.session.userId);
    assert.equal(verified.session.developmentOnly, true);
    auth.logout(verified.token);
    assert.equal(auth.sessionForToken(verified.token), null);
  });

  it("supports international email OTP in the same development gateway", async () => {
    const auth = new AuthService({ devOtpEnabled: true });
    const requested = await auth.requestCode({ channel: "email", identifier: "User@Example.COM" });
    const verified = auth.verifyCode({
      channel: "email",
      identifier: "user@example.com",
      code: requested.devCode
    });
    assert.equal(verified.session.maskedIdentifier, "us***@example.com");
    assert.equal(verified.session.channel, "email");
  });

  it("fails closed when no real provider or explicit dev mode exists", async () => {
    const auth = new AuthService();
    await assert.rejects(
      auth.requestCode({ channel: "email", identifier: "user@example.com" }),
      /尚未配置/
    );
  });

  it("invalidates a code after repeated failures", async () => {
    const auth = new AuthService({ devOtpEnabled: true });
    const requested = await auth.requestCode({ channel: "email", identifier: "user@example.com" });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      assert.throws(() => auth.verifyCode({
        channel: "email",
        identifier: "user@example.com",
        code: "000000"
      }));
    }
    assert.throws(() => auth.verifyCode({
      channel: "email",
      identifier: "user@example.com",
      code: requested.devCode
    }), /失效/);
  });
});
