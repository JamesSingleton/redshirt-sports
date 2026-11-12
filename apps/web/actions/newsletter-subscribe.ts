"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { z } from "zod";

import { env } from "@/env";
import { getBaseUrl } from "@/lib/get-base-url";
import { createSignedUrl } from "@/lib/newsletter";
import { newsletterRatelimit } from "@/server/ratelimit";

const schema = z.object({
  email: z.string().email(),
});

const resend = new Resend(env.RESEND_API_KEY);

export async function newsletterSubscribe(formData: FormData) {
  if (formData.get("url")) {
    return { success: true };
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

  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Please enter a valid email address." };
  }

  const { email } = parsed.data;

  try {
    await resend.contacts.create({
      email,
      audienceId: env.RESEND_NEWSLETTER_AUDIENCE_ID,
      unsubscribed: true,
    });

    const confirmUrl = createSignedUrl(email, "confirm");
    const unsubscribeUrl = createSignedUrl(email, "unsubscribe");
    const baseUrl = getBaseUrl();

    await resend.emails.send({
      from: env.NEWSLETTER_FROM_EMAIL,
      to: email,
      subject: "Confirm your Redshirt Sports newsletter subscription",
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      html: [
        "<p>Thanks for signing up for the Redshirt Sports newsletter!</p>",
        `<p><a href="${confirmUrl}">Confirm your subscription</a></p>`,
        "<p>This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>",
        "<hr>",
        `<p style="font-size:12px"><a href="${unsubscribeUrl}">Unsubscribe</a> · <a href="${baseUrl}">Redshirt Sports</a></p>`,
      ].join(""),
    });
  } catch {
    // Do not leak whether the email exists or whether the send failed.
  }

  return { success: true };
}
