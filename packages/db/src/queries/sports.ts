import { eq } from "drizzle-orm";

import { primaryDb as db } from "../client";
import { sportsTable } from "../schema";

export type SportParam = "football" | "mens-basketball" | "womens-basketball";

// Sport ids never change, and nearly every rankings loader starts by looking
// one up, so remember each id for the life of the server instance. Only found
// ids are kept; a miss is looked up again next time.
const sportIdBySlug = new Map<string, string>();

export async function getSportIdBySlug(
  slug: SportParam,
): Promise<string | null> {
  const known = sportIdBySlug.get(slug);
  if (known) return known;

  const result = await db
    .select({ id: sportsTable.id })
    .from(sportsTable)
    .where(eq(sportsTable.slug, slug))
    .limit(1);

  const id = result[0]?.id || null;
  if (id) sportIdBySlug.set(slug, id);
  return id;
}

/** Tests only: forget remembered sport ids. */
export function clearSportIdCache() {
  sportIdBySlug.clear();
}
