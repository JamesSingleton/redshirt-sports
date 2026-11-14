import {
  currentCycleYear,
  PORTAL_SPORT_SLUGS,
  type PortalPlayerPage,
  type PortalWireData,
} from "@redshirt-sports/db/portal";
import {
  PLAYER_INDEX_TAG,
  playerTag,
  portalWireTag,
} from "@redshirt-sports/db/portal/cache-tags";
import {
  getPublishedPlayer,
  getPublishedWire,
  listIndexablePlayers,
  listPublishedWireCycles,
} from "@redshirt-sports/db/queries";
import { cacheLife, cacheTag } from "next/cache";

import { env } from "@/env";

/**
 * Same reasoning as `RANKINGS_CACHE_LIFE`: `"use cache: remote"` so every
 * instance shares one entry and Postgres sees one query per push. A push
 * expires the tags at once; this lifetime only covers a missed expiry.
 */
export const PORTAL_CACHE_LIFE = {
  stale: 300,
  revalidate: 604800,
  expire: 2592000,
} as const;

/** Players the page renders on the server; the rest load as JSON on demand. */
export const WIRE_FIRST_PLAYERS = 50;

/**
 * Whether the portal is on the public site. Read from the environment at
 * build time, so flipping it means a redeploy, and pages stay static.
 */
export function portalIsPublic() {
  return env.PORTAL_PUBLIC === "true";
}

export function isPortalSport(slug: string) {
  return PORTAL_SPORT_SLUGS.includes(slug);
}

/** A four-digit cycle year in a sane range, or null. */
export function parseCycleYear(value: string) {
  if (!/^\d{4}$/.test(value)) return null;
  const year = Number(value);
  return year >= 2000 && year <= 2100 ? year : null;
}

export async function getCachedPortalWire(
  sport: string,
  cycleYear: number,
): Promise<PortalWireData | null> {
  "use cache: remote";
  cacheTag(portalWireTag(sport, cycleYear));
  cacheLife(PORTAL_CACHE_LIFE);
  return getPublishedWire(sport, cycleYear);
}

/**
 * The sport's published cycles, newest first, and the one the bare
 * `/transfer-portal` URL shows: the newest with moves, or the current cycle
 * before anything is published. Every push expires it (`portal:players`),
 * so a sport's first move in a new cycle moves the default.
 */
export async function getCachedPortalCycles(sport: string) {
  "use cache: remote";
  cacheTag(PLAYER_INDEX_TAG);
  cacheLife(PORTAL_CACHE_LIFE);
  const cycles = await listPublishedWireCycles(sport);
  return { cycles, current: cycles[0] ?? currentCycleYear() };
}

export function portalWirePath(sport: string, cycleYear?: number) {
  return cycleYear
    ? `/college/${sport}/transfer-portal/${cycleYear}`
    : `/college/${sport}/transfer-portal`;
}

export function portalWireJsonPath(sport: string, cycleYear: number) {
  return `/api/v1/college/${sport}/transfer-portal/${cycleYear}`;
}

/**
 * One player's page. Tagged with the player alone, so a push refreshes only
 * the pages it changed. A merged player's page is tagged with the loser's id,
 * which the push republishes as a redirect.
 */
export async function getCachedPortalPlayer(
  playerId: number,
): Promise<PortalPlayerPage | null> {
  "use cache: remote";
  cacheTag(playerTag(playerId));
  cacheLife(PORTAL_CACHE_LIFE);
  return getPublishedPlayer(playerId);
}

/** Players search engines may list, for the sitemap. Every push expires it. */
export async function getCachedIndexablePlayers() {
  "use cache: remote";
  cacheTag(PLAYER_INDEX_TAG);
  cacheLife(PORTAL_CACHE_LIFE);
  const rows = await listIndexablePlayers();
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    publishedAt: row.publishedAt.toISOString(),
  }));
}
