/** Assign articles to a homepage section without reusing IDs from earlier sections. */
export function allocateArticles<T extends { _id: string }>(
  articles: T[] | null | undefined,
  usedIds: Set<string>,
  limit: number,
): T[] {
  if (!articles?.length) return [];

  const result: T[] = [];

  for (const article of articles) {
    if (usedIds.has(article._id)) continue;
    usedIds.add(article._id);
    result.push(article);
    if (result.length >= limit) break;
  }

  return result;
}

export const HOME_SECTION_LIMITS = {
  megaboard: 5,
  collegeSports: 4,
  recruiting: 3,
  transfer: 2,
  grid3: 3,
  grid2: 4,
  grid2PlusHorizontal: 5,
} as const;
