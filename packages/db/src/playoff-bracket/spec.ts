import type {
  BracketFormatSeed,
  BracketFormatSpec,
  BracketGameSpec,
  BracketSideSpec,
  BracketSlotSpec,
} from "./types";

const FCS_LEAGUES = [
  "Big Sky",
  "CAA",
  "Ivy",
  "MVFC",
  "NEC",
  "OVC",
  "Patriot",
  "Pioneer",
  "SoCon",
  "Southland",
  "UAC",
] as const;

function slot(seed: number, showSeed: boolean): BracketSlotSpec {
  return { key: `seed-${seed}`, seed, region: null, showSeed };
}

function slotSide(seed: number): BracketSideSpec {
  return { slotKey: `seed-${seed}` };
}

function feed(gameKey: string): BracketSideSpec {
  return { fromGameKey: gameKey };
}

/**
 * Fixed drawing so every game has a stable key.
 * First-round visitors are seeds 24 down to 17 on hosts 16 down to 9.
 * Seeds 1–8 bye into the second round. The editor can swap pairings later.
 * Only the championship is neutral. Every earlier game is on the higher seed's campus.
 */
function fcsSpec(): BracketFormatSpec {
  const slots = Array.from({ length: 24 }, (_, index) => {
    const seed = index + 1;
    return slot(seed, seed <= 16);
  });

  const rounds = [
    { key: "first", label: "First round" },
    { key: "second", label: "Second round" },
    { key: "quarterfinal", label: "Quarterfinals" },
    { key: "semifinal", label: "Semifinals" },
    { key: "final", label: "Championship" },
  ];

  const firstRoundHosts: [number, number][] = [
    [16, 24],
    [15, 23],
    [14, 22],
    [13, 21],
    [12, 20],
    [11, 19],
    [10, 18],
    [9, 17],
  ];

  const games: BracketGameSpec[] = firstRoundHosts.map(
    ([hostSeed, visitor]) => ({
      key: `r1-${hostSeed}`,
      roundKey: "first",
      roundLabel: "First round",
      host: "higherSeed",
      sideA: slotSide(hostSeed),
      sideB: slotSide(visitor),
    }),
  );

  const secondRound: [number, string][] = [
    [1, "r1-16"],
    [8, "r1-9"],
    [4, "r1-13"],
    [5, "r1-12"],
    [2, "r1-15"],
    [7, "r1-10"],
    [3, "r1-14"],
    [6, "r1-11"],
  ];

  for (const [byeSeed, fromKey] of secondRound) {
    games.push({
      key: `r2-${byeSeed}`,
      roundKey: "second",
      roundLabel: "Second round",
      host: "higherSeed",
      sideA: slotSide(byeSeed),
      sideB: feed(fromKey),
    });
  }

  const quarterfinals: [string, string, string][] = [
    ["qf-1", "r2-1", "r2-8"],
    ["qf-4", "r2-4", "r2-5"],
    ["qf-2", "r2-2", "r2-7"],
    ["qf-3", "r2-3", "r2-6"],
  ];

  for (const [key, left, right] of quarterfinals) {
    games.push({
      key,
      roundKey: "quarterfinal",
      roundLabel: "Quarterfinals",
      host: "higherSeed",
      sideA: feed(left),
      sideB: feed(right),
    });
  }

  games.push(
    {
      key: "sf-1",
      roundKey: "semifinal",
      roundLabel: "Semifinals",
      host: "higherSeed",
      sideA: feed("qf-1"),
      sideB: feed("qf-4"),
    },
    {
      key: "sf-2",
      roundKey: "semifinal",
      roundLabel: "Semifinals",
      host: "higherSeed",
      sideA: feed("qf-2"),
      sideB: feed("qf-3"),
    },
    {
      key: "final",
      roundKey: "final",
      roundLabel: "Championship",
      host: "neutral",
      sideA: feed("sf-1"),
      sideB: feed("sf-2"),
    },
  );

  return {
    fieldSize: 24,
    rounds,
    slots,
    games,
    leagues: FCS_LEAGUES.map((label) => ({ label })),
  };
}

/**
 * 12-team CFP, straight seeding. Seeds 1–4 bye.
 * First round, higher seed hosts: 12 at 5, 11 at 6, 10 at 7, 9 at 8.
 * Quarterfinals and later are neutral. No reseeding.
 */
function cfpSpec(): BracketFormatSpec {
  const slots = Array.from({ length: 12 }, (_, index) => slot(index + 1, true));

  const rounds = [
    { key: "first", label: "First round" },
    { key: "quarterfinal", label: "Quarterfinals" },
    { key: "semifinal", label: "Semifinals" },
    { key: "final", label: "Championship" },
  ];

  const firstRound: [number, number][] = [
    [8, 9],
    [5, 12],
    [7, 10],
    [6, 11],
  ];

  const games: BracketGameSpec[] = firstRound.map(([home, away]) => ({
    key: `r1-${home}`,
    roundKey: "first",
    roundLabel: "First round",
    host: "higherSeed",
    sideA: slotSide(home),
    sideB: slotSide(away),
  }));

  const quarterfinals: [string, number, string][] = [
    ["qf-1", 1, "r1-8"],
    ["qf-4", 4, "r1-5"],
    ["qf-2", 2, "r1-7"],
    ["qf-3", 3, "r1-6"],
  ];

  for (const [key, byeSeed, fromKey] of quarterfinals) {
    games.push({
      key,
      roundKey: "quarterfinal",
      roundLabel: "Quarterfinals",
      host: "neutral",
      sideA: slotSide(byeSeed),
      sideB: feed(fromKey),
    });
  }

  games.push(
    {
      key: "sf-1",
      roundKey: "semifinal",
      roundLabel: "Semifinals",
      host: "neutral",
      sideA: feed("qf-1"),
      sideB: feed("qf-4"),
    },
    {
      key: "sf-2",
      roundKey: "semifinal",
      roundLabel: "Semifinals",
      host: "neutral",
      sideA: feed("qf-2"),
      sideB: feed("qf-3"),
    },
    {
      key: "final",
      roundKey: "final",
      roundLabel: "Championship",
      host: "neutral",
      sideA: feed("sf-1"),
      sideB: feed("sf-2"),
    },
  );

  return { fieldSize: 12, rounds, slots, games };
}

const REGIONS = ["east", "west", "south", "midwest"] as const;

type Region = (typeof REGIONS)[number];

type PlayInFill = { region: Region; seed: number };

/** Historical First Four shape: two 16-seeds and two 11-seeds. Not an NCAA chart for 2027. */
const FIRST_FOUR_68: PlayInFill[] = [
  { region: "east", seed: 16 },
  { region: "west", seed: 16 },
  { region: "south", seed: 11 },
  { region: "midwest", seed: 11 },
];

/**
 * Provisional 2027 opening-round fills. The NCAA did not publish which seeds
 * the 12 winners take. Tests check counts and uniqueness, not a future chart.
 * 4 AQ games fill the 16-seeds, 2 AQ games fill east and west 15-seeds,
 * 4 at-large games fill the 11-seeds, 2 at-large games fill east and west 12-seeds.
 */
const OPENING_76: PlayInFill[] = [
  { region: "east", seed: 16 },
  { region: "west", seed: 16 },
  { region: "south", seed: 16 },
  { region: "midwest", seed: 16 },
  { region: "east", seed: 15 },
  { region: "west", seed: 15 },
  { region: "east", seed: 11 },
  { region: "west", seed: 11 },
  { region: "south", seed: 11 },
  { region: "midwest", seed: 11 },
  { region: "east", seed: 12 },
  { region: "west", seed: 12 },
];

const REGION_PAIRINGS: [number, number][] = [
  [1, 16],
  [8, 9],
  [5, 12],
  [4, 13],
  [6, 11],
  [3, 14],
  [7, 10],
  [2, 15],
];

function regionSlotKey(region: Region, seed: number): string {
  return `${region}-${seed}`;
}

function playInSlotKey(region: Region, seed: number, side: "a" | "b"): string {
  return `${region}-${seed}-${side}`;
}

function playInGameKey(roundKey: string, region: Region, seed: number): string {
  return `${roundKey}-${region}-${seed}`;
}

function basketballSpec(
  playIns: PlayInFill[],
  opening: { roundKey: string; roundLabel: string },
): BracketFormatSpec {
  const playInKeys = new Set(
    playIns.map((fill) => `${fill.region}-${fill.seed}`),
  );
  const slots: BracketSlotSpec[] = [];

  for (const region of REGIONS) {
    for (let seed = 1; seed <= 16; seed += 1) {
      if (playInKeys.has(`${region}-${seed}`)) {
        slots.push(
          {
            key: playInSlotKey(region, seed, "a"),
            seed,
            region,
            showSeed: true,
          },
          {
            key: playInSlotKey(region, seed, "b"),
            seed,
            region,
            showSeed: true,
          },
        );
      } else {
        slots.push({
          key: regionSlotKey(region, seed),
          seed,
          region,
          showSeed: true,
        });
      }
    }
  }

  const rounds = [
    { key: opening.roundKey, label: opening.roundLabel },
    { key: "round-of-64", label: "Round of 64" },
    { key: "round-of-32", label: "Round of 32" },
    { key: "sweet-16", label: "Sweet 16" },
    { key: "elite-8", label: "Elite 8" },
    { key: "final-four", label: "Final Four" },
    { key: "championship", label: "Championship" },
  ];

  const games: BracketGameSpec[] = [];

  for (const fill of playIns) {
    games.push({
      key: playInGameKey(opening.roundKey, fill.region, fill.seed),
      roundKey: opening.roundKey,
      roundLabel: opening.roundLabel,
      host: "neutral",
      sideA: { slotKey: playInSlotKey(fill.region, fill.seed, "a") },
      sideB: { slotKey: playInSlotKey(fill.region, fill.seed, "b") },
    });
  }

  const regionWinners: string[] = [];

  for (const region of REGIONS) {
    const roundOf64Keys: string[] = [];
    for (const [top, bottom] of REGION_PAIRINGS) {
      const key = `${region}-r64-${top}-${bottom}`;
      const bottomSide: BracketSideSpec = playInKeys.has(`${region}-${bottom}`)
        ? { fromGameKey: playInGameKey(opening.roundKey, region, bottom) }
        : { slotKey: regionSlotKey(region, bottom) };
      games.push({
        key,
        roundKey: "round-of-64",
        roundLabel: "Round of 64",
        host: "neutral",
        sideA: { slotKey: regionSlotKey(region, top) },
        sideB: bottomSide,
      });
      roundOf64Keys.push(key);
    }

    const roundOf32Keys: string[] = [];
    for (let index = 0; index < roundOf64Keys.length; index += 2) {
      const key = `${region}-r32-${index / 2}`;
      games.push({
        key,
        roundKey: "round-of-32",
        roundLabel: "Round of 32",
        host: "neutral",
        sideA: { fromGameKey: roundOf64Keys[index]! },
        sideB: { fromGameKey: roundOf64Keys[index + 1]! },
      });
      roundOf32Keys.push(key);
    }

    const sweetKeys: string[] = [];
    for (let index = 0; index < roundOf32Keys.length; index += 2) {
      const key = `${region}-s16-${index / 2}`;
      games.push({
        key,
        roundKey: "sweet-16",
        roundLabel: "Sweet 16",
        host: "neutral",
        sideA: { fromGameKey: roundOf32Keys[index]! },
        sideB: { fromGameKey: roundOf32Keys[index + 1]! },
      });
      sweetKeys.push(key);
    }

    const eliteKey = `${region}-e8`;
    games.push({
      key: eliteKey,
      roundKey: "elite-8",
      roundLabel: "Elite 8",
      host: "neutral",
      sideA: { fromGameKey: sweetKeys[0]! },
      sideB: { fromGameKey: sweetKeys[1]! },
    });
    regionWinners.push(eliteKey);
  }

  games.push(
    {
      key: "ff-1",
      roundKey: "final-four",
      roundLabel: "Final Four",
      host: "neutral",
      sideA: { fromGameKey: regionWinners[0]! },
      sideB: { fromGameKey: regionWinners[1]! },
    },
    {
      key: "ff-2",
      roundKey: "final-four",
      roundLabel: "Final Four",
      host: "neutral",
      sideA: { fromGameKey: regionWinners[2]! },
      sideB: { fromGameKey: regionWinners[3]! },
    },
    {
      key: "championship",
      roundKey: "championship",
      roundLabel: "Championship",
      host: "neutral",
      sideA: { fromGameKey: "ff-1" },
      sideB: { fromGameKey: "ff-2" },
    },
  );

  return {
    fieldSize: 64 + playIns.length,
    rounds,
    slots,
    games,
  };
}

export const BRACKET_DIVISION_SEEDS = [
  { sportSlug: "football" as const, slug: "fcs" as const, label: "FCS" },
  { sportSlug: "football" as const, slug: "fbs" as const, label: "FBS" },
];

export const BRACKET_FORMAT_SEEDS: BracketFormatSeed[] = [
  {
    key: "fcs-24-seed16-v2024",
    sportSlug: "football",
    divisionSlug: "fcs",
    effectiveFromYear: 2024,
    effectiveToYear: null,
    spec: fcsSpec(),
  },
  {
    key: "cfp-12-straight-v2025",
    sportSlug: "football",
    divisionSlug: "fbs",
    effectiveFromYear: 2025,
    effectiveToYear: null,
    spec: cfpSpec(),
  },
  {
    key: "ncaa-mbb-68-v2011",
    sportSlug: "mens-basketball",
    divisionSlug: null,
    effectiveFromYear: 2011,
    effectiveToYear: 2026,
    spec: basketballSpec(FIRST_FOUR_68, {
      roundKey: "play-in",
      roundLabel: "First Four",
    }),
  },
  {
    key: "ncaa-wbb-68-v2022",
    sportSlug: "womens-basketball",
    divisionSlug: null,
    effectiveFromYear: 2022,
    effectiveToYear: 2026,
    spec: basketballSpec(FIRST_FOUR_68, {
      roundKey: "play-in",
      roundLabel: "First Four",
    }),
  },
  {
    key: "ncaa-mbb-76-v2027",
    sportSlug: "mens-basketball",
    divisionSlug: null,
    effectiveFromYear: 2027,
    effectiveToYear: null,
    spec: basketballSpec(OPENING_76, {
      roundKey: "opening",
      roundLabel: "Opening Round",
    }),
  },
  {
    key: "ncaa-wbb-76-v2027",
    sportSlug: "womens-basketball",
    divisionSlug: null,
    effectiveFromYear: 2027,
    effectiveToYear: null,
    spec: basketballSpec(OPENING_76, {
      roundKey: "opening",
      roundLabel: "Opening Round",
    }),
  },
];

export function resolveFormat(
  rows: BracketFormatSeed[],
  query: {
    sportSlug: BracketFormatSeed["sportSlug"];
    divisionSlug: string | null;
    year: number;
  },
): BracketFormatSeed {
  const matches = rows.filter(
    (row) =>
      row.sportSlug === query.sportSlug &&
      row.divisionSlug === query.divisionSlug &&
      row.effectiveFromYear <= query.year &&
      (row.effectiveToYear === null || row.effectiveToYear >= query.year),
  );

  if (matches.length !== 1) {
    throw new Error(
      `Expected one bracket format for ${query.sportSlug}/${query.divisionSlug ?? "none"}/${query.year}, found ${matches.length}`,
    );
  }

  return matches[0]!;
}
