import type { MetadataRoute } from "next";

import {
  bracketEditionPath,
  bracketPaths,
  getCachedAllPublishedBrackets,
} from "@/lib/bracket-data";
import { getBaseUrl } from "@/lib/get-base-url";

type Entry = MetadataRoute.Sitemap[number];

/**
 * Playoff bracket pages, built only from published editions: each division's
 * latest bracket, every season, and every weekly projection. Drafts 404, so
 * they never appear, and the list is empty until the first bracket publishes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl().replace(/\/$/, "");
  const entries = new Map<string, Entry>();
  // A landing or season page shows several editions; it changed when any did.
  const add = (path: string, date: Date | undefined, rest: Partial<Entry>) => {
    const existing = entries.get(path);
    if (!existing) {
      entries.set(path, {
        url: `${base}${path}`,
        ...(date ? { lastModified: date } : {}),
        ...rest,
      });
    } else if (
      date &&
      date > ((existing.lastModified as Date | undefined) ?? 0)
    ) {
      existing.lastModified = date;
    }
  };

  for (const edition of await getCachedAllPublishedBrackets()) {
    // Bracket pages live under a division; a division-less format has none.
    if (!edition.divisionSlug) continue;
    const paths = bracketPaths(edition.sportSlug, edition.divisionSlug);
    const date = edition.updatedAt ?? edition.publishedAt ?? undefined;
    add(paths.landing, date, { changeFrequency: "weekly", priority: 0.8 });
    add(paths.season(edition.year), date, { priority: 0.7 });
    if (edition.kind === "projection") {
      add(bracketEditionPath(edition), date, { priority: 0.6 });
    }
  }

  return [...entries.values()].sort(
    (a, b) => Number(b.priority) - Number(a.priority),
  );
}
