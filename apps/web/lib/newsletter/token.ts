import { createHmac } from "node:crypto";

import { safeCompare } from "@/lib/safe-compare";

/** A confirm link works for a week, then the reader signs up again. */
export const CONFIRM_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** What someone asked for at signup, carried through the confirm link. */
export type Subscription = {
  email: string;
  /** The weekly issue. */
  digest: boolean;
  /** Postgres poll ids for Top 25 alerts. */
  pollIds: string[];
};

type Payload = { e: string; t: number; d: boolean; p: string[] };

function sign(payload: string, secret: string) {
  // The prefix keeps this key from vouching for anything but confirm links.
  return createHmac("sha256", secret)
    .update(`newsletter-confirm:${payload}`)
    .digest("base64url");
}

/** `<base64url payload>.<signature>`: the choices and when the link was made. */
export function signConfirmToken(
  { email, digest, pollIds }: Subscription,
  secret: string,
  now = Date.now(),
) {
  const payload = Buffer.from(
    JSON.stringify({
      e: email,
      t: now,
      d: digest,
      p: pollIds,
    } satisfies Payload),
  ).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** The subscription the token was made for, or null if forged or expired. */
export function verifyConfirmToken(
  token: string,
  secret: string,
  now = Date.now(),
): Subscription | null {
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length > 0) return null;
  if (!safeCompare(signature, sign(payload, secret))) return null;
  // Signed by us, so it parses.
  const { e, t, d, p } = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf8"),
  ) as Payload;
  if (now - t > CONFIRM_TOKEN_TTL_MS) return null;
  return { email: e, digest: d, pollIds: p };
}
