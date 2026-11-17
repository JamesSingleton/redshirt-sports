"use server";

import {
  submissionPayloadSchema,
  submitterSchema,
} from "@redshirt-sports/db/portal";
import { createPlayerSubmission } from "@redshirt-sports/db/queries";
import * as Sentry from "@sentry/nextjs";
import { checkBotId } from "botid/server";
import { headers } from "next/headers";
import type { z } from "zod";

import { portalIsPublic } from "@/lib/portal-data";
import {
  SUBMIT_FIELDS,
  type SubmitField,
  type SubmitState,
} from "@/lib/portal-submit";
import { portalSubmissionRatelimit } from "@/server/ratelimit";

const SENT: SubmitState = {
  status: "sent",
  message:
    "Thanks. An editor will review this before anything appears on the site.",
};

function fieldErrors(...errors: (z.ZodError | undefined)[]) {
  const out: Partial<Record<SubmitField, string>> = {};
  for (const issue of errors.flatMap((error) => error?.issues ?? [])) {
    const field = issue.path[0] as SubmitField;
    out[field] ??= issue.message;
  }
  return out;
}

/** True when this key may submit again. Fails open: BotID still stands guard. */
function allowed(key: string) {
  return portalSubmissionRatelimit
    .limit(key)
    .then((result) => result.success)
    .catch((error: unknown) => {
      console.warn("Portal submission rate limiter unavailable:", error);
      return true;
    });
}

/**
 * The public "report a move" form. Nothing here touches players or the
 * tracker: a submission lands in an inbox for an editor to check and enter.
 *
 * In order: a honeypot (bots that fill every field get a fake thank-you),
 * BotID, validation, then rate limits by IP and by email.
 */
export async function submitPortalMove(
  _previous: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  if (!portalIsPublic()) {
    return { status: "error", message: "Submissions aren't open yet." };
  }

  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  const values = Object.fromEntries(
    SUBMIT_FIELDS.map((field) => [field, text(field).slice(0, 1000)]),
  ) as Record<SubmitField, string>;

  // Hidden from people; only a script fills it in.
  if (text("website")) return SENT;

  const verification = await checkBotId();
  if (verification.isBot) {
    return {
      status: "error",
      message:
        "We couldn't verify this request. Please reload the page and try again.",
      values,
    };
  }

  const submitter = submitterSchema.safeParse(values);
  const payload = submissionPayloadSchema.safeParse(values);
  if (!submitter.success || !payload.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: fieldErrors(submitter.error, payload.error),
      values,
    };
  }

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const [ipOk, emailOk] = await Promise.all([
    allowed(`ip:${ip}`),
    allowed(`email:${submitter.data.submitterEmail}`),
  ]);
  if (!ipOk || !emailOk) {
    return {
      status: "error",
      message: "That's a lot of submissions. Please try again in an hour.",
      values,
    };
  }

  try {
    await createPlayerSubmission({ ...submitter.data, payload: payload.data });
  } catch (error) {
    Sentry.captureException(error);
    return {
      status: "error",
      message: "Something went wrong on our end. Please try again.",
      values,
    };
  }
  return SENT;
}
