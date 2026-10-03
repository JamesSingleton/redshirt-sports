"use server";

import { PORTAL_STATUSES } from "@redshirt-sports/db/schema";
import { z } from "zod";

import {
  getCachedPortalEntries,
  getCachedPortalSport,
  isTransferPortalEnabled,
} from "@/lib/transfer-portal";
import { PORTAL_SPORTS } from "@/lib/transfer-portal-format";

const loadMoreSchema = z.object({
  sport: z.enum(PORTAL_SPORTS.map((sport) => sport.slug)),
  portalYear: z.number().int().min(2000).max(2100),
  status: z.enum(PORTAL_STATUSES).optional(),
  position: z.string().max(10).optional(),
  conferenceId: z.string().max(64).optional(),
  search: z.string().max(80).optional(),
  cursor: z.string().min(1).max(200),
});

export type LoadMorePortalInput = z.input<typeof loadMoreSchema>;

/** Public read: the wire is open to anyone once the portal flag is on. */
export async function loadMorePortalEntries(input: LoadMorePortalInput) {
  if (!isTransferPortalEnabled()) {
    throw new Error("Transfer portal is not enabled");
  }

  const query = loadMoreSchema.parse(input);
  const sport = await getCachedPortalSport(query.sport);
  if (!sport) return { entries: [], nextCursor: null };

  return getCachedPortalEntries({ ...query, sportId: sport.id });
}
