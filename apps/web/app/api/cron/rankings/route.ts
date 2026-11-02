import {
  autoPublishDueRankings,
  isAutoPublishTime,
} from "@redshirt-sports/db/queries";
import { rankingsInvalidationTags } from "@redshirt-sports/db/rankings-cache-tags";
import * as Sentry from "@sentry/nextjs";
import { revalidateTag } from "next/cache";

import { safeCompare } from "@/lib/safe-compare";

/**
 * Vercel Cron, Mondays at 14:00 and 15:00 UTC: whichever one is 9 AM Central
 * (CDT or CST) publishes each auto-publish poll's voting week; the other finds
 * it too early or already published. Publishing records missed ballots and
 * locks out voters at the limit, the same as a publish from admin.
 */
export async function GET(request: Request) {
  // Read the request first so this always runs per request, never at build time.
  const header = request.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not set; refusing to run the rankings cron.");
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
  if (!safeCompare(header, `Bearer ${secret}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  if (!isAutoPublishTime(now)) {
    return Response.json({ results: [], skipped: "Not 9 AM Monday Central" });
  }

  const results = await autoPublishDueRankings(now);
  for (const result of results) {
    const name = `${result.sportSlug}/${result.division}`;
    if (result.status === "published") {
      for (const tag of rankingsInvalidationTags({
        sport: result.sportSlug,
        division: result.division,
        year: result.year,
        week: result.week,
      })) {
        revalidateTag(tag, { expire: 0 });
      }
      if (result.lockedOutUserIds.length > 0) {
        Sentry.captureMessage(
          `${result.poll}: ${result.lockedOutUserIds.length} voter(s) locked out for missed ballots`,
          "info",
        );
      }
    }
    if (result.status === "failed") {
      Sentry.captureMessage(
        `Rankings auto-publish failed for ${name}: ${result.reason}`,
        "error",
      );
    }
  }
  const failed = results.some((result) => result.status === "failed");
  return Response.json({ results }, { status: failed ? 500 : 200 });
}
