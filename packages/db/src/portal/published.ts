import { z } from "zod";

import {
  PLAYER_CLASS_CODES,
  RECRUITMENT_EVENT_TYPES,
  RECRUITMENT_KINDS,
  RECRUITMENT_STATUSES,
} from "./constants";

/**
 * The shape of what the push writes to `published_players.doc` and
 * `published_wire_events.row`, and what the public site reads back.
 *
 * Built in SQL (see `queries/portal-publish.ts`) with null fields stripped, so
 * optional fields are absent rather than null. Schools are ids: names and logos
 * are joined from `schools` when the page is cached. `schoolName` appears only
 * for schools we have no row for (NAIA, JUCO). Source fields never appear.
 *
 * Bump `v` and keep reading the old version when the shape changes.
 */

const isoDate = z.string().min(1);

export const publishedSchoolSchema = z.object({
  schoolId: z.string().optional(),
  schoolName: z.string().optional(),
});

export const publishedPlacementSchema = publishedSchoolSchema.extend({
  divisionId: z.string().optional(),
  /** FBS, FCS, Mid-Major, Power Conferences. Absent where the level has none. */
  subdivisionId: z.string().optional(),
  conferenceId: z.string().optional(),
});

export const publishedEventSchema = publishedSchoolSchema.extend({
  id: z.number(),
  type: z.enum(RECRUITMENT_EVENT_TYPES),
  occurredAt: isoDate,
  /** A commitment the player later dropped. */
  superseded: z.boolean(),
});

export const publishedOfferSchema = publishedSchoolSchema.extend({
  eventId: z.number(),
  occurredAt: isoDate,
});

export const publishedRecruitmentSchema = z.object({
  id: z.number(),
  kind: z.enum(RECRUITMENT_KINDS),
  cycleYear: z.number(),
  status: z.enum(RECRUITMENT_STATUSES),
  statusAt: isoDate,
  enteredAt: isoDate,
  closedAt: isoDate.optional(),
  classAtEntry: z.enum(PLAYER_CLASS_CODES).optional(),
  eligibilityYears: z.number().optional(),
  isGradTransfer: z.boolean(),
  origin: publishedPlacementSchema,
  destination: publishedPlacementSchema.optional(),
  /** Oldest first, offers excluded. */
  events: z.array(publishedEventSchema),
  offers: z.array(publishedOfferSchema),
});

export const publishedEnrollmentSchema = publishedSchoolSchema.extend({
  startYear: z.number(),
  endYear: z.number().optional(),
});

export const publishedPlayerSportSchema = z.object({
  sportId: z.string(),
  sportSlug: z.string(),
  position: z.string().optional(),
  heightIn: z.number().optional(),
  weightLb: z.number().optional(),
  /** Oldest first; the one without `endYear` is the current school. */
  enrollments: z.array(publishedEnrollmentSchema),
  /** Newest first. */
  recruitments: z.array(publishedRecruitmentSchema),
});

export const publishedPlayerDocSchema = z.object({
  v: z.literal(1),
  id: z.number(),
  slug: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  suffix: z.string().optional(),
  hometownCity: z.string().optional(),
  hometownState: z.string().optional(),
  highSchoolName: z.string().optional(),
  hsGradYear: z.number().optional(),
  sports: z.array(publishedPlayerSportSchema),
});

/** A merged player: the page redirects, so the doc carries nothing else. */
export const publishedRedirectDocSchema = z.object({
  v: z.literal(1),
  redirectToPlayerId: z.number(),
});

export const publishedWireRowSchema = publishedSchoolSchema.extend({
  v: z.literal(1),
  eventId: z.number(),
  type: z.enum(RECRUITMENT_EVENT_TYPES),
  occurredAt: isoDate,
  superseded: z.boolean(),
  playerId: z.number(),
  slug: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  suffix: z.string().optional(),
  position: z.string().optional(),
  heightIn: z.number().optional(),
  weightLb: z.number().optional(),
  classAtEntry: z.enum(PLAYER_CLASS_CODES).optional(),
  isGradTransfer: z.boolean(),
  recruitmentId: z.number(),
  /** Where the recruitment stands now, for the one-row-per-player view. */
  status: z.enum(RECRUITMENT_STATUSES),
  origin: publishedPlacementSchema,
  destination: publishedPlacementSchema.optional(),
});

export type PublishedPlayerDoc = z.infer<typeof publishedPlayerDocSchema>;
export type PublishedRedirectDoc = z.infer<typeof publishedRedirectDocSchema>;
export type PublishedWireRow = z.infer<typeof publishedWireRowSchema>;
export type PublishedRecruitment = z.infer<typeof publishedRecruitmentSchema>;
