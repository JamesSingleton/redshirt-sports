import { z } from "zod";

export const marginTransformSchema = z.discriminatedUnion("type", [
  /** Count margins up to `cap` points. Ratings stay in real points. */
  z.object({ type: z.literal("cap"), cap: z.number().positive() }),
  /** Diminishing returns: c·ln(1 + |m|/c). Ratings are on a compressed scale. */
  z.object({ type: z.literal("log"), c: z.number().positive() }),
]);

export type MarginTransform = z.infer<typeof marginTransformSchema>;

/**
 * Every tunable number in the method. Stored per pool, frozen per method version,
 * and printed on the methodology page.
 */
export const engineConfigSchema = z.object({
  marginTransform: marginTransformSchema,
  /** Overtime games count as at most this many points either way. */
  overtimeMargin: z.number().nonnegative(),
  /** Prior weight on each team, in games: λ in the ridge. */
  priorGames: z.number().positive(),
  /** Share of last season's final strength carried into this season's prior. */
  priorCarryover: z.number().min(0).max(1),
  /** Prior strength for a team with no rating last season (new members). */
  newcomerPrior: z.number(),
  /** Home-field advantage prior, in rating points, and its weight in games. */
  homeFieldPrior: z.number(),
  homeFieldPriorGames: z.number().positive(),
  /** Power only. Strength (used by SOS/SOR) never weights by recency. */
  powerHalfLifeWeeks: z.number().positive().nullable(),
  /** Game-outcome noise in rating points: P(win) = Φ(gap / σ). */
  sigma: z.number().positive(),
  /** A typical #25 team's strength. The fixed bar for SOS, SOR, SOV, and tiers. */
  benchmark: z.number(),
  /** Pool games needed for an SOS/SOR rank, and pool wins for an SOV rank. */
  minRankedGames: z.number().int().nonnegative(),
  /** The whole league is provisional below this average of pool games per team. */
  provisionalMinAverageGames: z.number().nonnegative(),
  /** Tier floors on p (the chance a benchmark team loses the game), highest first. */
  tierFloors: z.tuple([z.number(), z.number(), z.number()]),
  posteriorSamples: z.number().int().nonnegative(),
  seed: z.number().int(),
});

export type EngineConfig = z.infer<typeof engineConfigSchema>;

/**
 * Starting values for FCS football before calibration. `ratings:calibrate`
 * replaces the starred ones with fitted values and bumps the method version.
 */
export const FCS_FOOTBALL_DEFAULTS: EngineConfig = {
  marginTransform: { type: "cap", cap: 28 }, // *
  overtimeMargin: 3,
  priorGames: 2, // *
  priorCarryover: 0.6, // *
  newcomerPrior: -6, // *
  homeFieldPrior: 2.5, // *
  homeFieldPriorGames: 20,
  powerHalfLifeWeeks: 8, // *
  sigma: 13, // *
  benchmark: 10, // *
  minRankedGames: 3,
  provisionalMinAverageGames: 4,
  tierFloors: [0.5, 0.25, 0.1],
  posteriorSamples: 1000,
  seed: 1,
};
