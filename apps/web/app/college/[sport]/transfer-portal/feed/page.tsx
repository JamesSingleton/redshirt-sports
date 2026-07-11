import { getLatestPortalYear } from "@redshirt-sports/db/queries/transfer-portal";
import { getDynamicFetchOptions } from "@redshirt-sports/sanity/live";
import type { Metadata } from "next";

import { TransferPortalFeedView } from "@/components/transfer-portal/transfer-portal-feed-view";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { requireSportBySlug } from "@/lib/sport-by-slug";
import type { TransferPortalFeedSearchParams } from "@/lib/transfer-portal-feed-params";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string }>;
}): Promise<Metadata> {
  const [{ sport }, { perspective }] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);
  const sportInfo = await requireSportBySlug(sport, perspective);
  const portalYear = await getLatestPortalYear(sport);

  return getPageMetadata(
    {
      title: `${portalYear} ${sportInfo.title} Transfer Portal Feed`,
      description: `Live ${sportInfo.title.toLowerCase()} transfer portal activity for the ${portalYear} cycle.`,
      slug: `/college/${sport}/transfer-portal/feed`,
    },
    perspective,
  );
}

export default async function TransferPortalFeedLatestPage({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<TransferPortalFeedSearchParams>;
}) {
  const [{ sport }, filters] = await Promise.all([params, searchParams]);

  return <TransferPortalFeedView sport={sport} searchParams={filters} />;
}
