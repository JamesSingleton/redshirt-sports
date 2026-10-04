import { weekTitle } from "@/utils/espn";

const MONTHS = [
  "JAN.",
  "FEB.",
  "MAR.",
  "APR.",
  "MAY",
  "JUN.",
  "JUL.",
  "AUG.",
  "SEP.",
  "OCT.",
  "NOV.",
  "DEC.",
] as const;

/**
 * "Through Games SEP. 26, 2026" for regular-season polls, matching the
 * NCAA's poll labels; "2026 Preseason" / "2026 Final Rankings" otherwise.
 */
export function pollDateLabel({
  week,
  year,
  throughDate,
}: {
  week: number;
  year: number;
  throughDate: string | null;
}): string {
  if (!throughDate) {
    return `${year} ${weekTitle(week)}`;
  }

  const [throughYear, month, day] = throughDate.split("-");
  return `Through Games ${MONTHS[Number(month) - 1]} ${Number(day)}, ${throughYear}`;
}
