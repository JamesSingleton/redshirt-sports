import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import {
  MIN_TEAM_PAGE_POSTS,
  queryTeamsIndexSchools,
} from "@redshirt-sports/sanity/queries";
import type { QueryTeamsIndexSchoolsResult } from "@redshirt-sports/sanity/types";
import type { Metadata } from "next";

import { TeamsIndex } from "@/components/teams/teams-index";
import { draftAwarePage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = await getDynamicFetchOptions();

  return getPageMetadata(
    {
      title: "College Teams",
      description:
        "Browse all college football and basketball teams — rosters, schedules, recruiting classes, transfer portal activity, and news.",
      slug: "/college/teams",
    },
    perspective,
  );
}

export default function CollegeTeamsPage() {
  return draftAwarePage(null, renderCollegeTeamsPage);
}

async function renderCollegeTeamsPage({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const { data: schools } = (await sanityFetchPage({
    query: queryTeamsIndexSchools,
    params: { minPosts: MIN_TEAM_PAGE_POSTS },
    perspective,
    stega,
  })) as { data: QueryTeamsIndexSchoolsResult | null };

  return <TeamsIndex schools={schools ?? []} />;
}
