import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
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
  parseCycleYear,
  portalIsPublic,
  portalWirePath,
} from "@/lib/portal-data";

type Params = Promise<{ sport: string; year: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { sport, year } = await params;
  const cycleYear = parseCycleYear(year);
  if (!portalIsPublic() || !isPortalSport(sport) || cycleYear === null) {
    return {};
  }
  const wire = await getCachedPortalWire(sport, cycleYear);
  return getPageMetadata({
    title: portalWireTitle(sport, cycleYear),
    description: portalWireDescription(sport, cycleYear),
    slug: portalWirePath(sport, cycleYear),
    noIndex: !wire?.rows.length,
  });
}

async function Content({ params }: { params: Params }) {
  const { sport, year } = await params;
  const cycleYear = parseCycleYear(year);
  if (cycleYear === null || !isPortalSport(sport)) notFound();
  // The current cycle lives at the bare URL; one address per page.
  const { current } = await getCachedPortalCycles(sport);
  if (cycleYear === current) permanentRedirect(portalWirePath(sport));
  return <WirePage sport={sport} cycleYear={cycleYear} />;
}

export default function TransferPortalCyclePage({
  params,
}: {
  params: Params;
}) {
  if (!portalIsPublic()) notFound();
  return (
    <Suspense fallback={<WirePageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
