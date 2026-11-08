/**
 * Turn a provider's conference label for one season ("CAA", "Southern", "OVC")
 * into a Redshirt conference id. The label is the conference the school played
 * in that season, so we look it up by name rather than trusting the school's
 * current affiliation (Delaware's 2023 "CAA" is still the CAA after it left).
 */

export type ConferenceCandidate = {
  id: string;
  name: string | null;
  shortName: string | null;
  abbreviation: string | null;
};

/**
 * Provider labels that don't match any of a conference's names. `conference`
 * is matched against our name, short name, or abbreviation. Year bounds are
 * inclusive and only needed when a label changed meaning.
 */
export type ConferenceAlias = {
  label: string;
  conference: string;
  fromYear?: number;
  toYear?: number;
};

export const CONFERENCE_ALIASES: readonly ConferenceAlias[] = [
  // ESPN short names.
  { label: "Southern", conference: "Southern Conference" },
  { label: "Ivy", conference: "Ivy League" },
  { label: "FCS Indep.", conference: "FCS Independents" },
  // Big South and OVC football merged into one association from 2023. ESPN
  // kept calling it "OVC"; before 2023 "OVC" is the Ohio Valley Conference.
  {
    label: "OVC",
    conference: "Big South - OVC Football Association",
    fromYear: 2023,
  },
  {
    label: "Big South",
    conference: "Big South - OVC Football Association",
    fromYear: 2023,
  },
];

export type MatchContext = {
  seasonYear: number;
  /** Conferences with at least one school affiliated in this sport. Breaks ties. */
  sportConferenceIds?: ReadonlySet<string>;
  /** The school's current conferences in this sport. Breaks remaining ties. */
  currentConferenceIds?: ReadonlySet<string>;
};

export function normalizeConferenceLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function createConferenceMatcher(
  conferences: readonly ConferenceCandidate[],
  aliases: readonly ConferenceAlias[] = CONFERENCE_ALIASES,
): (label: string | null | undefined, context: MatchContext) => string | null {
  const index = new Map<string, Set<string>>();
  for (const conference of conferences) {
    for (const name of [
      conference.name,
      conference.shortName,
      conference.abbreviation,
    ]) {
      if (!name) continue;
      const key = normalizeConferenceLabel(name);
      if (!key) continue;
      let ids = index.get(key);
      if (!ids) {
        ids = new Set();
        index.set(key, ids);
      }
      ids.add(conference.id);
    }
  }

  return (label, context) => {
    if (!label) return null;
    const key = normalizeConferenceLabel(label);
    if (!key) return null;
    const alias = aliases.find(
      (entry) =>
        normalizeConferenceLabel(entry.label) === key &&
        (entry.fromYear == null || context.seasonYear >= entry.fromYear) &&
        (entry.toYear == null || context.seasonYear <= entry.toYear),
    );
    // An alias that points nowhere stays unmatched rather than falling back to
    // the label, which could mean a different conference that season.
    const candidates = index.get(
      alias ? normalizeConferenceLabel(alias.conference) : key,
    );
    return pickOne(candidates, context);
  };
}

function pickOne(
  candidates: ReadonlySet<string> | undefined,
  context: MatchContext,
): string | null {
  if (!candidates || candidates.size === 0) return null;
  let ids = [...candidates];
  for (const preferred of [
    context.sportConferenceIds,
    context.currentConferenceIds,
  ]) {
    if (ids.length === 1) break;
    if (!preferred) continue;
    const narrowed = ids.filter((id) => preferred.has(id));
    if (narrowed.length > 0) ids = narrowed;
  }
  return ids.length === 1 ? (ids[0] ?? null) : null;
}
