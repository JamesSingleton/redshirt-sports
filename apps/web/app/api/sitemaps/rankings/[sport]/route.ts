import {
  rankingsSitemapEntries,
  sitemapXml,
  sportsWithPublishedRankings,
} from "@/lib/rankings/sitemap";
import { SPORT_SLUG_MAP } from "@/lib/vote-ballot";

/**
 * One sport's rankings sitemap, served publicly at
 * /college/[sport]/rankings/sitemap.xml through a rewrite in next.config.ts.
 *
 * It lives here rather than in a `sitemap` or `sitemap.xml` folder under
 * the page: Next.js treats those as metadata routes, which get no params,
 * skip generateStaticParams, and on Vercel lose to the [division] page.
 */
export async function generateStaticParams() {
  const sports = await sportsWithPublishedRankings();
  return sports.map((sport) => ({ sport }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sport: string }> },
) {
  const sport = SPORT_SLUG_MAP[(await params).sport];
  const entries = sport ? await rankingsSitemapEntries(sport) : [];

  // No published poll yet: no sitemap, so nothing unlaunched is submitted.
  if (entries.length === 0) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(sitemapXml(entries), {
    headers: { "Content-Type": "application/xml" },
  });
}
