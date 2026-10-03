import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@redshirt-sports/ui/components/empty";
import { Skeleton } from "@redshirt-sports/ui/components/skeleton";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageHeader from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { PortalStats } from "@/components/transfer-portal/portal-stats";
import { WireFeed } from "@/components/transfer-portal/wire-feed";
import { WireFilters } from "@/components/transfer-portal/wire-filters";
import { searchParamsPage } from "@/lib/draft-cache";
import {
  getCachedPortalCounts,
  getCachedPortalEntries,
  getCachedPortalFilterOptions,
  getCachedPortalSport,
  getCachedPortalYears,
} from "@/lib/transfer-portal";
import {
  isPortalStatus,
  PORTAL_SPORTS,
  type PortalSportSlug,
  portalSportLabel,
} from "@/lib/transfer-portal-format";

type Params = Promise<{ sport: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseYear(year: string | undefined) {
  if (!year) return null;
  const value = Number.parseInt(year, 10);
  return Number.isInteger(value) && String(value) === year ? value : null;
}

function firstParam(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { sport } = await params;
  const label = portalSportLabel(sport);
  if (!label) return {};
  return {
    title: `${label} Transfer Portal`,
    description: `Every ${label.toLowerCase()} player in the transfer portal, with commitments and withdrawals as they happen.`,
  };
}

const wireSkeleton = (
  <div className="container flex flex-col gap-6 py-10">
    <Skeleton className="h-12 w-2/3 max-w-xl" />
    <Skeleton className="h-24 w-full max-w-xl" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-96 w-full" />
  </div>
);

export default function TransferPortalPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  return searchParamsPage(wireSkeleton, () => renderWire(params, searchParams));
}

async function renderWire(params: Params, searchParams: SearchParams) {
  const [{ sport: sportSlug }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const portalSport = PORTAL_SPORTS.find((item) => item.slug === sportSlug);
  if (!portalSport) {
    notFound();
  }
  const portalYear =
    parseYear(firstParam(query.year)) ?? new Date().getFullYear();

  const sport = await getCachedPortalSport(portalSport.slug);
  if (!sport) {
    notFound();
  }

  const status = firstParam(query.status);
  const filters = {
    sport: portalSport.slug as PortalSportSlug,
    portalYear,
    status: isPortalStatus(status) ? status : undefined,
    position: firstParam(query.position),
    conferenceId: firstParam(query.conference),
    search: firstParam(query.q),
  };

  const scope = { sport: portalSport.slug, sportId: sport.id, portalYear };
  const [years, { counts, total }, options, firstPage] = await Promise.all([
    getCachedPortalYears(sport.id),
    getCachedPortalCounts(scope),
    getCachedPortalFilterOptions(scope),
    getCachedPortalEntries({ ...filters, sportId: sport.id }),
  ]);

  const yearOptions = years.includes(portalYear)
    ? years
    : [portalYear, ...years];
  const hasFilters = Boolean(
    filters.status ||
      filters.position ||
      filters.conferenceId ||
      filters.search,
  );

  return (
    <PageTransition>
      <PageHeader
        title={`${portalYear} ${portalSport.label} transfer portal`}
        subtitle={`${total.toLocaleString("en-US")} players have entered the portal this cycle.`}
        breadcrumbs={[
          { title: portalSport.label, href: `/college/${portalSport.slug}` },
          {
            title: "Transfer portal",
            href: `/college/${portalSport.slug}/transfer-portal`,
          },
        ]}
      >
        <PortalStats counts={counts} className="max-w-xl" />
      </PageHeader>

      <div className="container flex flex-col gap-6 pb-12">
        <WireFilters
          year={portalYear}
          years={yearOptions}
          positions={options.positions}
          conferences={options.conferences}
        />

        {firstPage.entries.length > 0 ? (
          <WireFeed
            key={JSON.stringify(filters)}
            query={filters}
            caption={`${portalYear} ${portalSport.label} transfer portal entries`}
            initialEntries={firstPage.entries}
            initialCursor={firstPage.nextCursor}
          />
        ) : (
          <Empty className="bg-card rounded-md border">
            <EmptyHeader>
              <EmptyTitle>No players found</EmptyTitle>
              <EmptyDescription>
                {hasFilters
                  ? "No portal entries match these filters. Try clearing one."
                  : "No portal entries have been added for this cycle yet."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </PageTransition>
  );
}
