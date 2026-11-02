/** Cache tags for Next.js `"use cache"` ratings data on the public web app. */

export const RATINGS_CACHE_TAG = "ratings";

/** Every published page for one pool: latest, archives, team sheets, sitemap. */
export function ratingsPoolTag(sport: string, pool: string) {
  return `ratings:${sport}:${pool}`;
}

/** Tags to expire after publishing, unpublishing, or rolling back a pool week. */
export function ratingsInvalidationTags(sport: string, pool: string) {
  return [RATINGS_CACHE_TAG, ratingsPoolTag(sport, pool)];
}
