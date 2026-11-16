import {
  PORTAL_SPORT_SLUGS,
  type PortalWireData,
  type PublishedWireRow,
} from "@redshirt-sports/db/portal";

import {
  EMPTY_FILTERS,
  filterWirePlayers,
  type WireCounts,
  wireCounts,
} from "@/components/portal/wire-format";
import { getCachedPortalCycles, getCachedPortalWire } from "@/lib/portal-data";

/** Moves the hub lists across all sports. */
export const HUB_LATEST_MOVES = 10;

export interface HubSport {
  sport: string;
  cycleYear: number;
  counts: WireCounts;
}

export interface HubMove {
  sport: string;
  /** The player's latest move this cycle. */
  row: PublishedWireRow;
  /** The cycle's data, for the schools the row names. */
  wire: PortalWireData;
}

/**
 * Each player's latest move from every sport's cycle, newest first. A player
 * who moved twice shows once, at their latest.
 */
export function latestPortalMoves(
  wires: { sport: string; wire: PortalWireData }[],
  limit = HUB_LATEST_MOVES,
): HubMove[] {
  return wires
    .flatMap(({ sport, wire }) =>
      filterWirePlayers(wire, EMPTY_FILTERS).map(({ latest }) => ({
        sport,
        row: latest,
        wire,
      })),
    )
    .sort(
      (a, b) =>
        Date.parse(b.row.occurredAt) - Date.parse(a.row.occurredAt) ||
        b.row.eventId - a.row.eventId,
    )
    .slice(0, limit);
}

/**
 * Everything the hub shows from Postgres: each sport's current cycle counts
 * and the latest moves across them. Reads only the trackers' cached data, so
 * the hub adds no query of its own.
 */
export async function getPortalHubData() {
  const loaded = await Promise.all(
    PORTAL_SPORT_SLUGS.map(async (sport) => {
      const { current } = await getCachedPortalCycles(sport);
      const wire = await getCachedPortalWire(sport, current);
      return wire ? { sport, wire } : null;
    }),
  );
  const wires = loaded.filter((entry) => entry !== null);
  const sports: HubSport[] = wires.map(({ sport, wire }) => ({
    sport,
    cycleYear: wire.cycleYear,
    counts: wireCounts(filterWirePlayers(wire, EMPTY_FILTERS)),
  }));
  return { sports, moves: latestPortalMoves(wires) };
}
