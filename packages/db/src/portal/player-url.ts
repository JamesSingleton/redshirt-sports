import { FIRST_PLAYER_ID } from "./constants";

/** Lowercase, accent-free, single-spaced. Stored in `players.name_search` for duplicate matching. */
export function normalizePlayerName(...parts: (string | null | undefined)[]) {
  return parts
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** URL slug from a name: "D'Andre Swift Jr." -> "dandre-swift-jr". */
export function playerSlug(
  firstName: string,
  lastName: string,
  suffix?: string | null,
) {
  const slug = [firstName, lastName, suffix]
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "player";
}

/** The one canonical path for a player. The id finds the player; the slug is decoration. */
export function playerPath(player: { id: number; slug: string }) {
  return `/players/${player.slug}-${player.id}`;
}

const SLUG_ID_PATTERN = /^([a-z0-9]+(?:-[a-z0-9]+)*)-([1-9]\d{5,14})$/;

/**
 * Split a `/players/[slugId]` segment. Returns null for anything that cannot be
 * a player URL, so callers can 404 without touching the database.
 */
export function parsePlayerSlugId(
  segment: string,
): { slug: string; id: number } | null {
  const match = SLUG_ID_PATTERN.exec(segment);
  if (!match) return null;
  const id = Number(match[2]);
  if (!Number.isSafeInteger(id) || id < FIRST_PLAYER_ID) return null;
  return { slug: match[1] as string, id };
}
