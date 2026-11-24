import { parseExternalRef } from "@redshirt-sports/sanity/external-refs";

import type { PickerOption } from "./external-pickers";

/**
 * Suggest the players an article is about, from its own text. Pure, so it's
 * tested without a network: the Studio input does the searches.
 *
 * A name is two or three capitalized words (plus Jr./Sr./II-IV), the way a
 * player is first introduced. Names in the headline lead; the rest rank by how
 * often the body repeats them. Each candidate is then searched like the picker
 * does, and kept only when a result has exactly that name.
 */

/**
 * Keep suggestions to players on the article's teams (when it has any).
 * Settled by the Phase 2 scoring in docs/portal-baselines.md.
 */
export const SCOPE_TO_TEAMS = true;

const TOKEN = String.raw`(?!(?:Jr|Sr|II|III|IV)\b)(?:[A-Z][a-z]*[A-Z]?[a-z'’\-]+|[A-Z]{2}|[A-Z]\.[A-Z]\.)`;
const SUFFIX = String.raw`(?:\s(?:Jr\.|Sr\.|II|III|IV))?`;
const NAME = new RegExp(
  String.raw`\b${TOKEN}(?:\s${TOKEN}){1,2}${SUFFIX}`,
  "g",
);

/** Words that start or end capitalized runs that are never a person. */
const NOT_A_NAME = new Set(
  `The A An No Week Big Sky SoCon State University College Conference North South East West
  Northern Southern Eastern Western Central January February March April May June July August
  September October November December Monday Tuesday Wednesday Thursday Friday Saturday Sunday
  FCS FBS NCAA CFP Bowl Playoff Top Preview Recap Game Football Basketball Men Women Women's Men's
  Division Valley Missouri Ohio Coast Pacific Atlantic Mountain Sun Belt American Ivy League
  Coach Head Coordinator Quarterback Freshman Sophomore Junior Senior Redshirt Transfer Portal
  One Two Three Four Five Six Seven Eight Nine Ten First Second Third Late Touchdown Touchdowns
  Field Goal Points Win Wins Beats Past Over Scores Leads Lifts
  So But And Then Also When While After Before Since Though Although If As Both Even Only Still Yet Senior Junior Sophomore Freshman Guard Forward Center Receiver Linebacker Running Back Kicker Safety Tackle End Cornerback Defensive Offensive`.split(
    /\s+/,
  ),
);

export function personNames(text: string | null | undefined): string[] {
  const names: string[] = [];
  for (const match of (text ?? "").matchAll(NAME)) {
    // "Coach Brian Wright" is Brian Wright; "Montana State" is nobody.
    // "Pennington's" is Pennington.
    const words = match[0].replace(/['’]s$/, "").split(" ");
    while (words.length && NOT_A_NAME.has(words[0]!)) words.shift();
    while (words.length && NOT_A_NAME.has(words.at(-1)!)) words.pop();
    if (words.length >= 2) names.push(words.join(" "));
  }
  return names;
}

/**
 * Candidate names, most likely subject first. Names come from the body, whose
 * sentence case makes them reliable; title case turns "James Jones Becomes"
 * into one run. A body name the headline also contains leads, then the rest
 * by how often the body repeats them.
 */
export function rankedNames(
  title: string | null | undefined,
  body: string | null | undefined,
  limit = 8,
): string[] {
  const headline = ` ${normalizeName(title ?? "")} `;
  const counts = new Map<string, number>();
  for (const name of personNames(body)) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const inTitle = (name: string) =>
    headline.includes(` ${normalizeName(name)} `);
  return [...counts.keys()]
    .sort(
      (a, b) =>
        Number(inTitle(b)) - Number(inTitle(a)) ||
        (counts.get(b) ?? 0) - (counts.get(a) ?? 0),
    )
    .slice(0, limit);
}

export function normalizeName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "Trap Johnson · VMI Keydets" → name and team, from a picked ref's label. */
function nameAndTeam(option: PickerOption) {
  const label = parseExternalRef(option.value)?.label ?? "";
  const [name = "", team = ""] = label.split(" · ");
  return { name, team };
}

const GENERIC = new Set(["university", "of", "the", "college", "at", "state"]);

/** "Massachusetts Minutemen" → itself, "massachusetts", and the empty mascot-less forms. */
function schoolParts(team: string): string[] {
  const words = normalizeName(team).split(" ").filter(Boolean);
  return [0, 1, 2]
    .filter((drop) => words.length - drop >= 1)
    .map((drop) => words.slice(0, words.length - drop).join(" "))
    .filter((part) => part.split(" ").some((word) => !GENERIC.has(word)));
}

const contains = (haystack: string, needle: string) =>
  ` ${haystack} `.includes(` ${needle} `);

/**
 * Whether an ESPN team ("San José State Spartans") is one of the article's
 * schools, given as any of their names ("San Jose State", "SJSU",
 * "San José State University").
 */
export function playsFor(team: string, schools: string[]): boolean {
  const full = normalizeName(team);
  const parts = schoolParts(team);
  return schools
    .map(normalizeName)
    .some(
      (school) =>
        school &&
        (contains(full, school) ||
          parts.some((part) => contains(school, part))),
    );
}

/**
 * The search result that is this exact person, or null. With `teams` (the
 * article's schools, any of their names), the player must play for one.
 */
export function matchingOption(
  name: string,
  options: PickerOption[],
  teams: string[] = [],
): PickerOption | null {
  const want = normalizeName(name);
  for (const option of options) {
    const found = nameAndTeam(option);
    if (normalizeName(found.name) !== want) continue;
    // Our own players' labels carry no team; the exact name is enough.
    if (teams.length && found.team && !playsFor(found.team, teams)) continue;
    return option;
  }
  return null;
}

/** Drop candidates that are a school's name: "Sam Houston", "James Madison". */
export function withoutSchools(
  names: string[],
  schools: Set<string>,
): string[] {
  return names.filter((name) => !schools.has(normalizeName(name)));
}

const ROLE = `(?:coach|coaches|commissioner|coordinator|director|president|chancellor|announcer|analyst|reporter|writer|columnist|AD)`;
const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Whether the article writes this name as staff, not a player: "head coach
 * Cody Worley", "Michael Cross is stepping down as commissioner". Coaches and
 * officials often share a name with a player on ESPN, sometimes their own
 * playing record at the same school.
 */
export function namedAsStaff(name: string, text: string): boolean {
  const n = escapeRegExp(name);
  return (
    new RegExp(String.raw`\b${ROLE}\b[^.\n]{0,25}?\b${n}\b`, "i").test(text) ||
    new RegExp(
      String.raw`\b${n}\b(?:['’]s)?\W+(?:is|was|as|,)\W+(?:[a-z-]+\W+){0,4}${ROLE}\b`,
      "i",
    ).test(text)
  );
}
