import type { RankingHistoryPoll } from "@redshirt-sports/db/utils/school-ranking-history";

import type { TeamPost } from "@/components/teams/team-post-card";
import type { TeamConferenceAffiliationInput } from "@/lib/team-school-affiliations";

export const TEAM_HUB_SPORT_SECTIONS = [
  {
    id: "football",
    sportSlug: "football",
    title: "Football",
    newsHref: "/college/football/news",
  },
  {
    id: "mens-basketball",
    sportSlug: "mens-basketball",
    title: "Men's Basketball",
    newsHref: "/college/mens-basketball/news",
  },
  {
    id: "womens-basketball",
    sportSlug: "womens-basketball",
    title: "Women's Basketball",
    newsHref: "/college/womens-basketball/news",
  },
] as const;

export function groupTeamPostsBySport(posts: TeamPost[]) {
  const bySport = new Map<string, TeamPost[]>();

  for (const post of posts) {
    const slug = post.sport?.slug ?? "other";
    const bucket = bySport.get(slug) ?? [];
    bucket.push(post);
    bySport.set(slug, bucket);
  }

  return bySport;
}

export function pickFootballRankingPoll(
  polls: RankingHistoryPoll[],
  preferredDivisionSlug?: string | null,
): RankingHistoryPoll | null {
  const footballPolls = polls.filter((poll) => poll.sportSlug === "football");
  if (footballPolls.length === 0) {
    return null;
  }

  if (preferredDivisionSlug) {
    const preferred = footballPolls.find(
      (poll) => poll.pollSlug === preferredDivisionSlug,
    );
    if (preferred) {
      return preferred;
    }
  }

  const fcs = footballPolls.find((poll) => poll.pollSlug === "fcs");
  if (fcs) {
    return fcs;
  }
  const fbs = footballPolls.find((poll) => poll.pollSlug === "fbs");
  if (fbs) {
    return fbs;
  }

  return footballPolls[0]!;
}

export function footballAffiliationDivisionSlug(
  affiliations: TeamConferenceAffiliationInput[] | null | undefined,
): string | null {
  const football = affiliations?.find(
    (row) => row.sport?.slug === "football" && row.conference,
  );
  const subdivisions = football?.conference?.sportSubdivisions;
  const match = subdivisions?.find((row) => row.sport?.slug === "football");
  return match?.subdivision?.slug ?? null;
}
