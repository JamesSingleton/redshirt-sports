import {
  PORTAL_SPORT_SLUGS,
  playerPath,
  sliceWire,
  wirePlayerCount,
} from "@redshirt-sports/db/portal";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLdScript } from "@/components/json-ld";
import {
  EMPTY_FILTERS,
  filterWirePlayers,
  groupWirePlayers,
  playerName,
  portalSportLabel,
  wireCounts,
} from "@/components/portal/wire-format";
import { WireScope } from "@/components/portal/wire-scope";
import { WireView } from "@/components/portal/wire-view";
import { buildIndexedPageJsonLd } from "@/lib/page-json-ld";
import {
  getCachedPortalCycles,
  getCachedPortalWire,
  isPortalSport,
  portalWireJsonPath,
  portalWirePath,
  WIRE_FIRST_PLAYERS,
} from "@/lib/portal-data";
import { sportHubPath, sportNavLabel } from "@/lib/sport-nav";

export { portalSportLabel };

export function portalWireTitle(sport: string, cycleYear: number) {
  return `${sportNavLabel(sport, sport)} Transfer Portal ${cycleYear}`;
}

/** The page description, shared by the metadata and the JSON-LD. */
export function portalWireDescription(sport: string, cycleYear: number) {
  return `Every ${sportNavLabel(sport, sport)} player in the ${cycleYear} transfer portal: who entered, who committed where, and who withdrew.`;
}

/**
 * One sport's portal tracker for one cycle. `cycleYear` is null on the bare
 * `/transfer-portal` URL, which shows the newest cycle.
 */
export async function WirePage({
  sport,
  cycleYear,
}: {
  sport: string;
  cycleYear: number | null;
}) {
  if (!isPortalSport(sport)) notFound();
  const { cycles, current } = await getCachedPortalCycles(sport);
  const year = cycleYear ?? current;
  // A past cycle with nothing published isn't a page.
  if (
    cycleYear !== null &&
    cycleYear !== current &&
    !cycles.includes(cycleYear)
  ) {
    notFound();
  }
  const wire = await getCachedPortalWire(sport, year);
  if (!wire) notFound();

  const years = [...new Set([current, ...cycles])].sort((a, b) => b - a);
  const scope = {
    sport,
    sports: PORTAL_SPORT_SLUGS.map((slug) => ({
      slug,
      label: portalSportLabel(slug),
    })),
    year,
    years,
    currentYear: current,
  };

  const path = portalWirePath(sport, cycleYear ?? undefined);
  const sportLabel = sportNavLabel(sport, sport);
  const first = sliceWire(wire, WIRE_FIRST_PLAYERS);
  // The players the page renders, newest first, as the page's item list.
  const items = [
    ...new Map(
      groupWirePlayers(first.rows).map(({ latest }) => [
        latest.playerId,
        {
          name: playerName(latest),
          path: playerPath({ id: latest.playerId, slug: latest.slug }),
        },
      ]),
    ).values(),
  ];

  return (
    <div className="pb-12">
      <JsonLdScript
        id={`portal-wire-${sport}-${year}`}
        data={buildIndexedPageJsonLd({
          pageType: "CollectionPage",
          name: portalWireTitle(sport, year),
          description: portalWireDescription(sport, year),
          path,
          items,
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: "College", path: "/college/news" },
            { name: sportLabel, path: sportHubPath(sport) },
            { name: "Transfer Portal", path: portalWirePath(sport) },
            ...(cycleYear === null ? [] : [{ name: String(year), path }]),
          ],
        })}
      />
      <div className="pt-5">
        <nav
          className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs"
          aria-label="Breadcrumb"
        >
          <Link href={sportHubPath(sport)} className="hover:text-foreground">
            {sportNavLabel(sport, sport)}
          </Link>
          <ChevronRight className="size-3 shrink-0" aria-hidden />
          <span className="text-foreground">Transfer Portal</span>
        </nav>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-[2.6rem] leading-[0.9] font-extrabold uppercase md:text-[3.4rem]">
            {year} {portalSportLabel(sport)}
            <span className="text-muted-foreground block">Transfer Portal</span>
          </h1>
          {/* Season and sport pick the page; the filters below narrow it. */}
          <div className="flex gap-2">
            <WireScope {...scope} triggerClassName="h-9 shadow-xs" />
          </div>
        </div>
      </div>
      <div className="pt-5">
        <WireView
          initial={first}
          initialCounts={wireCounts(filterWirePlayers(wire, EMPTY_FILTERS))}
          totalPlayers={wirePlayerCount(wire.rows)}
          jsonUrl={portalWireJsonPath(sport, year)}
          scope={scope}
        />
      </div>
    </div>
  );
}

export function WirePageSkeleton() {
  return (
    <div className="flex flex-col gap-4 pt-5 pb-12" aria-busy>
      <div className="bg-muted h-3 w-40 animate-pulse rounded" />
      <div className="bg-muted h-24 w-80 max-w-full animate-pulse rounded" />
      <div className="bg-muted h-36 w-full animate-pulse rounded-xl" />
      <div className="bg-muted h-24 w-full animate-pulse rounded-xl" />
      <div className="bg-muted h-96 w-full animate-pulse rounded-xl" />
    </div>
  );
}
