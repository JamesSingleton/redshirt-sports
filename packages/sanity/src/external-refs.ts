/**
 * Games and players are never Sanity documents: the data provider owns them.
 * An article stores which one it means as a single string,
 *
 *   "<provider>:<id>|<label>"   e.g. "espn:4775196|Tommy Mellott"
 *
 * The id is what everything keys on. The label is a snapshot taken when the
 * editor picked it, so the Studio and structured data can name the game or
 * player without calling the provider. It is never the source of truth.
 */
export const EXTERNAL_PROVIDERS = ["espn", "ncaa"] as const;
export type ExternalProvider = (typeof EXTERNAL_PROVIDERS)[number];

export type ExternalRef = {
  provider: ExternalProvider;
  id: string;
  label: string;
};

const PATTERN = /^(espn|ncaa):([A-Za-z0-9._-]{1,64})\|(.+)$/;

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
