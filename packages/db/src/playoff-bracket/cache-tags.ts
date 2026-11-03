/** Cache tags for Next.js `"use cache"` bracket data on the public web app. */

export const BRACKETS_CACHE_TAG = "brackets";

/** Season pages for one division: current bracket, projection archive, landing. */
export function bracketSeasonTag(
  sport: string,
  division: string,
  year: number,
) {
  return `brackets:${sport}:${division}:${year}`;
}

/** One edition, wherever it is rendered (season page, projection, article embed). */
export function bracketEditionTag(editionId: string) {
  return `brackets:edition:${editionId}`;
}

/** Tags to expire after any change to an edition the public can see. */
export function bracketInvalidationTags(edition: {
  id: string;
  sportSlug: string;
  divisionSlug: string | null;
  year: number;
}) {
  return [
    BRACKETS_CACHE_TAG,
    bracketEditionTag(edition.id),
    ...(edition.divisionSlug
      ? [
          bracketSeasonTag(
            edition.sportSlug,
            edition.divisionSlug,
            edition.year,
          ),
        ]
      : []),
  ];
}
