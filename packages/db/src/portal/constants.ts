/**
 * Shared vocabulary for players, recruitments, and the transfer portal wire.
 * The database check constraints in `schema.ts` are built from these arrays, so
 * adding a value here means generating a migration that alters the check.
 */

export const RECRUITMENT_KINDS = ["transfer", "high_school"] as const;
export type RecruitmentKind = (typeof RECRUITMENT_KINDS)[number];

export const RECRUITMENT_STATUSES = [
  "entered",
  "committed",
  "signed",
  "enrolled",
  "withdrawn",
] as const;
export type RecruitmentStatus = (typeof RECRUITMENT_STATUSES)[number];

/** Statuses that end a recruitment. A player can only have one open recruitment per sport. */
export const CLOSED_RECRUITMENT_STATUSES = [
  "enrolled",
  "withdrawn",
] as const satisfies readonly RecruitmentStatus[];

export const RECRUITMENT_EVENT_TYPES = [
  "entered",
  "offered",
  "committed",
  "decommitted",
  "signed",
  "enrolled",
  "withdrew",
] as const;
export type RecruitmentEventType = (typeof RECRUITMENT_EVENT_TYPES)[number];

/** Event types that name a school. The rest must not carry one. */
export const SCHOOL_EVENT_TYPES = [
  "offered",
  "committed",
  "decommitted",
  "signed",
  "enrolled",
] as const satisfies readonly RecruitmentEventType[];

/** Where we learned of a move. Internal only: never published. */
export const EVENT_SOURCE_TYPES = [
  "social",
  "email",
  "school",
  "reporter",
  "submission",
  "redshirt",
] as const;
export type EventSourceType = (typeof EVENT_SOURCE_TYPES)[number];

export const PORTAL_PUSH_TRIGGERS = ["admin", "cron"] as const;
export type PortalPushTrigger = (typeof PORTAL_PUSH_TRIGGERS)[number];

export const PLAYER_SUBMISSION_STATUSES = [
  "new",
  "accepted",
  "rejected",
  "spam",
] as const;
export type PlayerSubmissionStatus =
  (typeof PLAYER_SUBMISSION_STATUSES)[number];

export const PLAYER_SUBMITTER_ROLES = [
  "player",
  "parent",
  "coach",
  "agent",
  "other",
] as const;
export type PlayerSubmitterRole = (typeof PLAYER_SUBMITTER_ROLES)[number];

/** Class at the time a player enters the portal. The code doubles as the abbreviation. */
export const PLAYER_CLASSES = [
  { code: "FR", label: "Freshman" },
  { code: "RS-FR", label: "Redshirt freshman" },
  { code: "SO", label: "Sophomore" },
  { code: "RS-SO", label: "Redshirt sophomore" },
  { code: "JR", label: "Junior" },
  { code: "RS-JR", label: "Redshirt junior" },
  { code: "SR", label: "Senior" },
  { code: "RS-SR", label: "Redshirt senior" },
  { code: "GR", label: "Graduate student" },
] as const;
export type PlayerClassCode = (typeof PLAYER_CLASSES)[number]["code"];
export const PLAYER_CLASS_CODES = PLAYER_CLASSES.map(
  (playerClass) => playerClass.code,
) as readonly PlayerClassCode[];

export function playerClassLabel(code: string): string | null {
  return (
    PLAYER_CLASSES.find((playerClass) => playerClass.code === code)?.label ??
    null
  );
}

export interface PlayerPosition {
  code: string;
  label: string;
}

/**
 * Positions by sport slug (`sports.slug`). Validated in code rather than by a
 * check constraint because the valid set depends on the sport.
 */
export const POSITIONS_BY_SPORT: Record<string, readonly PlayerPosition[]> = {
  football: [
    { code: "QB", label: "Quarterback" },
    { code: "RB", label: "Running back" },
    { code: "WR", label: "Wide receiver" },
    { code: "TE", label: "Tight end" },
    { code: "OT", label: "Offensive tackle" },
    { code: "IOL", label: "Interior offensive line" },
    { code: "DL", label: "Defensive line" },
    { code: "EDGE", label: "Edge" },
    { code: "LB", label: "Linebacker" },
    { code: "CB", label: "Cornerback" },
    { code: "S", label: "Safety" },
    { code: "ATH", label: "Athlete" },
    { code: "K", label: "Kicker" },
    { code: "P", label: "Punter" },
    { code: "LS", label: "Long snapper" },
  ],
  "mens-basketball": [
    { code: "PG", label: "Point guard" },
    { code: "SG", label: "Shooting guard" },
    { code: "CG", label: "Combo guard" },
    { code: "SF", label: "Small forward" },
    { code: "PF", label: "Power forward" },
    { code: "C", label: "Center" },
  ],
  "womens-basketball": [
    { code: "PG", label: "Point guard" },
    { code: "SG", label: "Shooting guard" },
    { code: "CG", label: "Combo guard" },
    { code: "SF", label: "Small forward" },
    { code: "PF", label: "Power forward" },
    { code: "C", label: "Center" },
  ],
};

/** Sports the tracker serves. Adding one is this list plus its positions. */
export const PORTAL_SPORT_SLUGS = Object.keys(POSITIONS_BY_SPORT);

export function isValidPosition(sportSlug: string, code: string): boolean {
  return (
    POSITIONS_BY_SPORT[sportSlug]?.some((position) => position.code === code) ??
    false
  );
}

/** First player id. Keeps `/players/<name>-<id>` from starting at 1. */
export const FIRST_PLAYER_ID = 100_000;
