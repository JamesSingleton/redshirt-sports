/**
 * Games and players are never Sanity documents: the data provider owns them.
 * An article stores which one it means as a single string,
 *
 *   "<provider>:<id>|<label>"   e.g. "espn:4775196|Tommy Mellott"
 *                               or "redshirt:100007|Darnell Okafor"
 *
 * The id is what everything keys on. The label is a snapshot taken when the
 * editor picked it, so the Studio and structured data can name the game or
 * player without calling the provider. It is never the source of truth.
 *
 * A player tag also stores that id without the label (`PlayerTag.key`), so
 * the player page can find its articles with an exact match.
 */
/** `redshirt` is our own transfer portal players: the id is the one in `/players/<name>-<id>`. */
export const EXTERNAL_PROVIDERS = ["espn", "ncaa", "redshirt"] as const;
export type ExternalProvider = (typeof EXTERNAL_PROVIDERS)[number];

export type ExternalRef = {
  provider: ExternalProvider;
  id: string;
  label: string;
};

const PATTERN = /^(espn|ncaa|redshirt):([A-Za-z0-9._-]{1,64})\|(.+)$/;

export function formatExternalRef(ref: ExternalRef): string {
  const label = ref.label.replace(/\s+/g, " ").trim();
  return `${ref.provider}:${ref.id}|${label}`;
}

export function parseExternalRef(
  value: string | null | undefined,
): ExternalRef | null {
  const [, provider, id, rawLabel] = value?.match(PATTERN) ?? [];
  const label = rawLabel?.trim();
  if (!provider || !id || !label) return null;
  return { provider: provider as ExternalProvider, id, label };
}

/**
 * Who a player is, without the label: `"redshirt:412"`. Queries match on it
 * exactly (`array::intersects(players[].key, $keys)`), which the Content Lake
 * answers from its index. Matching a prefix of `ref` instead scans every post.
 */
export function externalKey(ref: Pick<ExternalRef, "provider" | "id">): string {
  return `${ref.provider}:${ref.id}`;
}

/**
 * One entry in an article's `players` array. `ref` is the picked player
 * (`"<provider>:<id>|<label>"`); `key` is `externalKey` of it, kept in step by
 * the Studio input and checked by the house rules.
 */
export type PlayerTag = {
  ref?: string | null;
  key?: string | null;
};

/** The player a tag names, or null when its `ref` is malformed. */
export function parsePlayerTag(
  tag: PlayerTag | null | undefined,
): ExternalRef | null {
  return parseExternalRef(tag?.ref);
}

/** The keys an article's page lookup matches for one of our players. */
export function redshirtPlayerKeys(ids: readonly number[]): string[] {
  return ids.map((id) => externalKey({ provider: "redshirt", id: String(id) }));
}
