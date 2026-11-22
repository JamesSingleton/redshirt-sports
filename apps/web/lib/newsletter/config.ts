import "server-only";

import { Resend } from "resend";

import { env } from "@/env";

export type NewsletterConfig = {
  resend: Resend;
  /** Resend segment id. The env name keeps Resend's old word, "audience". */
  segmentId: string;
  from: string;
  signingSecret: string;
};

/** A bare address gets the site name, so inboxes show "Redshirt Sports". */
export function formatFrom(from: string) {
  return from.includes("<") ? from : `Redshirt Sports <${from}>`;
}

/**
 * Null until all four newsletter variables are set. Callers refuse to run
 * rather than half-work (say, confirming people into no segment).
 */
export function newsletterConfig(): NewsletterConfig | null {
  const apiKey = env.RESEND_API_KEY_NEWSLETTER;
  const segmentId = env.RESEND_NEWSLETTER_AUDIENCE_ID;
  const from = env.NEWSLETTER_FROM_EMAIL;
  const signingSecret = env.NEWSLETTER_SIGNING_SECRET;
  if (!apiKey || !segmentId || !from || !signingSecret) {
    const missing = Object.entries({
      RESEND_API_KEY_NEWSLETTER: apiKey,
      RESEND_NEWSLETTER_AUDIENCE_ID: segmentId,
      NEWSLETTER_FROM_EMAIL: from,
      NEWSLETTER_SIGNING_SECRET: signingSecret,
    })
      .filter(([, value]) => !value)
      .map(([name]) => name);
    // Names only: says what to set without echoing any value.
    console.error(`Newsletter is off; set ${missing.join(", ")}.`);
    return null;
  }
  return {
    resend: new Resend(apiKey),
    segmentId,
    from: formatFrom(from),
    signingSecret,
  };
}
