import { trimMetaDescription } from "@/lib/meta-description";

export function sportRankingsHubMetaDescription(sportLabel: string): string {
  return trimMetaDescription(
    `Every Redshirt Sports ${sportLabel} Top 25 poll in one place. Each ranking is voted by a public panel, and every ballot is published alongside the release.`,
  );
}

export function rankingsVotersMetaDescription(
  sportLabel: string,
  divisionName: string,
): string {
  return trimMetaDescription(
    `Meet the credentialed voters on the ${sportLabel} ${divisionName} Top 25 panel at Redshirt Sports. See who ranks teams each week and read every published ballot.`,
  );
}

export function rankingsHistoryMetaDescription(
  sportLabel: string,
  divisionName: string,
): string {
  return trimMetaDescription(
    `Weekly No. 1 teams and full poll history for the ${sportLabel} ${divisionName} Top 25. Track how rankings shifted week by week with transparent voter ballots.`,
  );
}

export function rankingsBallotsMetaDescription(
  sportLabel: string,
  divisionName: string,
  titleWeek: string,
  year: string,
): string {
  return trimMetaDescription(
    `Full voter ballots for the ${sportLabel} ${divisionName} Top 25, ${titleWeek} ${year}. See how each panelist ranked every team in the weekly Redshirt Sports poll.`,
  );
}

export function rankingsBallotsByVoterMetaDescription(
  sportLabel: string,
  divisionName: string,
  titleWeek: string,
  year: string,
): string {
  return trimMetaDescription(
    `Each voter's full ${sportLabel} ${divisionName} Top 25 ballot for ${titleWeek} ${year}. Compare picks side by side in Redshirt Sports' transparent weekly rankings.`,
  );
}
