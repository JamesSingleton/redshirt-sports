import {
  listPools,
  type PipelineResult,
  ratingsInvalidationTags,
  runPipeline,
} from "@redshirt-sports/db/ratings";
import * as Sentry from "@sentry/nextjs";
import { revalidateTag } from "next/cache";

import { safeCompare } from "@/lib/safe-compare";

/** Syncing a few weeks from ESPN and computing a season takes seconds, not minutes; this is headroom. */
export const maxDuration = 300;

/**
 * Vercel Schedules, three calls a week from August through January: Sunday at
 * midnight Pacific (most weeks publish here, after the West Coast night games),
 * Sunday at 6 a.m. Eastern (late games and ESPN corrections, before the freeze),
 * and Tuesday at 6 a.m. Eastern for Monday games such as the FCS title game.
 * Each active pool checks its own window and publishes once its week's last
 * game is over, then republishes on an ESPN correction until the week freezes,
 * 10 hours after its last kickoff. Later changes are a deliberate republish
 * from admin. A Tuesday call in a week with no Monday game syncs, finds the
 * week frozen, and stops. A pool with different windows needs matching entries
 * in vercel.json; a test checks they agree. Publishing expires that pool's
 * public pages.
 */
export async function GET(request: Request) {
  // Read the request first so this always runs per request, never at build time.
  const header = request.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not set; refusing to run the ratings cron.");
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
  if (!safeCompare(header, `Bearer ${secret}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pools = await listPools({ active: true });
  const results: Array<
    { pool: string } & Partial<PipelineResult> & { error?: string }
  > = [];
  for (const pool of pools) {
    const name = `${pool.sportSlug}/${pool.slug}`;
    try {
      const result = await runPipeline({ pool, trigger: "cron" });
      if (result.status === "published") {
        // Stale-while-revalidate: ratings are display-only, so the next visitor
        // gets the cached page while it regenerates in the background.
        for (const tag of ratingsInvalidationTags(pool.sportSlug, pool.slug)) {
          revalidateTag(tag, "max");
        }
      }
      if (result.status === "blocked") {
        Sentry.captureMessage(
          `Ratings publish blocked for ${name}: ${result.message}`,
          "warning",
        );
      }
      results.push({
        pool: name,
        status: result.status,
        message: result.message,
        runId: result.runId,
      });
    } catch (error) {
      Sentry.captureException(error, { tags: { ratingsPool: name } });
      results.push({
        pool: name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  const failed = results.some((result) => result.error);
  return Response.json({ results }, { status: failed ? 500 : 200 });
}
