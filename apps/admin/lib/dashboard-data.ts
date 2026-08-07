import {
  countActivePollVotersByPollIds,
  countBallotsForPollWeeks,
  countStalePollVoterAssignments,
  countUsers,
  countVoters,
  getVotingSeasonInfoBySportIds,
  listPolls,
  weekTitle,
} from "@redshirt-sports/db/queries";

import { requireAdmin } from "@/lib/require-admin";

function sportTitle(slug: string) {
  switch (slug) {
    case "football":
      return "Football";
    case "mens-basketball":
      return "Men's basketball";
    case "womens-basketball":
      return "Women's basketball";
    default:
      return slug;
  }
}

export async function getDashboardData() {
  await requireAdmin();

  const pollsPromise = listPolls();
  const snapshotPromise = Promise.all([
    countVoters(),
    countUsers(),
    countStalePollVoterAssignments(),
  ]);

  const polls = await pollsPromise;
  const pollIds = polls.map((poll) => poll.id);
  const sportIds = [
    ...new Set(polls.map((poll) => poll.sportId).filter(Boolean)),
  ];

  const [seasonBySportId, assignedByPoll, snapshot] = await Promise.all([
    getVotingSeasonInfoBySportIds(sportIds),
    countActivePollVotersByPollIds(pollIds),
    snapshotPromise,
  ]);
  const [credentialedVoters, totalUsers, staleAssignments] = snapshot;

  const ballotPairs = polls.flatMap((poll) => {
    const season = seasonBySportId.get(poll.sportId);
    if (!season?.weekId) return [];
    return [{ pollId: poll.id, weekId: season.weekId }];
  });

  const ballotCounts = await countBallotsForPollWeeks(ballotPairs);

  const panels = polls.map((poll) => {
    const sportSlug = poll.sport?.slug ?? "";
    const season = seasonBySportId.get(poll.sportId) ?? null;
    const assignedCount = assignedByPoll.get(poll.id) ?? 0;

    let submittedCount: number | null = null;
    if (season?.weekId) {
      submittedCount = ballotCounts.get(`${poll.id}:${season.weekId}`) ?? 0;
    }

    return {
      id: poll.id,
      name: poll.name,
      slug: poll.slug,
      sportSlug,
      sportTitle: sportTitle(sportSlug),
      isActive: poll.isActive,
      assignedCount,
      submittedCount,
      weekLabel: season ? weekTitle(season.votingWeek) : null,
      year: season?.year ?? null,
    };
  });

  const primaryPoll =
    polls.find((poll) => poll.sport?.slug === "football") ?? polls[0];
  const primarySeason = primaryPoll
    ? (seasonBySportId.get(primaryPoll.sportId) ?? null)
    : null;

  return {
    credentialedVoters,
    totalUsers,
    staleAssignments,
    activePanels: panels.filter((panel) => panel.isActive).length,
    panels,
    headline: primarySeason
      ? {
          sportTitle: sportTitle(primaryPoll?.sport?.slug ?? "football"),
          weekLabel: weekTitle(primarySeason.votingWeek),
          year: primarySeason.year,
          period: primarySeason.isPreseason
            ? "preseason"
            : primarySeason.isRegularSeason
              ? "regular"
              : primarySeason.isPostseason
                ? "postseason"
                : "offseason",
        }
      : null,
  };
}
