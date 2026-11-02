/** Words that say nothing about which school it is. */
const NOISE = new Set([
  "university",
  "college",
  "of",
  "the",
  "at",
  "and",
  "institute",
]);

const EXPANSIONS: Array<[RegExp, string]> = [
  [/\bst\.?(?=\s|$)/g, "state"],
  [/\bso\.?(?=\s)/g, "southern"],
  [/\bse\b/g, "southeastern"],
  [/\bne\b/g, "northeastern"],
  [/\bnw\b/g, "northwestern"],
  [/\bsw\b/g, "southwestern"],
  [/\bcal\b/g, "california"],
  [/&/g, " and "],
];

export function nameTokens(value: string): string[] {
  let text = value.toLowerCase();
  for (const [pattern, replacement] of EXPANSIONS) {
    text = text.replace(pattern, replacement);
  }
  return text
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 0 && !NOISE.has(token));
}

/** Overlap of name tokens, 0–1 (Dice coefficient). */
export function nameSimilarity(a: string, b: string): number {
  const left = new Set(nameTokens(a));
  const right = new Set(nameTokens(b));
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return (2 * shared) / (left.size + right.size);
}

export type SchoolCandidate = {
  id: string;
  name: string | null;
  shortName: string | null;
  nickname: string | null;
};

/**
 * Rank Redshirt schools for an outside team. Location carries most of the signal;
 * a matching mascot ("Bearkats") is a strong tiebreaker and a different one counts against. Suggestions only: an admin
 * confirms every mapping.
 */
export function suggestSchools(
  team: { location: string | null; displayName: string; mascot: string | null },
  schools: SchoolCandidate[],
  limit = 3,
): Array<SchoolCandidate & { score: number }> {
  const location = team.location ?? team.displayName;
  return schools
    .map((school) => {
      const byName = Math.max(
        nameSimilarity(location, school.shortName ?? ""),
        nameSimilarity(location, school.name ?? ""),
        nameSimilarity(
          team.displayName,
          `${school.shortName ?? school.name ?? ""} ${school.nickname ?? ""}`,
        ),
      );
      // Mascots separate same-named schools (St. Thomas Tommies vs St. Thomas Bobcats).
      const mascot =
        team.mascot && school.nickname
          ? team.mascot.toLowerCase() === school.nickname.toLowerCase()
            ? 0.25
            : -0.35
          : 0;
      return { ...school, score: Math.min(1, byName + mascot) };
    })
    .filter((school) => school.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
