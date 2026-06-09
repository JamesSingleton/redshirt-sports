import {
  getFinalRankingsForWeekAndYear,
  getWeeksThatHaveVotes,
  getYearsThatHaveVotes,
} from "@redshirt-sports/db/queries";

export async function getCachedYearsThatHaveVotes({
  division,
}: {
  division: string;
}) {
  "use cache";
  return getYearsThatHaveVotes({ division });
}

export async function getCachedWeeksThatHaveVotes({
  year,
  division,
}: {
  year: number;
  division: string;
}) {
  "use cache";
  return getWeeksThatHaveVotes({ year, division });
}

export async function getCachedFinalRankings({
  year,
  week,
  division,
}: {
  year: number;
  week: number;
  division: string;
}) {
  "use cache";
  return getFinalRankingsForWeekAndYear({ year, week, division });
}
