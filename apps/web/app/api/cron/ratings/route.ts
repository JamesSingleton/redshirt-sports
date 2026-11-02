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
 * Vercel Cron, every 30 minutes. Each active pool decides for itself whether its
 * window is open and whether its weekend is complete, so adding a pool never
 * changes vercel.json. Publishing expires that pool's public pages.
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
        for (const tag of ratingsInvalidationTags(pool.sportSlug, pool.slug)) {
          revalidateTag(tag, { expire: 0 });
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
