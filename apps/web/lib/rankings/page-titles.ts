/** seoTitle budget before the site appends " | Redshirt Sports". */
const MAX_TITLE_LENGTH = 60;

/** `weekTitle` says "Final Rankings", which repeats "Rankings" in a title. */
function shortWeekLabel(titleWeek: string): string {
  return titleWeek === "Final Rankings" ? "Final" : titleWeek;
}

/**
 * Title for the stable latest-poll URL. Carries the season and week so it
 * matches dated searches ("fcs rankings 2026") and reads as current in
 * results. Drops the sport label when the full form would run past 60
 * characters.
 */
export function latestPollPageTitle({
  divisionName,
  sportLabel,
  year,
  titleWeek,
}: {
  divisionName: string;
  sportLabel: string;
  year: number | string;
  titleWeek: string;
}): string {
  const suffix = `Top 25 Rankings ${year}: ${shortWeekLabel(titleWeek)}`;
  const full = `${divisionName} ${sportLabel} ${suffix}`;
  return full.length <= MAX_TITLE_LENGTH ? full : `${divisionName} ${suffix}`;
}
