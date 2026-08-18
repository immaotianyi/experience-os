import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual
} from "node:crypto";

const OTP_TTL_MS = 5 * 60_000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60_000;
const REQUEST_WINDOW_MS = 10 * 60_000;
const REQUEST_COOLDOWN_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 3;
const MAX_VERIFY_ATTEMPTS = 5;

function normalizePhone(value) {
  const digits = String(value || "").replaceAll(/\s|-/g, "");
  const local = digits.startsWith("+86") ? digits.slice(3) : digits;
  if (!/^1[3-9]\d{9}$/.test(local)) {
    throw new Error("请输入有效的中国大陆手机号");
  }
  return `+86${local}`;
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("请输入有效的邮箱地址");
  }
  return email;
}

export function normalizeAuthIdentifier(channel, value) {
  if (channel === "phone") return normalizePhone(value);
  if (channel === "email") return normalizeEmail(value);
  throw new Error("登录方式必须是 phone 或 email");
}

export function maskAuthIdentifier(channel, normalized) {
  if (channel === "phone") {
    return `${normalized.slice(0, 5)}****${normalized.slice(-4)}`;
  }
  const [name, domain] = normalized.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

export class AuthService {
  constructor({
    devOtpEnabled = false,
    provider = null,
    now = () => Date.now()
  } = {}) {
    this.devOtpEnabled = Boolean(devOtpEnabled);
    this.provider = provider;
    this.now = now;
    this.secret = randomBytes(32);
    this.pending = new Map();
    this.requestHistory = new Map();
    this.sessions = new Map();
  }

  status(token = null) {
    const session = token ? this.sessionForToken(token) : null;
    return {
      requiredForLocalUse: false,
      localBypassAvailable: true,
      devOtpEnabled: this.devOtpEnabled,
      provider: this.provider?.name || (this.devOtpEnabled ? "local_development" : "unconfigured"),
      productionReady: Boolean(this.provider),
      supportedChannels: ["phone", "email"],
      phoneRegion: "CN",
      session
    };
  }

  keyFor(channel, normalized) {
    return createHash("sha256").update(`${channel}:${normalized}`).digest("hex");
  }

  codeHash(key, code) {
    return createHmac("sha256", this.secret).update(`${key}:${code}`).digest();
  }

  async requestCode({ channel, identifier }) {
    const normalized = normalizeAuthIdentifier(channel, identifier);
    if (!this.devOtpEnabled && !this.provider) {
      throw new Error("真实验证码服务尚未配置；你仍可选择仅本地使用");
    }

    const key = this.keyFor(channel, normalized);
    const now = this.now();
    const history = (this.requestHistory.get(key) || []).filter((at) => now - at < REQUEST_WINDOW_MS);
    if (history.length && now - history.at(-1) < REQUEST_COOLDOWN_MS) {
      throw new Error("验证码发送过于频繁，请 60 秒后再试");
    }
    if (history.length >= MAX_REQUESTS_PER_WINDOW) {
      throw new Error("验证码请求次数过多，请稍后再试");
    }

    const code = String(randomInt(100000, 1_000_000));
    if (this.provider) {
      await this.provider.sendCode({ channel, identifier: normalized, code, expiresInSeconds: 300 });
    }

    this.pending.set(key, {
      channel,
      identifierHash: key,
      maskedIdentifier: maskAuthIdentifier(channel, normalized),
      codeHash: this.codeHash(key, code),
      expiresAt: now + OTP_TTL_MS,
      attemptsRemaining: MAX_VERIFY_ATTEMPTS
    });
    history.push(now);
    this.requestHistory.set(key, history);

    return {
      ok: true,
      channel,
      maskedIdentifier: maskAuthIdentifier(channel, normalized),
      expiresInSeconds: OTP_TTL_MS / 1000,
      ...(this.devOtpEnabled ? { devCode: code } : {})
    };
  }

  verifyCode({ channel, identifier, code }) {
    const normalized = normalizeAuthIdentifier(channel, identifier);
    const key = this.keyFor(channel, normalized);
    const record = this.pending.get(key);
    const now = this.now();
    if (!record || record.expiresAt <= now) {
      this.pending.delete(key);
      throw new Error("验证码已失效，请重新获取");
    }
    if (!/^\d{6}$/.test(String(code || ""))) {
      throw new Error("验证码应为 6 位数字");
    }

    const actual = this.codeHash(key, String(code));
    const valid = actual.length === record.codeHash.length && timingSafeEqual(actual, record.codeHash);
    if (!valid) {
      record.attemptsRemaining -= 1;
      if (record.attemptsRemaining <= 0) this.pending.delete(key);
      throw new Error(record.attemptsRemaining <= 0
        ? "验证码错误次数过多，请重新获取"
        : `验证码错误，还可尝试 ${record.attemptsRemaining} 次`);
    }

    this.pending.delete(key);
    const token = randomBytes(32).toString("base64url");
    const session = {
      userId: `user.${key.slice(0, 24)}`,
      channel,
      maskedIdentifier: record.maskedIdentifier,
      role: "owner",
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
      developmentOnly: this.devOtpEnabled && !this.provider
    };
    this.sessions.set(this.keyFor("session", token), session);
    return { token, session };
  }

  sessionForToken(token) {
    if (typeof token !== "string" || !token) return null;
    const key = this.keyFor("session", token);
    const session = this.sessions.get(key);
    if (!session) return null;
    if (Date.parse(session.expiresAt) <= this.now()) {
      this.sessions.delete(key);
      return null;
    }
    return session;
  }

  logout(token) {
    if (token) this.sessions.delete(this.keyFor("session", token));
    return { ok: true };
  }
}

