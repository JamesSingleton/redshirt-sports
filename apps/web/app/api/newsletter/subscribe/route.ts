import ConfirmSubscriptionEmail from "@redshirt-sports/emails/confirm-subscription";
import * as Sentry from "@sentry/nextjs";
import { checkBotId } from "botid/server";
import { createElement } from "react";
import { z } from "zod";

import { getBaseUrl } from "@/lib/get-base-url";
import { readChoices } from "@/lib/newsletter/choices";
import { newsletterConfig } from "@/lib/newsletter/config";
import { emailLogos } from "@/lib/newsletter/email-logos";
import { SIGNUP_SENT, type SignupState } from "@/lib/newsletter/signup";
import { signConfirmToken } from "@/lib/newsletter/token";
import { newsletterSignupRatelimit } from "@/server/ratelimit";

const emailSchema = z
  .email()
  .max(254)
  .transform((email) => email.toLowerCase());

function reply(state: SignupState, status = 200) {
  return Response.json(state, { status });
}

/** True when this key may sign up again. Fails open: BotID still stands guard. */
function allowed(key: string) {
  return newsletterSignupRatelimit
    .limit(key)
    .then((result) => result.success)
    .catch((error: unknown) => {
      console.warn("Newsletter rate limiter unavailable:", error);
      return true;
    });
}

/**
 * Step one of double opt-in: email a signed confirm link. Nobody joins the
 * list until they click it, so a typo or someone else's address goes nowhere.
 *
 * In order: a honeypot, BotID, validation, the newsletter env, rate limits by
 * IP and by address.
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => new FormData());
  // Hidden from people; only a script fills it in.
  if (form.get("website")) return reply(SIGNUP_SENT);

  const verification = await checkBotId();
  if (verification.isBot) {
    return reply(
      {
        status: "error",
        message:
          "We couldn't verify this request. Please reload and try again.",
      },
      403,
    );
  }

  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success) {
    return reply(
      { status: "error", message: "Enter a valid email address." },
      400,
    );
  }
  const email = parsed.data;

  const choices = await readChoices(form);
  if (!choices) {
    return reply(
      { status: "error", message: "Pick at least one email to get." },
      400,
    );
  }

  // After the reader's own mistakes, so those are what they hear about first.
  const config = newsletterConfig();
  if (!config) {
    return reply(
      { status: "error", message: "Newsletter signups aren't open yet." },
      503,
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const [ipOk, emailOk] = await Promise.all([
    allowed(`ip:${ip}`),
    allowed(`email:${email}`),
  ]);
  if (!ipOk || !emailOk) {
    return reply(
      {
        status: "error",
        message: "That's a lot of signups. Please try again in an hour.",
      },
      429,
    );
  }

  const siteUrl = getBaseUrl();
  const token = signConfirmToken(
    { email, digest: choices.digest, pollIds: choices.pollIds },
    config.signingSecret,
  );
  const confirmUrl = `${siteUrl}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;
  const logos = await emailLogos();
  const { error } = await config.resend.emails.send({
    from: config.from,
    to: email,
    subject: "Confirm your Redshirt Sports newsletter subscription",
    react: createElement(ConfirmSubscriptionEmail, {
      confirmUrl,
      siteUrl,
      logo: logos.onLight,
      choices: choices.labels,
    }),
  });
  if (error) {
    Sentry.captureMessage(
      `Newsletter confirm email failed: ${error.message}`,
      "error",
    );
    return reply(
      {
        status: "error",
        message: "Something went wrong on our end. Please try again.",
      },
      502,
    );
  }
  return reply(SIGNUP_SENT);
}
