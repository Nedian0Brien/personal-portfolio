import crypto from "node:crypto";

export const COOKIE_NAME = "portfolio_admin_session";

const SESSION_TTL_SECONDS = 60 * 60 * 12;

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function makeSessionCookie(secret) {
  const payload = JSON.stringify({
    sub: "portfolio-admin",
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
  const encoded = base64url(payload);
  return `${encoded}.${sign(encoded, secret)}`;
}

export function verifySessionCookie(cookie, secret) {
  if (!cookie || !secret) return false;
  const [encoded, signature] = cookie.split(".");
  if (!encoded || !signature || !safeEqual(signature, sign(encoded, secret))) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return payload.sub === "portfolio-admin" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function setSession(res, secret) {
  const cookie = makeSessionCookie(secret);
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(cookie)}; HttpOnly; SameSite=Lax; Secure; Path=/; Max-Age=${SESSION_TTL_SECONDS}`,
  );
}

export function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Secure; Path=/; Max-Age=0`);
}
