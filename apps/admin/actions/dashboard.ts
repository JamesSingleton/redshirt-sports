"use server";

import { getSeasonInfo, type SportParam } from "@redshirt-sports/clients/espn";
import {
  countBallotsForPollWeek,
  countStalePollVoterAssignments,
  listActivePollVoters,
  listPolls,
  listUsers,
  listVoters,
  resolveWeekIdForLegacyWeek,
} from "@redshirt-sports/db/queries";

import { requireAdmin } from "@/lib/require-admin";

const SPORT_PARAMS = new Set<SportParam>([
  "football",
  "mens-basketball",
  "womens-basketball",
]);

function isSportParam(slug: string): slug is SportParam {
  return SPORT_PARAMS.has(slug as SportParam);
}

function weekLabel(info: {
  currentWeek: number;
  isPreseason: boolean;
  isRegularSeason: boolean;
  isPostseason: boolean;
}) {
  if (info.isPreseason) return "Preseason";
  if (info.isPostseason) return "Final rankings";
  if (info.isRegularSeason) return `Week ${info.currentWeek}`;
  return "Offseason";
}

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

  const [polls, voters, users, staleAssignments] = await Promise.all([
    listPolls(),
    listVoters(),
    listUsers(),
    countStalePollVoterAssignments(),
  ]);

  const sportSlugs = [
    ...new Set(
      polls
        .map((poll) => poll.sport?.slug)
        .filter((slug): slug is string => Boolean(slug)),
    ),
  ];

  const seasonBySport = new Map<
    string,
    Awaited<ReturnType<typeof getSeasonInfo>> | null
  >();

  await Promise.all(
    sportSlugs.map(async (slug) => {
      if (!isSportParam(slug)) {
        seasonBySport.set(slug, null);
        return;
      }
      try {
        seasonBySport.set(slug, await getSeasonInfo(slug));
      } catch {
        seasonBySport.set(slug, null);
      }
    }),
  );

  const panels = await Promise.all(
    polls.map(async (poll) => {
      const sportSlug = poll.sport?.slug ?? "";
      const season = seasonBySport.get(sportSlug) ?? null;
      const assigned = await listActivePollVoters(poll.id);
      const assignedCount = assigned.length;

      let submittedCount: number | null = null;
      if (season && poll.sportId) {
        const weekId = await resolveWeekIdForLegacyWeek({
          sportId: poll.sportId,
          year: season.year,
          legacyWeek: season.currentWeek,
        });
        if (weekId) {
          submittedCount = await countBallotsForPollWeek({
            pollId: poll.id,
            weekId,
          });
        }
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
        weekLabel: season ? weekLabel(season) : null,
        year: season?.year ?? null,
      };
    }),
  );

  const primarySport =
    panels.find((panel) => panel.sportSlug === "football") ?? panels[0];
  const primarySeason = primarySport
    ? seasonBySport.get(primarySport.sportSlug)
    : null;

  return {
    credentialedVoters: voters.length,
    totalUsers: users.length,
    staleAssignments,
    activePanels: panels.filter((panel) => panel.isActive).length,
    panels,
    headline: primarySeason
      ? {
          sportTitle: sportTitle(primarySport?.sportSlug ?? "football"),
          weekLabel: weekLabel(primarySeason),
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
