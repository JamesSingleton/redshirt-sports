import { MIN_TEAM_PAGE_POSTS } from "@redshirt-sports/sanity/queries";

/** Team hub is public when the school has enough articles or Top 25 history. */
export function isTeamPageEligible({
  postCount,
  hasRankings,
}: {
  postCount: number;
  hasRankings: boolean;
}): boolean {
  return postCount >= MIN_TEAM_PAGE_POSTS || hasRankings;
}
