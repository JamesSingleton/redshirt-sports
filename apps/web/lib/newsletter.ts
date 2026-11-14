import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/env";
import { getBaseUrl } from "@/lib/get-base-url";

const CONFIRM_TTL_SECONDS = 60 * 60 * 24; // 24 hours

// Only confirm links are signed here. Unsubscribes are handled by Resend's
// hosted page via {{{RESEND_UNSUBSCRIBE_URL}}} in Broadcasts.
type Purpose = "confirm";

/** True only when every newsletter env var is set. */
export function isNewsletterEnabled(): boolean {
  return !!(
    env.RESEND_API_KEY_NEWSLETTER &&
    env.RESEND_NEWSLETTER_AUDIENCE_ID &&
    env.NEWSLETTER_FROM_EMAIL &&
    env.NEWSLETTER_SIGNING_SECRET
  );
}

function getSigningSecret(): string {
  const secret = env.NEWSLETTER_SIGNING_SECRET;
  if (!secret) {
    throw new Error("NEWSLETTER_SIGNING_SECRET is not configured");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("hex");
}

function makePayload(email: string, purpose: Purpose, expires: number): string {
  return `${email}:${purpose}:${expires}`;
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function createSignedUrl(email: string, purpose: Purpose): string {
  const expires = Math.floor(Date.now() / 1000) + CONFIRM_TTL_SECONDS;
  const payload = makePayload(email, purpose, expires);
  const signature = sign(payload);
  const params = new URLSearchParams({
    email,
    expires: String(expires),
    sig: signature,
  });
  return `${getBaseUrl()}/api/newsletter/confirm?${params.toString()}`;
}

export function verifySignature(
  email: string,
  purpose: Purpose,
  expires: string,
  signature: string,
): { valid: true } | { valid: false; reason: string } {
  const expiresNum = Number(expires);
  if (!Number.isFinite(expiresNum)) {
    return { valid: false, reason: "invalid" };
  }

  if (Math.floor(Date.now() / 1000) > expiresNum) {
    return { valid: false, reason: "expired" };
  }

  const payload = makePayload(email, purpose, expiresNum);
  const expected = sign(payload);

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);

  if (sigBuf.length !== expectedBuf.length) {
    return { valid: false, reason: "invalid" };
  }

  if (!timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false, reason: "invalid" };
  }

  return { valid: true };
}
