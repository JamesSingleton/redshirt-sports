import {
  type BracketFormatSpec,
  type BracketSide,
  type BracketSideSpec,
  type BracketSlotEntry,
  type BracketTeam,
  type BracketView,
  buildBracketView,
} from "@redshirt-sports/db/playoff-bracket";

export const BRACKET_TITLE_MAX = 60;

/**
 * A reader's own bracket. It lives in the browser only: which school sits in
 * each slot, and which side they picked to win each game.
 */
export type BracketDraft = {
  formatKey: string;
  title: string;
  /** Slot key → school id. An empty slot has no entry. */
  slots: Record<string, string>;
  /** Game key → the side picked to win. */
  picks: Record<string, BracketSide>;
};

export function bracketDraftStorageKey(
  sport: string,
  division: string,
  formatKey: string,
) {
  return `redshirt:bracket-builder:${sport}:${division}:${formatKey}`;
}

export function blankDraft(formatKey: string): BracketDraft {
  return { formatKey, title: "", slots: {}, picks: {} };
}

/** Starts from a published field, with every game still to pick. */
export function seedDraft(
  formatKey: string,
  spec: BracketFormatSpec,
  slots: BracketSlotEntry[],
): BracketDraft {
  const known = new Set(spec.slots.map((slot) => slot.key));
  return {
    ...blankDraft(formatKey),
    slots: Object.fromEntries(
      slots
        .filter((slot) => known.has(slot.slotKey))
        .map((slot) => [slot.slotKey, slot.team.schoolId]),
    ),
  };
}

export function isBlankDraft(draft: BracketDraft) {
  return (
    Object.keys(draft.slots).length === 0 &&
    Object.keys(draft.picks).length === 0
  );
}

export function setDraftTitle(draft: BracketDraft, title: string) {
  return { ...draft, title: title.slice(0, BRACKET_TITLE_MAX) };
}

/** Drops picks in games missing a team, e.g. after a slot is emptied. */
function normalizePicks(
  spec: BracketFormatSpec,
  draft: BracketDraft,
): BracketDraft {
  const games = new Map(spec.games.map((game) => [game.key, game]));
  const kept = new Map<string, BracketSide | null>();

  function filled(side: BracketSideSpec): boolean {
    if ("slotKey" in side) return side.slotKey in draft.slots;
    return pickFor(side.fromGameKey) !== null;
  }

  function pickFor(gameKey: string): BracketSide | null {
    const cached = kept.get(gameKey);
    if (cached !== undefined) return cached;
    const game = games.get(gameKey);
    const pick = draft.picks[gameKey];
    // A pick stands only while both teams are there: a winner needs someone
    // to beat.
    const valid =
      game && pick && filled(game.sideA) && filled(game.sideB) ? pick : null;
    kept.set(gameKey, valid);
    return valid;
  }

  const picks: Record<string, BracketSide> = {};
  for (const game of spec.games) {
    const pick = pickFor(game.key);
    if (pick) picks[game.key] = pick;
  }
  return { ...draft, picks };
}

/**
 * Puts a school in a slot, or empties it with `null`. A school already in the
 * field swaps places with the slot's current school, so nobody appears twice.
 */
export function placeSchool(
  spec: BracketFormatSpec,
  draft: BracketDraft,
  slotKey: string,
  schoolId: string | null,
): BracketDraft {
  const slots = { ...draft.slots };
  const previous = slots[slotKey];
  if (schoolId === null) {
    delete slots[slotKey];
  } else {
    const from = Object.keys(slots).find((key) => slots[key] === schoolId);
    if (from !== undefined) {
      if (previous === undefined) delete slots[from];
      else slots[from] = previous;
    }
    slots[slotKey] = schoolId;
  }
  return normalizePicks(spec, { ...draft, slots });
}

/**
 * Picks a side to win a game; picking it again takes the pick back. Later
 * rounds that had the old winner advancing are cleared, since that team is
 * now out.
 */
export function pickWinner(
  spec: BracketFormatSpec,
  draft: BracketDraft,
  gameKey: string,
  side: BracketSide,
): BracketDraft {
  const picks = { ...draft.picks };
  if (picks[gameKey] === side) delete picks[gameKey];
  else picks[gameKey] = side;

  let changed: string | undefined = gameKey;
  while (changed !== undefined) {
    const from: string = changed;
    changed = undefined;
    for (const game of spec.games) {
      const fed =
        "fromGameKey" in game.sideA && game.sideA.fromGameKey === from
          ? "a"
          : "fromGameKey" in game.sideB && game.sideB.fromGameKey === from
            ? "b"
            : null;
      if (fed === null) continue;
      if (picks[game.key] === fed) {
        delete picks[game.key];
        changed = game.key;
      }
      break;
    }
  }
  return normalizePicks(spec, { ...draft, picks });
}

export function clearPicks(draft: BracketDraft): BracketDraft {
  return { ...draft, picks: {} };
}

/**
 * Lays the draft out for the bracket component. Picks ride on the same
 * "final with a winner" state real results use, so winners advance the same
 * way; the games then go back to "scheduled" so cards name their round
 * instead of reading "Final".
 */
export function draftToView(
  spec: BracketFormatSpec,
  draft: BracketDraft,
  schools: ReadonlyMap<string, BracketTeam>,
): BracketView {
  const slots = Object.entries(draft.slots).flatMap(([slotKey, schoolId]) => {
    const team = schools.get(schoolId);
    return team ? [{ slotKey, team, bidType: null, bidLabel: null }] : [];
  });
  const games = Object.entries(draft.picks).map(([gameKey, winnerSide]) => ({
    gameKey,
    homeSide: null,
    siteLabel: null,
    kickoffAt: null,
    status: "final",
    sideAScore: null,
    sideBScore: null,
    winnerSide,
  }));
  const view = buildBracketView(spec, slots, games);
  for (const game of [
    ...view.left.columns.flatMap((column) => column.games),
    ...view.right.columns.flatMap((column) => column.games),
    view.final,
  ]) {
    game.status = "scheduled";
  }
  return view;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads a draft back from storage. Anything that no longer fits (another
 * format, a slot or game the format doesn't have, a school that left the
 * list, a school listed twice) is dropped rather than trusted.
 */
export function parseStoredDraft(
  raw: string | null,
  formatKey: string,
  spec: BracketFormatSpec,
  schools: ReadonlyMap<string, BracketTeam>,
): BracketDraft | null {
  let stored: unknown;
  try {
    stored = JSON.parse(raw ?? "");
  } catch {
    return null;
  }
  if (!isRecord(stored) || stored.formatKey !== formatKey) return null;

  const slotKeys = new Set(spec.slots.map((slot) => slot.key));
  const gameKeys = new Set(spec.games.map((game) => game.key));
  const placed = new Set<string>();
  const slots: Record<string, string> = {};
  for (const [key, schoolId] of Object.entries(
    isRecord(stored.slots) ? stored.slots : {},
  )) {
    if (
      slotKeys.has(key) &&
      typeof schoolId === "string" &&
      schools.has(schoolId) &&
      !placed.has(schoolId)
    ) {
      placed.add(schoolId);
      slots[key] = schoolId;
    }
  }
  const picks: Record<string, BracketSide> = {};
  for (const [key, side] of Object.entries(
    isRecord(stored.picks) ? stored.picks : {},
  )) {
    if (gameKeys.has(key) && (side === "a" || side === "b")) picks[key] = side;
  }

  return normalizePicks(spec, {
    formatKey,
    title:
      typeof stored.title === "string"
        ? stored.title.slice(0, BRACKET_TITLE_MAX)
        : "",
    slots,
    picks,
  });
}

export type BracketSlotInfo = {
  slotKey: string;
  /** Shown in the seed column, when the format shows this slot's seed. */
  seed: number | null;
  /** "No. 5 seed", or for an unseeded slot "team playing the No. 9 seed". */
  label: string;
};

/**
 * The slot behind each card row that is not fed by an earlier game, keyed
 * `gameKey:side`, so a row in the bracket can offer to fill it.
 */
export function slotsBySide(spec: BracketFormatSpec) {
  const byKey = new Map(spec.slots.map((slot) => [slot.key, slot]));
  const seeded = (slotKey: string) => {
    const slot = byKey.get(slotKey);
    return slot?.showSeed && slot.seed !== null ? slot.seed : null;
  };
  const out = new Map<string, BracketSlotInfo>();
  for (const game of spec.games) {
    const sides = [game.sideA, game.sideB] as const;
    sides.forEach((side, index) => {
      if (!("slotKey" in side)) return;
      const seed = seeded(side.slotKey);
      const other = sides[1 - index]!;
      const versus = "slotKey" in other ? seeded(other.slotKey) : null;
      out.set(`${game.key}:${index === 0 ? "a" : "b"}`, {
        slotKey: side.slotKey,
        seed,
        label:
          seed !== null
            ? `No. ${seed} seed`
            : versus !== null
              ? `team playing the No. ${versus} seed`
              : "unseeded team",
      });
    });
  }
  return out;
}

export function bracketBuilderName(division: string, year: number) {
  return `${year} ${division.toUpperCase()} Playoff Bracket`;
}

export function bracketExportFilename(division: string, year: number) {
  return `redshirt-sports-${division}-playoff-bracket-${year}.png`;
}

/**
 * How far to shrink a bracket of this size so it prints on one landscape
 * page. The box is the area both Letter and A4 leave inside 0.4in margins.
 */
export function printZoom(width: number, height: number) {
  const PAGE_WIDTH = 975;
  const PAGE_HEIGHT = 715;
  if (width <= 0 || height <= 0) return 1;
  return Math.min(1, PAGE_WIDTH / width, PAGE_HEIGHT / height);
}

/** Our bracket a reader can start from, as it reads after "our". */
export function bracketBuilderSourceLabel(edition: {
  kind: string;
  weekNumber: number | null;
}) {
  return edition.kind === "official"
    ? "official bracket"
    : `Week ${edition.weekNumber} projection`;
}

/** What every builder event says about the bracket, for PostHog. */
export function draftAnalytics(
  draft: BracketDraft,
  context: { sport: string; division: string; year: number },
) {
  return {
    ...context,
    format_key: draft.formatKey,
    teams_placed: Object.keys(draft.slots).length,
    picks_made: Object.keys(draft.picks).length,
    has_title: draft.title.trim() !== "",
  };
}

/** The name a team goes by in a sentence or an event. */
export function bracketTeamName(team: BracketTeam) {
  return team.shortName ?? team.name;
}
