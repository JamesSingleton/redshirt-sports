import {
  getAvailablePortalYears,
  getLatestPortalYear,
  getPortalStatusCounts,
  getTransferPortalEntries,
} from "@redshirt-sports/db/queries/transfer-portal";
import { getDynamicFetchOptions } from "@redshirt-sports/sanity/live";
import Link from "next/link";

import { TransferPortalFeedFilters } from "@/components/transfer-portal/feed-filters";
import { TransferPortalFeedTable } from "@/components/transfer-portal/feed-table";
import { resolveSchoolIdBySanitySlug } from "@/lib/resolve-school-id";
import { requireSportBySlug } from "@/lib/sport-by-slug";
import {
  parsePortalStatus,
  type TransferPortalFeedSearchParams,
} from "@/lib/transfer-portal-feed-params";

interface TransferPortalFeedViewProps {
  sport: string;
  portalYear?: number;
  searchParams: TransferPortalFeedSearchParams;
}

export async function TransferPortalFeedView({
  sport,
  portalYear: explicitYear,
  searchParams,
}: TransferPortalFeedViewProps) {
  const { perspective } = await getDynamicFetchOptions();
  const sportInfo = await requireSportBySlug(sport, perspective);

  const latestYear = await getLatestPortalYear(sport);
  const portalYear = explicitYear ?? latestYear;
  const useLatestYearPath = explicitYear == null || explicitYear === latestYear;

  const schoolId = searchParams.school
    ? await resolveSchoolIdBySanitySlug(searchParams.school, perspective)
    : null;

  const status = parsePortalStatus(searchParams.status);

  const [entriesResult, statusCounts, availableYears] = await Promise.all([
    getTransferPortalEntries({
      filters: {
        portalYear,
        sportSlug: sport,
        schoolId: schoolId ?? undefined,
        status,
        position: searchParams.position,
        searchQuery: searchParams.q,
      },
      limit: 100,
    }),
    getPortalStatusCounts(portalYear),
    getAvailablePortalYears(sport),
  ]);

  const years = availableYears.length > 0 ? availableYears : [portalYear];

  return (
    <div className="container max-w-6xl px-4 py-8">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-xs font-bold tracking-widest text-primary uppercase">
          <Link href="/college/transfer-portal" className="hover:underline">
            Transfer Portal
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight uppercase sm:text-4xl">
          {portalYear} {sportInfo.title} Feed
        </h1>
        {searchParams.school && !schoolId ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No school found for &ldquo;{searchParams.school}&rdquo;.
          </p>
        ) : null}
        <dl className="mt-4 flex flex-wrap gap-4 text-sm">
          {Object.entries(statusCounts).map(([key, value]) => (
            <div key={key}>
              <dt className="text-muted-foreground">{key}</dt>
              <dd className="font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <TransferPortalFeedFilters
        sport={sport}
        portalYear={portalYear}
        useLatestYearPath={useLatestYearPath}
        filters={searchParams}
        availableYears={years}
      />

      <TransferPortalFeedTable entries={entriesResult.data} />
    </div>
  );
}
