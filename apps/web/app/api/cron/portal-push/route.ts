import {
  expirePendingPortalPushes,
  pushPortal,
} from "@redshirt-sports/db/queries";
import * as Sentry from "@sentry/nextjs";
import { revalidateTag } from "next/cache";

import { safeCompare } from "@/lib/safe-compare";

/** A push is a few hundred milliseconds of SQL; this is headroom. */
export const maxDuration = 60;

/**
 * Vercel Schedule, nightly at 3 AM Mountain: the transfer portal's safety net.
 *
 * Saves in admin don't go live until someone clicks Push to site. This
 * publishes anything saved but not pushed, then expires the cache tags of every
 * push whose expiry hasn't been confirmed, including earlier ones whose
 * expiry failed.
 */
export async function GET(request: Request) {
  // Read the request first so this always runs per request, never at build time.
  const header = request.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error(
      "CRON_SECRET is not set; refusing to run the portal push cron.",
    );
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
  if (!safeCompare(header, `Bearer ${secret}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let pushed: { pushId: number; playerCount: number } | null = null;
  let pushError: string | null = null;
  try {
    const result = await pushPortal({ trigger: "cron" });
    if (result) {
      pushed = { pushId: result.pushId, playerCount: result.playerCount };
    }
  } catch (error) {
    // Still expire earlier pushes below. The changes stay pending, so the next
    // push, from admin or tomorrow night, publishes them.
    Sentry.captureException(error, { tags: { cron: "portal-push" } });
    pushError = error instanceof Error ? error.message : String(error);
  }

  const expiry = await expirePendingPortalPushes((tags) => {
    // Display data, like rankings: serve the cached page while it regenerates.
    for (const tag of tags) revalidateTag(tag, "max");
  });
  for (const failure of expiry.failed) {
    Sentry.captureMessage(
      `Portal push ${failure.pushId} cache expiry failed: ${failure.error}`,
      "warning",
    );
  }

  const failed = pushError !== null || expiry.failed.length > 0;
  return Response.json(
    { pushed, pushError, expired: expiry.expired, failed: expiry.failed },
    { status: failed ? 500 : 200 },
  );
}
