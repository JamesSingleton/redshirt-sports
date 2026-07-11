import { getDynamicFetchOptions } from "@redshirt-sports/sanity/live";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TransferPortalFeedView } from "@/components/transfer-portal/transfer-portal-feed-view";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { requireSportBySlug } from "@/lib/sport-by-slug";
import type { TransferPortalFeedSearchParams } from "@/lib/transfer-portal-feed-params";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; year: string }>;
}): Promise<Metadata> {
  const [{ sport, year }, { perspective }] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);
  const sportInfo = await requireSportBySlug(sport, perspective);
  const portalYear = Number.parseInt(year, 10);

  if (Number.isNaN(portalYear)) {
    notFound();
  }

  return getPageMetadata(
    {
      title: `${portalYear} ${sportInfo.title} Transfer Portal Feed`,
      description: `Live ${sportInfo.title.toLowerCase()} transfer portal activity for the ${portalYear} cycle.`,
      slug: `/college/${sport}/transfer-portal/feed/${year}`,
    },
    perspective,
  );
}

export default async function TransferPortalFeedYearPage({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; year: string }>;
  searchParams: Promise<TransferPortalFeedSearchParams>;
}) {
  const [{ sport, year }, filters] = await Promise.all([params, searchParams]);
  const portalYear = Number.parseInt(year, 10);

  if (Number.isNaN(portalYear)) {
    notFound();
  }

  return (
    <TransferPortalFeedView
      sport={sport}
      portalYear={portalYear}
      searchParams={filters}
    />
  );
}
