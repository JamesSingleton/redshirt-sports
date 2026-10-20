import slugify from "slugify";

/** Public URL slug for a voter (name-based, no Clerk/user ids in links). */
export function voterBallotSlug(name: string): string {
  return slugify(name.trim(), { lower: true, strict: true });
}

export function resolveVoterHighlightUserIds(
  tokens: string[],
  voters: Array<{ userId: string; slug: string }>,
): string[] {
  if (tokens.length === 0) return [];
  const bySlug = new Map(voters.map((v) => [v.slug, v.userId]));
  const byUserId = new Map(voters.map((v) => [v.userId, v.userId]));
  const ids: string[] = [];
  for (const token of tokens) {
    const fromSlug = bySlug.get(token);
    if (fromSlug) {
      ids.push(fromSlug);
      continue;
    }
    if (byUserId.has(token)) {
      ids.push(token);
    }
  }
  return ids;
}
