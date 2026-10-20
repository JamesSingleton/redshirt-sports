/** Nav labels and mega-menu keys — §32.7, phase1/index.html */
export const SPORT_NAV_LABEL: Record<string, string> = {
  football: "College Football",
  "mens-basketball": "Men's Basketball",
  "womens-basketball": "Women's Basketball",
};

export type SportMegaKey = "fb" | "mbb" | "wbb";

export const SPORT_MEGA_KEY: Record<string, SportMegaKey> = {
  football: "fb",
  "mens-basketball": "mbb",
  "womens-basketball": "wbb",
};

export function sportNavLabel(slug: string, fallbackName: string): string {
  return SPORT_NAV_LABEL[slug] ?? fallbackName;
}

export function sportHubPath(slug: string): string {
  return `/college/${slug}/news`;
}

export function sportRankingsIndexPath(slug: string): string {
  return `/college/${slug}/rankings`;
}

/** Navbar / mega-menu: at least one published poll week exists for this sport. */
export function sportHasRankingsNav(
  latestRankings: ReadonlyArray<{
    sport: string;
    divisions: ReadonlyArray<
      { division: string; week: number; year: number } | undefined
    >;
  }>,
  sportSlug: string,
): boolean {
  const entry = latestRankings.find((row) => row.sport === sportSlug);
  if (!entry?.divisions?.length) {
    return false;
  }
  return entry.divisions.some(
    (row) => row?.division && row.week != null && row.year != null,
  );
}

/** Sports that should expose Rankings in nav (for a future global Rankings menu). */
export function sportSlugsWithRankingsNav(
  latestRankings: ReadonlyArray<{
    sport: string;
    divisions: ReadonlyArray<
      { division: string; week: number; year: number } | undefined
    >;
  }>,
): string[] {
  const slugs: string[] = [];
  for (const row of latestRankings) {
    if (
      !slugs.includes(row.sport) &&
      sportHasRankingsNav(latestRankings, row.sport)
    ) {
      slugs.push(row.sport);
    }
  }
  return slugs;
}

/** Top-level nav Rankings link (single sport). Prefer football when multiple exist. */
export function globalRankingsNavHref(
  latestRankings: ReadonlyArray<{
    sport: string;
    divisions: ReadonlyArray<
      { division: string; week: number; year: number } | undefined
    >;
  }>,
): string | null {
  const slugs = sportSlugsWithRankingsNav(latestRankings);
  if (slugs.length === 0) {
    return null;
  }
  const slug =
    slugs.includes("football") ? "football" : (slugs[0] as string | undefined);
  return slug ? sportRankingsIndexPath(slug) : null;
}

/** When true, replace the single Rankings link with a sport picker (future). */
export function globalRankingsNavIsMultiSport(
  latestRankings: ReadonlyArray<{
    sport: string;
    divisions: ReadonlyArray<
      { division: string; week: number; year: number } | undefined
    >;
  }>,
): boolean {
  return sportSlugsWithRankingsNav(latestRankings).length > 1;
}
