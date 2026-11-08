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
  // A leading "St." is Saint (St. Thomas, St. Cloud State); anywhere else it is State
  // (Sam Houston St., Minnesota St Moorhead).
  [/^st\.?\s+/, "saint "],
  [/\bst\.?(?=\s|$)/g, "state"],
  [/\bso\.?(?=\s)/g, "southern"],
  [/\bse\b/g, "southeastern"],
  [/\bne\b/g, "northeastern"],
  [/\bnw\b/g, "northwestern"],
  [/\bsw\b/g, "southwestern"],
  [/\bcal\b/g, "california"],
  [/&/g, " and "],
];

const tokenCache = new Map<string, string[]>();

export function nameTokens(value: string): string[] {
  const cached = tokenCache.get(value);
  if (cached) return cached;
  // Bulk matching scores every school against every provider team; names repeat.
  if (tokenCache.size > 20_000) tokenCache.clear();
  const tokens = tokenize(value);
  tokenCache.set(value, tokens);
  return tokens;
}

function tokenize(value: string): string[] {
  // "San José State" is "San Jose State".
  let text = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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
  abbreviation?: string | null;
};

export type TeamNames = {
  location: string | null;
  displayName: string;
  mascot: string | null;
  abbreviation?: string | null;
};

/**
 * true for the same mascot ("Lady Bulldogs" is "Bulldogs", "Bisons" is "Bison"), null
 * when one contains the other ("Hurricane" in "Golden Hurricane"), false otherwise.
 */
function compareMascots(a: string, b: string): boolean | null {
  // The provider's placeholder entries repeat the school in capitals ("AGNES SCOTT"): no mascot.
  if (isPlaceholder(a) || isPlaceholder(b)) return null;
  const clean = (value: string) =>
    value
      .toLowerCase()
      .replace(/^lady\s+/, "")
      .replace(/[^a-z0-9]/g, "")
      .replace(/s$/, "");
  const left = clean(a);
  const right = clean(b);
  if (!left || !right) return null;
  if (left === right) return true;
  return left.includes(right) || right.includes(left) ? null : false;
}

/** Two mascots name the same team ("Lady Bulldogs" and "Bulldogs"). */
export function sameMascot(a: string | null, b: string | null): boolean {
  return a != null && b != null && compareMascots(a, b) === true;
}

function isPlaceholder(mascot: string): boolean {
  return /[A-Z]{3}/.test(mascot) && mascot === mascot.toUpperCase();
}

/**
 * Drop parenthesized parts ("Bethany (WV)" becomes "Bethany "), in one linear pass.
 * A regex with optional spaces around the parentheses backtracks polynomially on long
 * runs of spaces or "(" (CodeQL js/polynomial-redos).
 */
export function stripQualifiers(value: string): {
  text: string;
  qualified: boolean;
} {
  let text = "";
  let depth = 0;
  let qualified = false;
  for (const char of value) {
    if (char === "(") {
      depth += 1;
      qualified = true;
      text += " ";
    } else if (char === ")" && depth > 0) {
      depth -= 1;
    } else if (depth === 0) {
      text += char;
    }
  }
  return { text, qualified };
}

/**
 * "Bethany" vs "Bethany (WV)": the same name once the state is dropped, but only one
 * side says which state, so it scores 0.9, not 1. Two different qualifiers
 * ("Concordia (WI)" vs "Concordia (MI)") get nothing here.
 */
function qualifierSimilarity(a: string, b: string): number {
  const left = stripQualifiers(a);
  const right = stripQualifiers(b);
  if (left.qualified === right.qualified) return 0;
  return 0.9 * nameSimilarity(left.text, right.text);
}

/** A shared abbreviation (UIC, IUP, UMBC) is weaker evidence than a shared name. */
const ABBREVIATION_SCORE = 0.5;

function sameAbbreviation(
  abbreviation: string | null | undefined,
  school: SchoolCandidate,
): boolean {
  if (!abbreviation || abbreviation.length < 3) return false;
  const value = abbreviation.toLowerCase();
  return [school.abbreviation, school.shortName].some(
    (name) => name?.toLowerCase() === value,
  );
}

/**
 * How well a school matches an outside team. `byName` is the best name overlap (0–1);
 * `plainByName` leaves out the weaker evidence (a dropped state qualifier, an abbreviation);
 * `mascot` is true/false when both sides have one and null otherwise; `score` adds
 * a bonus for a matching mascot and a penalty for a different one, capped at 1.
 * `raw` is the same number uncapped, for telling two strong matches apart.
 */
export function scoreSchool(
  team: TeamNames,
  school: SchoolCandidate,
): {
  score: number;
  raw: number;
  byName: number;
  plainByName: number;
  mascot: boolean | null;
} {
  // Compare places, not full names: "Emory Eagles" and "Avila Eagles" share only the mascot,
  // which is scored on its own below. The full name is the fallback when the provider has no location.
  const plainByName = team.location
    ? Math.max(
        nameSimilarity(team.location, school.shortName ?? ""),
        nameSimilarity(team.location, school.name ?? ""),
      )
    : nameSimilarity(
        team.displayName,
        `${school.shortName ?? school.name ?? ""} ${school.nickname ?? ""}`,
      );
  const byName = Math.max(
    plainByName,
    team.location
      ? qualifierSimilarity(team.location, school.shortName ?? "")
      : 0,
    sameAbbreviation(team.abbreviation, school) ? ABBREVIATION_SCORE : 0,
  );
  // Mascots separate same-named schools (St. Thomas Tommies vs St. Thomas Bobcats).
  const mascot =
    team.mascot && school.nickname
      ? compareMascots(team.mascot, school.nickname)
      : null;
  const raw = byName + (mascot === true ? 0.25 : mascot === false ? -0.35 : 0);
  return { score: Math.min(1, raw), raw, byName, plainByName, mascot };
}

/**
 * Rank Redshirt schools for an outside team. Location carries most of the signal;
 * a matching mascot ("Bearkats") is a strong tiebreaker and a different one counts against. Suggestions only: an admin
 * confirms every mapping.
 */
export function suggestSchools<School extends SchoolCandidate>(
  team: TeamNames,
  schools: School[],
  limit = 3,
): Array<School & { score: number }> {
  return schools
    .map((school) => ({ ...school, score: scoreSchool(team, school).score }))
    .filter((school) => school.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
