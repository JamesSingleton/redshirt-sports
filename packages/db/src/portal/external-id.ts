import type { PlayerIdProvider } from "./constants";

/** Where each provider's player id sits in a pasted profile URL. */
const URL_PATTERNS: Record<PlayerIdProvider, RegExp> = {
  // https://www.espn.com/college-football/player/_/id/4432577/jalen-brooks
  espn: /^https?:\/\/(?:www\.)?espn\.com\/[^?#]*\/id\/(\d{1,12})(?:[/?#]|$)/i,
  // https://stats.ncaa.org/players/7612345
  ncaa: /^https?:\/\/stats\.ncaa\.org\/players\/(\d{1,12})(?:[/?#]|$)/i,
};

/**
 * A provider's player id from what an admin pasted: the bare number, or the
 * player's profile URL on that site. Null when it's neither.
 */
export function parsePlayerExternalId(
  provider: PlayerIdProvider,
  input: string,
): string | null {
  const text = input.trim();
  if (text.length > 300) return null;
  if (/^\d{1,12}$/.test(text)) return text;
  return URL_PATTERNS[provider].exec(text)?.[1] ?? null;
}
