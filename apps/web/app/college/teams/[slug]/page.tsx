import {
  type DynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@redshirt-sports/sanity/live";
import {
  MIN_TEAM_PAGE_POSTS,
  postsBySchoolQuery,
  querySchoolPaths,
  schoolBySlugQuery,
  schoolSlugsByIdsQuery,
  TEAM_PAGE_NEWS_FETCH_SIZE,
} from "@redshirt-sports/sanity/queries";
import type {
  PostsBySchoolQueryResult,
  SchoolBySlugQueryResult,
  SchoolSlugsByIdsQueryResult,
} from "@redshirt-sports/sanity/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { StegaBranded } from "next-sanity";

import { TeamPageJsonLd } from "@/components/json-ld";
import { TeamPageContent } from "@/components/teams/team-page-content";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { getCachedMostReadPosts } from "@/lib/most-read-data";
import {
  getCachedRankedSchoolSanityIds,
  getCachedSchoolHasPollRankings,
  getCachedSchoolRankingHistory,
} from "@/lib/rankings-data";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { isTeamPageEligible } from "@/lib/team-page-eligibility";
import TeamHubRouteLoading from "./loading";

function defaultTeamPageTitle({
  name,
  shortName,
  nickname,
}: {
  name: string;
  shortName: string | null;
  nickname: string | null;
}) {
  const teamName = [shortName ?? name, nickname].filter(Boolean).join(" ");

  return `${teamName} Sports Coverage, Recruiting News & Updates`;
}

function defaultTeamPageDescription(schoolName: string) {
  return `Your source for ${schoolName} news, recruiting updates, transfer portal coverage, game previews, recaps, analysis, and more.`;
}

export async function generateStaticParams() {
  const [{ data: postQualified }, rankedSanityIds] = await Promise.all([
    sanityFetchStaticParams({
      query: querySchoolPaths,
      params: { minPosts: MIN_TEAM_PAGE_POSTS },
    }),
    getCachedRankedSchoolSanityIds(),
  ]);

  const rankedSlugs =
    rankedSanityIds.length > 0
      ? ((
          await sanityFetchStaticParams({
            query: schoolSlugsByIdsQuery,
            params: { ids: rankedSanityIds },
          })
        ).data as SchoolSlugsByIdsQueryResult | null)
      : [];

  const slugs = new Set<string>();
  for (const school of postQualified ?? []) {
    if (school.slug) slugs.add(school.slug);
  }
  for (const school of rankedSlugs ?? []) {
    if (school.slug) slugs.add(school.slug);
  }

  return [...slugs].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const [{ slug }, { perspective }] = await Promise.all([
    params,
    Promise.resolve(PUBLISHED_FETCH_OPTIONS),
  ]);
  const { data: school } = (await sanityFetchMetadata({
    query: schoolBySlugQuery,
    params: { slug },
    perspective,
  })) as { data: SchoolBySlugQueryResult | null };

  if (!school) {
    notFound();
  }

  const hasRankings = await getCachedSchoolHasPollRankings(school._id);
  if (
    !isTeamPageEligible({
      postCount: school.postCount,
      hasRankings,
    })
  ) {
    notFound();
  }

  return getPageMetadata(
    {
      title: school.seoTitle ?? defaultTeamPageTitle(school),
      description:
        school.seoDescription ??
        school.overview ??
        defaultTeamPageDescription(school.name),
      seoImage: school.seoImage ?? undefined,
      image: school.image ?? undefined,
      slug: `/college/teams/${slug}`,
      ogTitle: school.ogTitle ?? undefined,
      ogDescription: school.ogDescription ?? undefined,
    },
    perspective,
  );
}

export default async function SchoolTeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return draftAwareParamsPage(
    params,
    <TeamHubRouteLoading />,
    renderSchoolTeamPage,
  );
}

async function renderSchoolTeamPage(
  { slug }: { slug: string },
  { perspective, stega }: DynamicFetchOptions,
) {
  "use cache";
  const { data: school } = (await sanityFetchPage({
    query: schoolBySlugQuery,
    params: { slug },
    perspective,
    stega,
  })) as { data: SchoolBySlugQueryResult | null };

  if (!school) {
    notFound();
  }

  const [{ data: newsData }, rankingHistory, mostRead] = await Promise.all([
    sanityFetchPage({
      query: postsBySchoolQuery,
      params: { schoolId: school._id, from: 0, to: TEAM_PAGE_NEWS_FETCH_SIZE },
      perspective,
      stega,
    }) as Promise<{ data: StegaBranded<PostsBySchoolQueryResult> | null }>,
    getCachedSchoolRankingHistory(school._id),
    getCachedMostReadPosts(),
  ]);

  if (
    !isTeamPageEligible({
      postCount: school.postCount,
      hasRankings: rankingHistory.polls.length > 0,
    })
  ) {
    notFound();
  }

  const posts = newsData?.posts ?? [];

  return (
    <div className="min-h-screen bg-background">
      <TeamPageJsonLd school={school} />
      <TeamPageContent
        school={school}
        posts={posts}
        rankingHistory={rankingHistory}
        mostRead={mostRead}
      />
    </div>
  );
}
