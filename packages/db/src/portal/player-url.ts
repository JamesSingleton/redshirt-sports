import { FIRST_PLAYER_ID } from "./constants";

/**
 * Longest name input we slug or normalize. Real names are far shorter; the cap
 * keeps work bounded when these run on admin or submission-form input.
 */
const MAX_NAME_INPUT = 200;

/**
 * Longest `/players/[slugId]` segment we will even look at. The proxy runs
 * this on every request to `/players/*`, so anything longer is a 404 without
 * further work.
 */
const MAX_SLUG_ID_LENGTH = 160;

/** Lowercase ASCII words from a name, accents folded and punctuation dropped. */
function nameWords(parts: (string | null | undefined)[], dropChars?: RegExp) {
  const folded = parts
    .filter(Boolean)
    .join(" ")
    .slice(0, MAX_NAME_INPUT)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  return (dropChars ? folded.replace(dropChars, "") : folded)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Lowercase, accent-free, single-spaced. Stored in `players.name_search` for duplicate matching. */
export function normalizePlayerName(...parts: (string | null | undefined)[]) {
  return nameWords(parts).join(" ");
}

/** URL slug from a name: "D'Andre Swift Jr." -> "dandre-swift-jr". */
export function playerSlug(
  firstName: string,
  lastName: string,
  suffix?: string | null,
) {
  // Apostrophes and periods join their word ("D'Andre" -> "dandre", "L.J." -> "lj").
  return (
    nameWords([firstName, lastName, suffix], /['’.]/g).join("-") || "player"
  );
}

/** The one canonical path for a player. The id finds the player; the slug is decoration. */
export function playerPath(player: { id: number; slug: string }) {
  return `/players/${player.slug}-${player.id}`;
}

/** Lowercase words joined by single hyphens. Unambiguous, so it runs in linear time. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID_PATTERN = /^[1-9]\d{5,14}$/;

/**
 * Split a `/players/[slugId]` segment. Returns null for anything that cannot be
 * a player URL, so callers can 404 without touching the database.
 */
export function parsePlayerSlugId(
  segment: string,
): { slug: string; id: number } | null {
  if (segment.length > MAX_SLUG_ID_LENGTH) return null;
  const split = segment.lastIndexOf("-");
  if (split <= 0) return null;
  const slug = segment.slice(0, split);
  const idText = segment.slice(split + 1);
  if (!ID_PATTERN.test(idText) || !SLUG_PATTERN.test(slug)) return null;
  const id = Number(idText);
  if (!Number.isSafeInteger(id) || id < FIRST_PLAYER_ID) return null;
  return { slug, id };
}
