/**
 * The proxy's memory of where player pages live. Next's `"use cache"` isn't
 * applied inside `proxy.ts`, so this is a plain in-process cache in front of
 * a one-row primary-key lookup.
 *
 * - Hits cost nothing; a miss is one tiny query (two ids and a slug).
 * - "No such player" is remembered too, so a crawler retrying an id doesn't
 *   keep asking the database.
 * - Entries live five minutes. A push that renames or merges a player is
 *   seen within that time; until then the page's own check (which a push
 *   refreshes at once) still redirects, just without the 301 status.
 * - Capped, oldest out first, so walking every id can't grow it forever.
 */
export interface PlayerAddress {
  id: number;
  slug: string;
}

export const ADDRESS_TTL_MS = 5 * 60 * 1000;
export const ADDRESS_MAX_ENTRIES = 5000;

export function createPlayerAddressCache(
  load: (playerId: number) => Promise<PlayerAddress | null>,
  now: () => number = Date.now,
) {
  const entries = new Map<
    number,
    { address: PlayerAddress | null; expires: number }
  >();
  return async function playerAddress(
    playerId: number,
  ): Promise<PlayerAddress | null> {
    const hit = entries.get(playerId);
    if (hit && hit.expires > now()) return hit.address;
    const address = await load(playerId);
    // Re-insert so the Map's order is oldest-written first.
    entries.delete(playerId);
    entries.set(playerId, { address, expires: now() + ADDRESS_TTL_MS });
    if (entries.size > ADDRESS_MAX_ENTRIES) {
      entries.delete(entries.keys().next().value as number);
    }
    return address;
  };
}
