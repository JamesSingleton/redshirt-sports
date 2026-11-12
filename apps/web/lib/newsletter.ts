import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/env";
import { getBaseUrl } from "@/lib/get-base-url";

const CONFIRM_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const UNSUBSCRIBE_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

type Purpose = "confirm" | "unsubscribe";

function sign(payload: string): string {
  return createHmac("sha256", env.NEWSLETTER_SIGNING_SECRET)
    .update(payload)
    .digest("hex");
}

function makePayload(email: string, purpose: Purpose, expires: number): string {
  return `${email}:${purpose}:${expires}`;
}

export function createSignedUrl(email: string, purpose: Purpose): string {
  const ttl =
    purpose === "confirm" ? CONFIRM_TTL_SECONDS : UNSUBSCRIBE_TTL_SECONDS;
  const expires = Math.floor(Date.now() / 1000) + ttl;
  const payload = makePayload(email, purpose, expires);
  const signature = sign(payload);
  const base = getBaseUrl();
  const path =
    purpose === "confirm"
      ? "/api/newsletter/confirm"
      : "/api/newsletter/unsubscribe";
  const params = new URLSearchParams({
    email,
    expires: String(expires),
    sig: signature,
  });
  return `${base}${path}?${params.toString()}`;
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
