import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  portalWireDescription,
  portalWireTitle,
  WirePage,
  WirePageSkeleton,
} from "@/components/portal/wire-page";
import { getPageMetadata } from "@/lib/global-seo-settings";
import {
  getCachedPortalCycles,
  getCachedPortalWire,
  isPortalSport,
  portalIsPublic,
  portalWirePath,
} from "@/lib/portal-data";

type Params = Promise<{ sport: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { sport } = await params;
  if (!portalIsPublic() || !isPortalSport(sport)) return {};
  const { current } = await getCachedPortalCycles(sport);
  const wire = await getCachedPortalWire(sport, current);
  return getPageMetadata({
    title: portalWireTitle(sport, current),
    description: portalWireDescription(sport, current),
    slug: portalWirePath(sport),
    // Nothing to list yet: keep the empty page out of search.
    noIndex: !wire?.rows.length,
  });
}

async function Content({ params }: { params: Params }) {
  const { sport } = await params;
  return <WirePage sport={sport} cycleYear={null} />;
}

export default function TransferPortalPage({ params }: { params: Params }) {
  // Static: the switch is read at build time, so a hidden portal is a real 404.
  if (!portalIsPublic()) notFound();
  return (
    <Suspense fallback={<WirePageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
