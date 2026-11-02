import { describe, expect, it } from "vitest";

import { type EngineConfig, FCS_FOOTBALL_DEFAULTS } from "./config";
import { normalCdf, poissonBinomial, transformMargin } from "./math";
import { rateWeek } from "./rate";
import { fitRidge, ratingsWithout } from "./ridge";
import type { EngineGame, EngineTeam } from "./types";

const config: EngineConfig = {
  ...FCS_FOOTBALL_DEFAULTS,
  posteriorSamples: 50,
};

function team(id: string, priorStrength: number | null = null): EngineTeam {
  return { id, name: id.toUpperCase(), conferenceId: null, priorStrength };
}

let gameCounter = 0;
function game(
  homeId: string,
  awayId: string,
  homeScore: number | null,
  awayScore: number | null,
  overrides: Partial<EngineGame> = {},
): EngineGame {
  gameCounter += 1;
  return {
    id: `g${gameCounter}`,
    weekIndex: 1,
    homeId,
    awayId,
    homeName: homeId.toUpperCase(),
    awayName: awayId.toUpperCase(),
    homeScore,
    awayScore,
    neutralSite: false,
    overtime: false,
    status: homeScore == null ? "scheduled" : "final",
    ...overrides,
  };
}

/** Eight teams with known strengths; everyone plays everyone once, margin = gap + 3 for the home side. */
function league() {
  const truth: Record<string, number> = {
    a: 13,
    b: 9,
    c: 5,
    d: 0,
    e: -2,
    f: -6,
    g: -10,
    h: -14,
  };
  const ids = Object.keys(truth);
  const teams = ids.map((id) => team(id));
  const games: EngineGame[] = [];
  let week = 1;
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const home = (i + j) % 2 === 0 ? ids[i]! : ids[j]!;
      const away = home === ids[i] ? ids[j]! : ids[i]!;
      const margin = Math.round(truth[home]! - truth[away]! + 3);
      const base = 24;
      games.push(
        game(
          home,
          away,
          base + Math.max(margin, 0),
          base + Math.max(-margin, 0) + (margin === 0 ? 1 : 0),
          {
            weekIndex: 1 + (week++ % 10),
          },
        ),
      );
    }
  }
  return { truth, teams, games };
}

describe("math", () => {
  it("matches standard normal CDF values", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 7);
    expect(normalCdf(1)).toBeCloseTo(0.841344746, 6);
    expect(normalCdf(-1.96)).toBeCloseTo(0.0249979, 6);
  });

  it("caps margins and damps overtime", () => {
    const cap = { type: "cap", cap: 28 } as const;
    expect(transformMargin(45, false, cap, 3)).toBe(28);
    expect(transformMargin(-10, false, cap, 3)).toBe(-10);
    expect(transformMargin(7, true, cap, 3)).toBe(3);
    expect(transformMargin(-1, true, cap, 3)).toBe(-1);
  });

  it("builds a Poisson-binomial distribution that sums to one", () => {
    const distribution = poissonBinomial([0.5, 0.5]);
    expect(distribution).toEqual([0.25, 0.5, 0.25]);
    const sum = poissonBinomial([0.1, 0.7, 0.9, 0.3]).reduce(
      (a, b) => a + b,
      0,
    );
    expect(sum).toBeCloseTo(1, 12);
  });
});

describe("ridge", () => {
  it("recovers true strengths and home field from clean margins", () => {
    const { truth, teams, games } = league();
    const result = rateWeek({
      teams,
      games,
      currentWeekIndex: 99,
      config: {
        ...config,
        marginTransform: { type: "cap", cap: 60 },
        priorGames: 0.01,
        homeFieldPriorGames: 0.01,
      },
    });
    const centre = Object.values(truth).reduce((a, b) => a + b, 0) / 8;
    for (const rating of result.teams) {
      expect(rating.strength).toBeCloseTo(truth[rating.teamId]! - centre, 0);
    }
    expect(result.diagnostics.homeField).toBeCloseTo(3, 0);
  });

  it("leave-out ratings equal a full refit without those games", () => {
    const rows = [
      { home: 0, away: 1, neutral: false, target: 10, weight: 1 },
      { home: 1, away: 2, neutral: true, target: 3, weight: 1 },
      { home: 2, away: 0, neutral: false, target: -7, weight: 1 },
      { home: 0, away: 1, neutral: true, target: 4, weight: 1 },
      { home: 3, away: 0, neutral: false, target: -14, weight: 1 },
      { home: 3, away: 2, neutral: false, target: 1, weight: 1 },
    ];
    const base = {
      teamCount: 4,
      priorMeans: [0, 0, 0, 0],
      priorGames: 2,
      homeFieldPrior: 2.5,
      homeFieldPriorGames: 5,
    };
    const full = fitRidge({ ...base, rows });
    const removed = [rows[0]!, rows[3]!];
    const fast = ratingsWithout(full, removed);
    const refit = fitRidge({
      ...base,
      rows: rows.filter((row) => !removed.includes(row)),
    });
    // Same frame: shift the refit by its own centering back to the full fit's offset.
    for (let i = 0; i < 4; i += 1) {
      expect(fast[i]).toBeCloseTo(
        (refit.values[i] ?? 0) + refit.offset - full.offset,
        9,
      );
    }
    expect(fast[4]).toBeCloseTo(refit.homeField, 9);
  });
});

describe("strength of schedule", () => {
  it("is the mean of each game's p, reproducible from the explanation", () => {
    const { teams, games } = league();
    const result = rateWeek({ teams, games, currentWeekIndex: 99, config });
    for (const rating of result.teams) {
      const ps = rating.explanation.games.map((g) =>
        normalCdf(
          (g.opponentStrength + g.opponentSiteEdge - config.benchmark) /
            config.sigma,
        ),
      );
      rating.explanation.games.forEach((g, k) => {
        expect(g.p).toBeCloseTo(ps[k]!, 12);
      });
      expect(rating.sos).toBeCloseTo(
        ps.reduce((a, b) => a + b, 0) / ps.length,
        12,
      );
    }
  });

  it("ignores games against teams outside the pool", () => {
    const { teams, games } = league();
    const before = rateWeek({ teams, games, currentWeekIndex: 99, config });
    const withMoneyGame = rateWeek({
      teams,
      games: [
        ...games,
        game("fbs-giant", "h", 63, 0, { weekIndex: 1, homeLevel: "FBS" }),
        game("a", "d2-school", 70, 3, { weekIndex: 2 }),
      ],
      currentWeekIndex: 99,
      config,
    });
    for (const rating of before.teams) {
      const other = withMoneyGame.teams.find(
        (t) => t.teamId === rating.teamId,
      )!;
      expect(other.sos).toBe(rating.sos);
      expect(other.sor).toBe(rating.sor);
      expect(other.power).toBe(rating.power);
      expect(other.recordSos).toBe(rating.recordSos);
    }
    const h = withMoneyGame.teams.find((t) => t.teamId === "h")!;
    expect(h.explanation.excluded).toHaveLength(1);
    expect(h.explanation.excluded[0]?.opponentLevel).toBe("FBS");
    const a = withMoneyGame.teams.find((t) => t.teamId === "a")!;
    expect(a.explanation.excluded[0]?.opponentLevel).toBeNull();
    expect(h.overallRecord.losses).toBe(h.poolRecord.losses + 1);
  });

  it("does not reward scheduling more games: the same opponents twice keeps SOS", () => {
    // x plays y and z once; w plays y and z twice each. Same opponents → same SOS.
    const teams = ["w", "x", "y", "z"].map((id) => team(id));
    const neutral = { neutralSite: true };
    const games = [
      game("x", "y", 20, 17, neutral),
      game("x", "z", 10, 14, neutral),
      game("w", "y", 20, 17, neutral),
      game("w", "z", 10, 14, neutral),
      game("w", "y", 20, 17, { ...neutral, weekIndex: 2 }),
      game("w", "z", 10, 14, { ...neutral, weekIndex: 2 }),
      game("y", "z", 21, 21, neutral),
    ];
    const result = rateWeek({
      teams,
      games,
      currentWeekIndex: 9,
      config: { ...config, minRankedGames: 0 },
    });
    const w = result.teams.find((t) => t.teamId === "w")!;
    const x = result.teams.find((t) => t.teamId === "x")!;
    // Leave-out strengths differ slightly (w's games weigh more in y's and z's fits),
    // but averaging means the count itself adds nothing.
    expect(w.poolGames).toBe(4);
    expect(x.poolGames).toBe(2);
    expect(Math.abs((w.sos ?? 0) - (x.sos ?? 0))).toBeLessThan(0.02);
  });

  it("uses opponent strength without the head-to-head games", () => {
    const { teams, games } = league();
    const result = rateWeek({ teams, games, currentWeekIndex: 99, config });
    const a = result.teams.find((t) => t.teamId === "a")!;
    const vsH = a.explanation.games.find((g) => g.opponentId === "h")!;
    const h = result.teams.find((t) => t.teamId === "h")!;
    // Beating h by the cap lowered h's full-season strength; leave-out undoes that.
    expect(vsH.opponentStrength).toBeGreaterThan(h.strength);
  });

  it("only ranks teams with enough pool games, but still reports a value", () => {
    const teams = ["p", "q", "r"].map((id) => team(id));
    const result = rateWeek({
      teams,
      games: [game("p", "q", 14, 7), game("q", "r", 21, 20)],
      currentWeekIndex: 5,
      config,
    });
    for (const rating of result.teams) {
      expect(rating.sos).not.toBeNull();
      expect(rating.sosRank).toBeNull();
      expect(rating.isProvisional).toBe(true);
    }
  });

  it("averages remaining games with full strength and skips cancelled ones", () => {
    const { teams, games } = league();
    const result = rateWeek({
      teams,
      games: [
        ...games,
        game("a", "b", null, null, { weekIndex: 12 }),
        game("a", "c", null, null, { weekIndex: 13, status: "cancelled" }),
      ],
      currentWeekIndex: 11,
      config,
    });
    const a = result.teams.find((t) => t.teamId === "a")!;
    expect(a.explanation.remaining).toHaveLength(1);
    expect(a.remainingSos).toBeCloseTo(a.explanation.remaining[0]!.p, 12);
  });
});

describe("strength of record", () => {
  it("equals brute-force enumeration of the benchmark team's outcomes", () => {
    const { teams, games } = league();
    const result = rateWeek({ teams, games, currentWeekIndex: 99, config });
    for (const rating of result.teams.slice(0, 3)) {
      const qs = rating.explanation.games.map((g) => 1 - g.p);
      const wins = rating.poolRecord.wins;
      let total = 0;
      for (let mask = 0; mask < 1 << qs.length; mask += 1) {
        let probability = 1;
        let count = 0;
        qs.forEach((q, k) => {
          const won = (mask >> k) & 1;
          count += won;
          probability *= won ? q : 1 - q;
        });
        if (count >= wins) total += probability;
      }
      expect(rating.sor).toBeCloseTo(total, 10);
    }
  });

  it("ranks the best record against the hardest schedule first", () => {
    const { teams, games } = league();
    const result = rateWeek({ teams, games, currentWeekIndex: 99, config });
    expect(result.teams[0]?.teamId).toBe("a");
    expect(result.teams[0]?.sorRank).toBe(1);
  });
});

describe("record SOS", () => {
  it("matches a hand-worked RPI example with head-to-head excluded", () => {
    // a beat b, a beat c, b beat c, c beat d.
    const teams = ["a", "b", "c", "d"].map((id) => team(id));
    const games = [
      game("a", "b", 10, 0),
      game("a", "c", 10, 0),
      game("b", "c", 10, 0),
      game("c", "d", 10, 0),
    ];
    const result = rateWeek({
      teams,
      games,
      currentWeekIndex: 5,
      config: { ...config, minRankedGames: 0 },
    });
    const a = result.teams.find((t) => t.teamId === "a")!;
    // b without a: 1-0 → 1.0. c without a: 1-1 → 0.5. OWP(a) = 0.75.
    expect(a.owp).toBeCloseTo(0.75, 12);
    // OWP(b) = mean(a without b: 1-0 → 1, c without b: 1-1 → 0.5) = 0.75
    // OWP(c) = mean(a w/o c: 1, b w/o c: 0, d w/o c: none) = 0.5
    // OOWP(a) = mean(0.75, 0.5) = 0.625
    expect(a.oowp).toBeCloseTo(0.625, 12);
    expect(a.recordSos).toBeCloseTo((2 * 0.75 + 0.625) / 3, 12);
  });
});

describe("determinism and tiers", () => {
  it("returns identical output for identical input", () => {
    const { teams, games } = league();
    const first = rateWeek({ teams, games, currentWeekIndex: 99, config });
    const second = rateWeek({ teams, games, currentWeekIndex: 99, config });
    expect(second).toEqual(first);
  });

  it("puts each game in the tier its p falls in", () => {
    const { teams, games } = league();
    const result = rateWeek({ teams, games, currentWeekIndex: 99, config });
    for (const rating of result.teams) {
      for (const g of rating.explanation.games) {
        const expected = g.p >= 0.5 ? 1 : g.p >= 0.25 ? 2 : g.p >= 0.1 ? 3 : 4;
        expect(g.tier).toBe(expected);
      }
      const counted = rating.tierRecords.reduce(
        (n, r) => n + r.wins + r.losses + r.ties,
        0,
      );
      expect(counted).toBe(rating.poolGames);
    }
  });

  it("flags a disconnected pool as provisional", () => {
    const teams = ["a", "b", "c", "d"].map((id) => team(id));
    const result = rateWeek({
      teams,
      games: [game("a", "b", 14, 7), game("c", "d", 14, 7)],
      currentWeekIndex: 5,
      config,
    });
    expect(result.diagnostics.connected).toBe(false);
    expect(result.diagnostics.leagueProvisional).toBe(true);
  });
});
