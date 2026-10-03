import {
  getPlayerBySlug,
  getPlayerPortalHistory,
  getPortalConferences,
  getPortalPositions,
  getPortalStatusCounts,
  getPortalYears,
  getSchoolsBySanityIds,
  getSportBySlug,
  getTransferPortalEntries,
  getTransfersBySchool,
  type PortalEntryFilters,
} from "@redshirt-sports/db/queries";
import {
  PORTAL_CACHE_TAG,
  portalPlayerTag,
  portalSchoolTag,
  portalWireTag,
} from "@redshirt-sports/db/transfer-portal-cache-tags";
import { cacheLife, cacheTag } from "next/cache";

import { env } from "@/env";

/**
 * Admin writes expire portal tags through `/api/revalidate-tags`; this
 * lifetime is the backup for a missed revalidation.
 */
const PORTAL_CACHE_LIFE = {
  stale: 300,
  revalidate: 3600,
  expire: 86400,
} as const;

export function isTransferPortalEnabled() {
  return env.ENABLE_TRANSFER_PORTAL === "true";
}

export async function getCachedPortalSport(slug: string) {
  "use cache";
  cacheTag(PORTAL_CACHE_TAG);
  cacheLife(PORTAL_CACHE_LIFE);
  return getSportBySlug(slug);
}

export async function getCachedPortalYears(sportId: string) {
  "use cache";
  cacheTag(PORTAL_CACHE_TAG);
  cacheLife(PORTAL_CACHE_LIFE);
  return getPortalYears(sportId);
}

export async function getCachedPortalCounts({
  sport,
  sportId,
  portalYear,
}: {
  sport: string;
  sportId: string;
  portalYear: number;
}) {
  "use cache";
  cacheTag(PORTAL_CACHE_TAG, portalWireTag(sport, portalYear));
  cacheLife(PORTAL_CACHE_LIFE);
  return getPortalStatusCounts({ sportId, portalYear });
}

export async function getCachedPortalEntries(
  filters: PortalEntryFilters & { sport: string },
) {
  "use cache";
  cacheTag(PORTAL_CACHE_TAG, portalWireTag(filters.sport, filters.portalYear));
  cacheLife(PORTAL_CACHE_LIFE);
  const { sport: _sport, ...query } = filters;
  return getTransferPortalEntries(query);
}

export async function getCachedPortalFilterOptions({
  sport,
  sportId,
  portalYear,
}: {
  sport: string;
  sportId: string;
  portalYear: number;
}) {
  "use cache";
  cacheTag(PORTAL_CACHE_TAG, portalWireTag(sport, portalYear));
  cacheLife(PORTAL_CACHE_LIFE);
  const [positions, conferences] = await Promise.all([
    getPortalPositions({ sportId, portalYear }),
    getPortalConferences(sportId),
  ]);
  return { positions, conferences };
}

export async function getCachedPlayer(slug: string) {
  "use cache";
  cacheTag(PORTAL_CACHE_TAG, portalPlayerTag(slug));
  cacheLife(PORTAL_CACHE_LIFE);
  const player = await getPlayerBySlug(slug);
  if (!player) return null;
  const history = await getPlayerPortalHistory(player.id);
  return { player, history };
}

export async function getCachedSchoolTransfers(schoolSanityId: string) {
  "use cache";
  cacheTag(PORTAL_CACHE_TAG);
  cacheLife(PORTAL_CACHE_LIFE);
  const schools = await getSchoolsBySanityIds([schoolSanityId]);
  const school = schools.get(schoolSanityId);
  if (!school) return null;
  cacheTag(portalSchoolTag(school.id));
  return getTransfersBySchool({ schoolId: school.id });
}
