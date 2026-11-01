/**
 * Top 25 polls each sport can list, by sport slug. Poll slugs must match
 * Postgres `polls.slug` for that sport (and `VALID_DIVISIONS` in
 * apps/web/lib/vote-ballot.ts). A sport not listed here has no polls yet.
 */
const POLLS_BY_SPORT: Record<string, ReadonlyArray<string>> = {
  football: ["fbs", "fcs", "d2", "d3"],
  "mens-basketball": ["mid-major", "power-conferences"],
  "womens-basketball": ["mid-major", "power-conferences"],
};

const POLL_TITLES: Record<string, string> = {
  fbs: "FBS",
  fcs: "FCS",
  d2: "Division II",
  d3: "Division III",
  "mid-major": "Mid-Major",
  "power-conferences": "Power Conferences",
};

export type PollOption = { title: string; value: string };

/** Every poll, for schema extraction and typegen. */
export const ALL_POLL_OPTIONS: PollOption[] = Object.entries(POLL_TITLES).map(
  ([value, title]) => ({ title, value }),
);

export function pollTitle(slug: string | undefined): string | undefined {
  return slug ? (POLL_TITLES[slug] ?? slug) : undefined;
}

/** Polls an editor may pick for the sport with this slug. */
export function pollOptionsForSport(
  sportSlug: string | undefined,
): PollOption[] {
  const allowed = sportSlug ? (POLLS_BY_SPORT[sportSlug] ?? []) : [];
  return ALL_POLL_OPTIONS.filter((option) => allowed.includes(option.value));
}

/** Validation message when a poll doesn't belong to the sport, else true. */
export function validateSportPoll(
  pollSlug: string | undefined,
  sportSlug: string | undefined,
): true | string {
  if (!pollSlug) return true;
  if (!sportSlug) return "Set the sport's slug before adding polls";
  if (pollOptionsForSport(sportSlug).some((o) => o.value === pollSlug)) {
    return true;
  }
  return `${pollTitle(pollSlug)} isn't a poll for this sport`;
}
