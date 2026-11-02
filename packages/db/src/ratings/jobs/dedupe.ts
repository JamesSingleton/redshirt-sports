const easternDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function normalizedName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Same game from any source → same key: the US Eastern kickoff date plus both
 * sides (school id when known, else the normalized name), in sorted order.
 */
export function dedupeKey(
  kickoffAt: string | null,
  home: { schoolId: string | null; name: string },
  away: { schoolId: string | null; name: string },
): string {
  const day = kickoffAt ? easternDate.format(new Date(kickoffAt)) : "undated";
  const side = (s: { schoolId: string | null; name: string }) =>
    s.schoolId ?? `name:${normalizedName(s.name)}`;
  return [day, ...[side(home), side(away)].sort()].join("|");
}
