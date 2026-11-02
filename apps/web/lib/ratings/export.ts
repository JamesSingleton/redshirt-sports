import type { PublishedTeamRow } from "@redshirt-sports/db/ratings";

import { ratingsColumns } from "@/lib/ratings/columns";
import type {
  loadRatingsSeasonRuns,
  RatingsSheetsModel,
  RatingsWeekModel,
} from "@/lib/ratings/data";
import { RATINGS_LICENSE_URL } from "@/lib/ratings/dataset-json-ld";
import { formatRecord, sortRows } from "@/lib/ratings/format";
import { buildWorkbook, type Cell } from "@/lib/ratings/xlsx";

const COLUMNS = [
  "sor_rank",
  "team",
  "conference",
  "pool_record",
  "overall_record",
  "sor",
  "power",
  "power_rank",
  "power_rank_low",
  "power_rank_high",
  "strength",
  "sos",
  "sos_rank",
  "sov",
  "sov_rank",
  "record_sos",
  "owp",
  "oowp",
  "remaining_sos",
  "full_season_sos",
  "pool_games",
  "provisional",
] as const;

function attribution(model: RatingsWeekModel, canonical: string) {
  return {
    source: "Redshirt Sports",
    url: canonical,
    license: RATINGS_LICENSE_URL,
    attribution: `Redshirt Sports ${model.pool.name} ratings, ${model.week.year} ${model.week.label} (${canonical})`,
    methodVersion: model.run.methodVersion,
    runId: model.run.id,
    checksum: model.run.checksum,
    publishedAt: model.week.publishedAt,
  };
}

function cell(value: string | number | boolean | null): string {
  if (value == null) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** CSV with a commented header carrying the license, attribution, and run checksum. */
export function ratingsCsv(model: RatingsWeekModel, canonical: string): string {
  const meta = attribution(model, canonical);
  const header = Object.entries(meta).map(
    ([key, value]) => `# ${key}: ${value}`,
  );
  const rows = sortRows(model.rows, "sor").map((row) =>
    [
      row.sorRank,
      row.name,
      row.conference,
      formatRecord(row.poolRecord),
      formatRecord(row.overallRecord),
      row.sor,
      row.power,
      row.powerRank,
      row.powerRankLow,
      row.powerRankHigh,
      row.strength,
      row.sos,
      row.sosRank,
      row.sov,
      row.sovRank,
      row.recordSos,
      row.owp,
      row.oowp,
      row.remainingSos,
      row.fullSeasonSos,
      row.poolGames,
      row.isProvisional,
    ]
      .map(cell)
      .join(","),
  );
  return `${[...header, COLUMNS.join(","), ...rows].join("\n")}\n`;
}

/** Everything: the attribution, the exact parameters, and every team with its game-by-game explanation. */
export function ratingsJson(model: RatingsSheetsModel, canonical: string) {
  return {
    ...attribution(model, canonical),
    pool: {
      sport: model.pool.sportSlug,
      slug: model.pool.slug,
      name: model.pool.name,
    },
    week: {
      year: model.week.year,
      label: model.week.label,
      throughAt: model.week.throughAt,
    },
    params: model.run.params,
    diagnostics: model.run.diagnostics,
    teams: sortRows(model.rows, "sor").map(({ image: _image, ...row }) => row),
  };
}

type SeasonRuns = Awaited<ReturnType<typeof loadRatingsSeasonRuns>>;

const round = (value: number | null, digits: number) =>
  value == null ? null : Number(value.toFixed(digits));

function weekRows(poolName: string, rows: PublishedTeamRow[]): Cell[][] {
  const header: Cell[] = [
    "Rank (SOR)",
    "Team",
    "Conference",
    `vs ${poolName}`,
    "All games",
    "SOR %",
    "Power",
    "Power rank",
    "SOS",
    "SOS rank",
    "SOV",
    "Record SOS",
    "Remaining SOS",
    `${poolName} games`,
    "Small sample",
  ];
  return [
    header,
    ...sortRows(rows, "sor").map((row) => [
      row.sorRank,
      row.name,
      row.conference,
      formatRecord(row.poolRecord),
      formatRecord(row.overallRecord),
      round(row.sor == null ? null : row.sor * 100, 2),
      round(row.power, 1),
      row.powerRank,
      round(row.sos == null ? null : row.sos * 100, 1),
      row.sosRank,
      round(row.sov == null ? null : row.sov * 100, 1),
      round(row.recordSos, 3),
      round(row.remainingSos == null ? null : row.remainingSos * 100, 1),
      row.poolGames,
      row.sorRank == null ? "yes" : "",
    ]),
  ];
}

/**
 * One workbook for a season: a sheet per published week, newest first, then an
 * About sheet with what every column means, the license, and each week's checksum.
 */
export function ratingsSeasonWorkbook(
  season: SeasonRuns,
  canonical: string,
): Uint8Array {
  const { pool } = season;
  const weeks = [...season.weeks].reverse();
  const about: Cell[][] = [
    ["Term", "Meaning"],
    ["Source", `Redshirt Sports ${pool.name} ratings (${canonical})`],
    [
      "License",
      `${RATINGS_LICENSE_URL} — credit Redshirt Sports and link the source.`,
    ],
    [
      "Games counted",
      `Only games between two ${pool.name} teams. Every other game is left out of every number.`,
    ],
    [
      "#25-level team",
      "The yardstick for SOS, SOR, and SOV: a team as strong as the 25th-best team in these ratings usually is at the end of a season. It comes from these ratings, not any poll, and stays fixed for the method version.",
    ],
    [
      "Rank (SOR)",
      "Order by strength of record. Blank means too few games to rank (see Small sample).",
    ],
    ...ratingsColumns(pool.name).map(
      (column) => [column.label, column.meaning] as Cell[],
    ),
    [
      "SOR %",
      "Strength of record as a percent: how often a #25-level team would do at least this well. Lower is harder.",
    ],
    ["Small sample", `Fewer than the minimum ${pool.name} games to be ranked.`],
    [],
    ["Week", "Method version · published · run checksum"],
    ...weeks.map(
      ({ week, run }) =>
        [
          `${week.year} ${week.label}`,
          `v${run.methodVersion} · ${week.publishedAt} · ${run.checksum}`,
        ] as Cell[],
    ),
  ];
  const widths = [11, 26, 14, 9, 10, 8, 8, 11, 7, 9, 7, 11, 14, 11, 12];
  return buildWorkbook([
    ...weeks.map(({ week, rows }) => ({
      name: week.label,
      rows: weekRows(pool.name, rows),
      widths,
    })),
    { name: "About", rows: about, widths: [22, 110] },
  ]);
}
