import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@redshirt-sports/sanity/live";
import {
  MIN_TEAM_PAGE_POSTS,
  querySchoolPaths,
  schoolBySlugQuery,
  schoolSlugsByIdsQuery,
  TEAM_PAGE_NEWS_FETCH_SIZE,
} from "@redshirt-sports/sanity/queries";
import type {
  SchoolBySlugQueryResult,
  SchoolSlugsByIdsQueryResult,
} from "@redshirt-sports/sanity/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TeamPageJsonLd } from "@/components/json-ld";
import { TeamPageContent } from "@/components/teams/team-page-content";
import { DirectionalPageTransition } from "@/components/view-transitions/directional-page-transition";
import { loadAdvertisement } from "@/lib/advertisement";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { getCachedSchoolPosts } from "@/lib/post-lists";
import {
  getCachedRankedSchoolSanityIds,
  getCachedSchoolRankingHistory,
} from "@/lib/rankings-data";
import { getCachedTeamRatings } from "@/lib/ratings/data";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { isTeamPageEligible } from "@/lib/team-page-eligibility";

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

  return `${teamName} News, Rankings and Coverage`;
}

import { trimMetaDescription } from "@/lib/meta-description";

function defaultTeamPageDescription(schoolName: string) {
  return trimMetaDescription(
    `Your source for ${schoolName} news, recruiting updates, transfer portal coverage, game previews, recaps, and analysis from Redshirt Sports across every level of college athletics.`,
  );
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
    getDynamicFetchOptions(),
  ]);
  const { data: school } = (await sanityFetchMetadata({
    query: schoolBySlugQuery,
    params: { slug },
    perspective,
  })) as { data: SchoolBySlugQueryResult | null };

  if (!school) {
    notFound();
  }

  // Same cache entries the page renders from, so metadata and page agree.
  const [rankingHistory, schoolPosts] = await Promise.all([
    getCachedSchoolRankingHistory(school._id),
    getCachedSchoolPosts({
      schoolId: school._id,
      from: 0,
      to: TEAM_PAGE_NEWS_FETCH_SIZE,
      perspective,
      stega: false,
    }),
  ]);
  if (
    !isTeamPageEligible({
      postCount: schoolPosts?.totalPosts ?? 0,
      hasRankings: rankingHistory.polls.length > 0,
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
  return draftAwareParamsPage(params, null, renderSchoolTeamPage, {
    prerenderPublished: true,
  });
}

async function renderSchoolTeamPage(
  { slug }: { slug: string },
  { perspective, stega }: DynamicFetchOptions,
) {
  const { data: school } = (await sanityFetchPage({
    query: schoolBySlugQuery,
    params: { slug },
    perspective,
    stega,
  })) as { data: SchoolBySlugQueryResult | null };

  if (!school) {
    notFound();
  }

  const [newsData, rankingHistory, ratings] = await Promise.all([
    getCachedSchoolPosts({
      schoolId: school._id,
      from: 0,
      to: TEAM_PAGE_NEWS_FETCH_SIZE,
      perspective,
      stega,
    }),
    getCachedSchoolRankingHistory(school._id),
    getCachedTeamRatings(school._id),
  ]);

  if (
    !isTeamPageEligible({
      postCount: newsData?.totalPosts ?? 0,
      hasRankings: rankingHistory.polls.length > 0,
    })
  ) {
    notFound();
  }

  const posts = newsData?.posts ?? [];
  const sportSlugs = [
    ...new Set(
      (school.conferenceAffiliations ?? [])
        .map((affiliation) => affiliation.sport?.slug)
        .filter((slug): slug is string => Boolean(slug)),
    ),
  ];
  const advertisement = await loadAdvertisement({
    placement: "team-sidebar",
    sportSlugs,
    fetchOptions: { perspective, stega },
  });

  return (
    <DirectionalPageTransition>
      <div className="min-h-screen bg-background">
        <TeamPageJsonLd school={school} />
        <TeamPageContent
          school={school}
          posts={posts}
          rankingHistory={rankingHistory}
          ratings={ratings}
          advertisement={advertisement}
        />
      </div>
    </DirectionalPageTransition>
  );
}
