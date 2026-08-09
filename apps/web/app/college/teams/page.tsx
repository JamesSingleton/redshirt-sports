import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { teamsDirectoryQuery } from "@redshirt-sports/sanity/queries";
import type { TeamsDirectoryQueryResult } from "@redshirt-sports/sanity/types";
import type { Metadata } from "next";

import PageHeader from "@/components/page-header";
import {
  type DirectoryConference,
  TeamsDirectory,
} from "@/components/teams/teams-directory";
import { draftAwarePage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { getCachedRankedSchoolSanityIds } from "@/lib/rankings-data";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { isTeamPageEligible } from "@/lib/team-page-eligibility";

const breadcrumbItems = [
  {
    title: "Teams",
    href: "/college/teams",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = await getDynamicFetchOptions();

  return getPageMetadata(
    {
      title: "College Team Hubs",
      description:
        "Browse every college team we cover: news, recruiting, transfer portal updates, and Top 25 poll history in one place.",
      slug: "/college/teams",
    },
    perspective,
  );
}

export default function CollegeTeamsIndex() {
  return draftAwarePage(null, renderCollegeTeamsIndex);
}

async function renderCollegeTeamsIndex({
  perspective,
  stega,
}: DynamicFetchOptions) {
  return cachedRenderCollegeTeamsIndex({ perspective, stega });
}

async function cachedRenderCollegeTeamsIndex({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const [{ data: schools }, rankedSanityIds] = await Promise.all([
    sanityFetchPage({
      query: teamsDirectoryQuery,
      perspective,
      stega,
    }) as Promise<{ data: TeamsDirectoryQueryResult | null }>,
    getCachedRankedSchoolSanityIds(),
  ]);

  const rankedIds = new Set(rankedSanityIds);

  const eligibleTeams = (schools ?? []).filter((school) =>
    isTeamPageEligible({
      postCount: school.postCount,
      hasRankings: rankedIds.has(school._id),
    }),
  );

  const conferenceMap = new Map<string, DirectoryConference>();
  for (const team of eligibleTeams) {
    const conference = team.primaryConference;
    if (conference?.abbreviation) {
      conferenceMap.set(conference.abbreviation, {
        abbreviation: conference.abbreviation,
        name: conference.name,
      });
    }
  }
  const conferences = [...conferenceMap.values()].sort((a, b) =>
    a.abbreviation.localeCompare(b.abbreviation),
  );

  return (
    <>
      <PageHeader
        title="College Team Hubs"
        subtitle={
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            News, recruiting, and Top 25 poll history for every program we
            cover.
          </p>
        }
        breadcrumbs={breadcrumbItems}
      />
      <section className="container pb-16">
        <TeamsDirectory teams={eligibleTeams} conferences={conferences} />
      </section>
    </>
  );
}
