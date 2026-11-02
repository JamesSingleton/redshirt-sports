import type { SortKey } from "@/lib/ratings/format";

/** Every table column, with its one-line meaning (legend, header tooltips, and the download's About sheet). */
export type RatingsColumn = {
  key: SortKey | null;
  label: string;
  /** One-line meaning, shown in the legend and as the header's tooltip. */
  meaning: string;
};

export function ratingsColumns(poolName: string): RatingsColumn[] {
  return [
    {
      key: null,
      label: `vs ${poolName}`,
      meaning: `Record against ${poolName} teams. These are the only games any number here counts.`,
    },
    {
      key: null,
      label: "All games",
      meaning: `Record in every game, including opponents outside ${poolName}. For reference only.`,
    },
    {
      key: "sor",
      label: "SOR",
      meaning:
        "Strength of record: how often a #25-level team would do at least this well against this exact schedule. Lower is harder to achieve.",
    },
    {
      key: "power",
      label: "Power",
      meaning: `Points better than an average ${poolName} team on a neutral field. The difference between two teams is the expected margin.`,
    },
    {
      key: "sos",
      label: "SOS",
      meaning:
        "Strength of schedule, 0–100: on average, how often a #25-level team would lose each of these games. Higher is harder.",
    },
    {
      key: null,
      label: "SOS rank",
      meaning: `Rank by SOS. Teams need 3 ${poolName} games to be ranked.`,
    },
    {
      key: "sov",
      label: "SOV",
      meaning: "Strength of victory: SOS counting only the games the team won.",
    },
    {
      key: "record-sos",
      label: "Record SOS",
      meaning:
        "NCAA RPI-style schedule strength from records only: 2/3 opponents' win % plus 1/3 their opponents' win %.",
    },
    {
      key: "remaining",
      label: "Remaining SOS",
      meaning: `SOS of the ${poolName} games still to be played.`,
    },
  ];
}
