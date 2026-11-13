/** Cache tags for Next.js `"use cache"` transfer portal and player data on the public web app. */

/** The id-to-slug index the proxy and sitemap read. Expired by every push. */
export const PLAYER_INDEX_TAG = "portal:players";

/** One sport's wire for one cycle: the page's first rows and its JSON. */
export function portalWireTag(sportSlug: string, cycleYear: number) {
  return `portal:${sportSlug}:${cycleYear}`;
}

/** One player's profile page. Never share a tag across player pages. */
export function playerTag(playerId: number) {
  return `player:${playerId}`;
}
