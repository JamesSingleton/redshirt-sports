import {
  getAvailablePortalYears,
  getLatestPortalYear,
  getPortalStatusCounts,
  getTransferPortalEntries,
} from "@redshirt-sports/db/queries/transfer-portal";
import { getDynamicFetchOptions } from "@redshirt-sports/sanity/live";
import Link from "next/link";
import type { Graph } from "schema-dts";

import { JsonLdScript, websiteId } from "@/components/json-ld";
import { TransferPortalFeedFilters } from "@/components/transfer-portal/feed-filters";
import { TransferPortalFeedTable } from "@/components/transfer-portal/feed-table";
import { getBaseUrl } from "@/lib/get-base-url";
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

function playerName(entry: {
  displayName: string | null;
  firstName: string;
  lastName: string;
}) {
  return entry.displayName ?? `${entry.firstName} ${entry.lastName}`.trim();
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
  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}/college/${sport}/transfer-portal/feed/${portalYear}`;
  const entries = entriesResult.data;

  const jsonLd: Graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${portalYear} ${sportInfo.title} Transfer Portal Feed`,
        description: `Live ${sportInfo.title.toLowerCase()} transfer portal activity for the ${portalYear} cycle.`,
        isPartOf: { "@id": websiteId },
        inLanguage: "en-US",
        mainEntity: { "@id": `${pageUrl}#itemlist` },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#itemlist`,
        url: pageUrl,
        numberOfItems: entries.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: entries.map((entry, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Person",
            name: playerName(entry),
            ...(entry.playerSlug
              ? { url: `${baseUrl}/player/${entry.playerSlug}` }
              : {}),
            ...(entry.position ? { jobTitle: entry.position } : {}),
          },
        })),
      },
    ],
  };

  return (
    <div className="container max-w-6xl px-4 py-8">
      <JsonLdScript
        data={jsonLd}
        id={`transfer-portal-feed-json-ld-${sport}-${portalYear}`}
      />
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

      <TransferPortalFeedTable entries={entries} />
    </div>
  );
}
