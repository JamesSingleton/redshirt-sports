import {
  getLatestPortalYear,
  getTransferPortalEntries,
} from "@redshirt-sports/db/queries/transfer-portal";
import { getDynamicFetchOptions } from "@redshirt-sports/sanity/live";
import { queryTransferPortalMegaboard } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import Link from "next/link";

import { HomeNewsSection } from "@/components/home/home-news-section";
import { Megaboard } from "@/components/home/megaboard";
import { TransferPortalFeedSidebar } from "@/components/transfer-portal/feed-sidebar";
import { TransferPortalSportNewsLinks } from "@/components/transfer-portal/sport-news-links";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { fetchAllSports } from "@/lib/sport-by-slug";

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = await getDynamicFetchOptions();

  return getPageMetadata(
    {
      title: "College Transfer Portal",
      description:
        "Transfer portal news, commitments, and live player movement across college sports.",
      slug: "/college/transfer-portal",
    },
    perspective,
  );
}

export default async function TransferPortalLandingPage() {
  const { perspective, stega } = await getDynamicFetchOptions();
  const portalYear = await getLatestPortalYear();

  const [{ data: transferArticles }, feedEntriesResult, sports] =
    await Promise.all([
      sanityFetchPage({
        query: queryTransferPortalMegaboard,
        perspective,
        stega,
      }),
      getTransferPortalEntries({
        filters: { portalYear },
        limit: 10,
      }),
      fetchAllSports(perspective),
    ]);

  const megaboardPosts = transferArticles?.slice(0, 5) ?? [];
  const feedPosts = transferArticles?.slice(0, 6) ?? [];

  return (
    <div className="container max-w-6xl px-4 py-8">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
          Transfer Portal
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          News, commitments, and live player movement across college sports.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
          <Link
            href="/college/transfer-portal/news"
            className="text-primary hover:underline"
          >
            All transfer news
          </Link>
        </div>
        <div className="mt-4">
          <TransferPortalSportNewsLinks
            sports={sports.map((sport) => ({
              slug: sport.slug,
              title: sport.title,
            }))}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <TransferPortalFeedSidebar
            entries={feedEntriesResult.data}
            portalYear={portalYear}
          />
        </aside>

        <div className="lg:col-span-8">
          {megaboardPosts.length > 0 ? (
            <Megaboard articles={megaboardPosts} />
          ) : null}

          {feedPosts.length > 0 ? (
            <div className="mt-8">
              <HomeNewsSection
                title="Transfer Portal"
                href="/college/transfer-portal/news"
                articles={feedPosts}
                layout="grid-3"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
