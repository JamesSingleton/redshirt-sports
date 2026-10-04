import {
  type DynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
} from "@redshirt-sports/sanity/live";
import {
  MIN_TEAM_PAGE_POSTS,
  queryTeamsIndex,
} from "@redshirt-sports/sanity/queries";
import type { QueryTeamsIndexResult } from "@redshirt-sports/sanity/types";
import type { Metadata } from "next";

import PageHeader from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { TeamsDirectory } from "@/components/teams/teams-directory";
import { draftAwarePage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { getCachedRankedSchoolSanityIds } from "@/lib/rankings-data";
import { sanityFetchPage } from "@/lib/sanity-fetch";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(
    {
      title: "College Teams",
      description: `Team hubs for the college football and basketball programs ${process.env.NEXT_PUBLIC_APP_NAME} has written about or ranked in its Top 25 polls, with the latest news and poll history.`,
      slug: "/college/teams",
    },
    PUBLISHED_FETCH_OPTIONS.perspective,
  );
}

const breadcrumbItems = [{ title: "Teams", href: "/college/teams" }];

export default function TeamsIndexPage() {
  return draftAwarePage(null, renderTeamsIndexPage);
}

async function renderTeamsIndexPage(options: DynamicFetchOptions) {
  const rankedIds = await getCachedRankedSchoolSanityIds();
  return cachedRenderTeamsIndexPage({ ...options, rankedIds });
}

async function cachedRenderTeamsIndexPage({
  perspective,
  stega,
  rankedIds,
}: DynamicFetchOptions & { rankedIds: string[] }) {
  "use cache";
  const { data } = (await sanityFetchPage({
    query: queryTeamsIndex,
    params: { rankedIds, minPosts: MIN_TEAM_PAGE_POSTS },
    perspective,
    stega,
  })) as { data: QueryTeamsIndexResult | null };

  const directoryTeams = data?.teams ?? [];
  const sports = (data?.sports ?? []).filter((sport) =>
    directoryTeams.some((team) =>
      team.affiliations?.some(
        (affiliation) => affiliation.sport === sport.slug,
      ),
    ),
  );

  return (
    <PageTransition>
      <PageHeader
        title="Teams"
        subtitle="Every program we have written about or ranked in our Top 25 polls, with the latest stories and poll history."
        breadcrumbs={breadcrumbItems}
      />
      <div className="container py-8 pb-12">
        <TeamsDirectory teams={directoryTeams} sports={sports} />
      </div>
    </PageTransition>
  );
}
