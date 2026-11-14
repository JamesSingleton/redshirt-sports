"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { z } from "zod";

import { env } from "@/env";
import { getBaseUrl } from "@/lib/get-base-url";
import {
  createSignedUrl,
  isNewsletterEnabled,
  normalizeEmail,
} from "@/lib/newsletter";
import {
  newsletterDailyRatelimit,
  newsletterRatelimit,
} from "@/server/ratelimit";

const schema = z.object({
  email: z.string().email(),
});

const GENERIC_SUCCESS = { success: true } as const;

function createResend() {
  return new Resend(env.RESEND_API_KEY_NEWSLETTER);
}

export async function newsletterSubscribe(formData: FormData) {
  if (formData.get("url")) {
    return GENERIC_SUCCESS;
  }

  if (!isNewsletterEnabled()) {
    return { error: "Newsletter signup isn't available yet." };
  }

  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "anonymous";
  const { success: withinRateLimit } = await newsletterRatelimit.limit(
    `newsletter:${ip}`,
  );
  if (!withinRateLimit) {
    return { error: "Too many requests. Please try again later." };
  }

  const rawEmail = formData.get("email");
  const normalized =
    typeof rawEmail === "string" ? normalizeEmail(rawEmail) : "";
  const parsed = schema.safeParse({ email: normalized });
  if (!parsed.success) {
    return { error: "Please enter a valid email address." };
  }

  const email = parsed.data.email;
  const resend = createResend();
  const audienceId = env.RESEND_NEWSLETTER_AUDIENCE_ID!;

  const { data: existing, error: getError } = await resend.contacts.get({
    email,
    audienceId,
  });

  // A 404 means the contact doesn't exist yet.
  if (getError && getError.statusCode !== 404) {
    console.error("newsletter: failed to look up contact");
    return GENERIC_SUCCESS;
  }

  // Already fully subscribed — nothing to do
  if (existing && existing.unsubscribed === false) {
    return GENERIC_SUCCESS;
  }

  // Contact doesn't exist yet — create as pending (unsubscribed: true)
  if (!existing) {
    const { error: createError } = await resend.contacts.create({
      email,
      audienceId,
      unsubscribed: true,
    });
    if (createError) {
      console.error("newsletter: failed to create contact");
      return GENERIC_SUCCESS;
    }
  }
  // else: existing && unsubscribed === true → pending, re-send confirmation

  // Daily send guard — if over limit, keep contact pending but skip email
  const { success: withinDailyLimit } = await newsletterDailyRatelimit.limit(
    "newsletter:daily-sends",
  );
  if (!withinDailyLimit) {
    console.error("newsletter: daily confirmation email limit reached");
    return GENERIC_SUCCESS;
  }

  const confirmUrl = createSignedUrl(email, "confirm");
  const baseUrl = getBaseUrl();

  const { error: sendError } = await resend.emails.send({
    from: env.NEWSLETTER_FROM_EMAIL!,
    to: email,
    subject: "Confirm your Redshirt Sports newsletter subscription",
    html: [
      "<p>Thanks for signing up for the Redshirt Sports newsletter!</p>",
      `<p><a href="${confirmUrl}">Confirm your subscription</a></p>`,
      "<p>This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>",
      "<hr>",
      `<p style="font-size:12px"><a href="${baseUrl}">Redshirt Sports</a></p>`,
    ].join(""),
  });

  if (sendError) {
    console.error("newsletter: failed to send confirmation email");
  }

  return GENERIC_SUCCESS;
}
