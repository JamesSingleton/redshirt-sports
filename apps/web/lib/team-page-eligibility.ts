import { MIN_TEAM_PAGE_POSTS } from "@redshirt-sports/sanity/queries";

/** Team hub is public when the school has ≥1 published article or poll rankings history. */
export function isTeamPageEligible({
  postCount,
  hasRankings,
}: {
  postCount: number;
  hasRankings: boolean;
}): boolean {
  return postCount >= MIN_TEAM_PAGE_POSTS || hasRankings;
}
