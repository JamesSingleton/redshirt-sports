import footballFcs from "@/content/ratings-validation/football-fcs.json";

export type ValidationMetrics = {
  games: number;
  marginMae: number;
  marginRmse: number;
  winnerAccuracy: number;
  logLoss: number;
  sigma: number;
};

export type ValidationReport = {
  generatedAt: string;
  seasons: { burnIn: number; train: number[]; test: number };
  baseline: { description: string; test: ValidationMetrics };
  train: ValidationMetrics;
  test: ValidationMetrics;
  perSeason: Array<ValidationMetrics & { year: number; role: string }>;
  championRanks: Array<{
    year: number;
    champion: string | null;
    sorRank: number | null;
    powerRank: number | null;
    sosRank: number | null;
  }>;
};

/** Reports written by `pnpm ratings:calibrate`, keyed by sport/pool. */
const REPORTS: Record<string, ValidationReport> = {
  "football/fcs": footballFcs as ValidationReport,
};

export function validationReport(
  sport: string,
  pool: string,
): ValidationReport | null {
  return REPORTS[`${sport}/${pool}`] ?? null;
}
