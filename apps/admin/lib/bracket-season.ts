/** Football seasons run into January: before July, the season is last year's. */
export function currentFootballSeasonYear(now = new Date()) {
  const year = now.getUTCFullYear();
  return now.getUTCMonth() >= 6 ? year : year - 1;
}

export function bracketFormatLabel(format: {
  sportSlug: string;
  divisionSlug: string | null;
}) {
  const division = format.divisionSlug?.toUpperCase() ?? "";
  const sport = format.sportSlug === "football" ? "football" : format.sportSlug;
  return `${division} ${sport}`.trim();
}

export function bracketEditionName(edition: {
  kind: string;
  weekNumber: number | null;
}) {
  return edition.kind === "official"
    ? "Official bracket"
    : `Week ${edition.weekNumber} projection`;
}

const EASTERN = "America/New_York";

function easternOffsetMinutes(date: Date) {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN,
    timeZoneName: "shortOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = /GMT([+-]\d+)(?::(\d+))?/.exec(label ?? "");
  if (!match) return 0;
  const hours = Number(match[1]);
  return hours * 60 + Math.sign(hours) * Number(match[2] ?? 0);
}

/** Kickoffs are entered and shown in Eastern time: "2026-11-29T14:00" → Date. */
export function easternInputToDate(value: string): Date | null {
  const asUtc = new Date(`${value}:00Z`);
  if (Number.isNaN(asUtc.getTime())) return null;
  return new Date(asUtc.getTime() - easternOffsetMinutes(asUtc) * 60_000);
}

/** Date → the `datetime-local` value for the same Eastern wall-clock time. */
export function dateToEasternInput(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: EASTERN,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(" ", "T");
}
