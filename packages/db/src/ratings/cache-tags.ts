/** Cache tags for Next.js `"use cache"` ratings data on the public web app. */

/**
 * On every ratings entry. Only a pool's visibility change expires it: a pool
 * publish would otherwise expire every team page.
 */
export const RATINGS_CACHE_TAG = "ratings";

/** The list of public pools. */
export const RATINGS_POOLS_TAG = "ratings:pools";

/** Every published page for one pool: latest, archives, team sheets, sitemap. */
export function ratingsPoolTag(sport: string, pool: string) {
  return `ratings:${sport}:${pool}`;
}

/** Data that reads whichever pool of a sport is current, like bracket team stats. */
export function ratingsSportTag(sport: string) {
  return `ratings:sport:${sport}`;
}

/**
 * Tags to expire after publishing, unpublishing, or rolling back a pool week.
 * Team pages tag their ratings with each pool they appear in, so only that
 * pool's teams expire. Set `visibilityChanged` when a pool goes public or
 * private, which adds or removes it on every team page.
 */
export function ratingsInvalidationTags(
  sport: string,
  pool: string,
  { visibilityChanged = false }: { visibilityChanged?: boolean } = {},
) {
  return [
    ratingsPoolTag(sport, pool),
    RATINGS_POOLS_TAG,
    ratingsSportTag(sport),
    ...(visibilityChanged ? [RATINGS_CACHE_TAG] : []),
  ];
}
