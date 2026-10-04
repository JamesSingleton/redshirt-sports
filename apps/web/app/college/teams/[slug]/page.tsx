import {
  type DynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@redshirt-sports/sanity/live";
import {
  MIN_TEAM_PAGE_POSTS,
  postsBySchoolAndStoryTypeQuery,
  postsBySchoolQuery,
  querySchoolPaths,
  schoolBySlugQuery,
  schoolSlugsByIdsQuery,
} from "@redshirt-sports/sanity/queries";
import type {
  PostsBySchoolAndStoryTypeQueryResult,
  PostsBySchoolQueryResult,
  SchoolBySlugQueryResult,
  SchoolSlugsByIdsQueryResult,
} from "@redshirt-sports/sanity/types";
import { Badge } from "@redshirt-sports/ui/components/badge";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { StegaBranded } from "next-sanity";

import ArticleCard, { ArticleRow } from "@/components/article-card";
import { TeamPageJsonLd } from "@/components/json-ld";
import { SectionHeader } from "@/components/news/section-header";
import { PageTransition } from "@/components/page-transition";
import CustomImage from "@/components/sanity-image";
import { TeamConnectWidget } from "@/components/teams/team-connect-widget";
import { TeamPageSkeleton } from "@/components/teams/team-page-skeleton";
import { TeamPortalMoves } from "@/components/teams/team-portal-moves";
import { TeamRankingHistory } from "@/components/teams/team-ranking-history";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import {
  fetchGlobalSeoSettings,
  getPageMetadata,
} from "@/lib/global-seo-settings";
import {
  getCachedRankedSchoolSanityIds,
  getCachedSchoolHasPollRankings,
  getCachedSchoolRankingHistory,
} from "@/lib/rankings-data";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { isTeamPageEligible } from "@/lib/team-page-eligibility";
import {
  getCachedSchoolTransfers,
  isTransferPortalEnabled,
} from "@/lib/transfer-portal";

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
    <TeamPageSkeleton />,
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

  const [
    { data: newsData },
    { data: recruitingPosts },
    globalSettings,
    rankingHistory,
    portalTransfers,
  ] = await Promise.all([
    sanityFetchPage({
      query: postsBySchoolQuery,
      params: { schoolId: school._id, from: 0, to: MIN_TEAM_PAGE_POSTS },
      perspective,
      stega,
    }) as Promise<{ data: StegaBranded<PostsBySchoolQueryResult> | null }>,
    sanityFetchPage({
      query: postsBySchoolAndStoryTypeQuery,
      params: { schoolId: school._id, storyType: "recruiting" },
      perspective,
      stega,
    }) as Promise<{
      data: StegaBranded<PostsBySchoolAndStoryTypeQueryResult> | null;
    }>,
    fetchGlobalSeoSettings(perspective),
    getCachedSchoolRankingHistory(school._id),
    isTransferPortalEnabled()
      ? getCachedSchoolTransfers(school._id)
      : Promise.resolve(null),
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
  const featuredPosts = posts.slice(0, 3);
  const latestPosts = posts.slice(3, 8);
  const newsPostIds = new Set(posts.slice(0, 8).map((post) => post._id));
  const recruitingOnly = (recruitingPosts ?? []).filter(
    (post) => !newsPostIds.has(post._id),
  );
  const teamShortName = school.shortName ?? school.name ?? "Team";
  const conferences = (school.conferenceAffiliations ?? []).flatMap(
    (affiliation) =>
      affiliation.conference && affiliation.sport
        ? [
            {
              key: affiliation._key,
              label: `${affiliation.conference.shortName ?? affiliation.conference.name} ${affiliation.sport.title}`,
            },
          ]
        : [],
  );

  return (
    <PageTransition>
      <TeamPageJsonLd school={school} />
      <header className="bg-card border-b">
        <div className="container flex items-center gap-4 py-6 md:gap-6 md:py-8">
          {school.image ? (
            <CustomImage
              image={school.image}
              width={96}
              height={96}
              mode="contain"
              className="size-16 shrink-0 object-contain md:size-24"
            />
          ) : null}
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="headline text-3xl text-balance md:text-5xl">
              {[school.shortName ?? school.name, school.nickname]
                .filter(Boolean)
                .join(" ")}
            </h1>
            {conferences.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {conferences.map((conference) => (
                  <li key={conference.key}>
                    <Badge variant="secondary">{conference.label}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </header>

      <div className="container grid grid-cols-1 gap-8 py-8 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-10 lg:col-span-8">
          {featuredPosts.length > 0 ? (
            <section
              aria-labelledby="team-top-stories"
              className="flex flex-col gap-6"
            >
              <SectionHeader
                id="team-top-stories"
                title={`${teamShortName} news`}
              />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {featuredPosts.map((post) => (
                  <ArticleCard
                    key={post._id}
                    id={post._id}
                    title={post.title}
                    image={post.image}
                    slug={post.slug}
                    author={post.authors[0]?.name}
                    date={post.publishedAt}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {latestPosts.length > 0 ? (
            <section
              aria-labelledby="team-latest"
              className="flex flex-col gap-6"
            >
              <SectionHeader id="team-latest" title="More stories" />
              <ul className="flex flex-col divide-y">
                {latestPosts.map((post) => (
                  <li key={post._id} className="py-4 first:pt-0">
                    <ArticleRow
                      id={post._id}
                      title={post.title}
                      image={post.image}
                      slug={post.slug}
                      author={post.authors[0]?.name}
                      date={post.publishedAt}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <TeamRankingHistory
            history={rankingHistory}
            teamName={teamShortName}
          />

          {portalTransfers ? (
            <TeamPortalMoves
              teamName={teamShortName}
              incoming={portalTransfers.incoming}
              outgoing={portalTransfers.outgoing}
            />
          ) : null}

          {recruitingOnly.length > 0 ? (
            <section
              aria-labelledby="team-recruiting"
              className="flex flex-col gap-6"
            >
              <SectionHeader
                id="team-recruiting"
                title={`${teamShortName} recruiting`}
              />
              <ul className="flex flex-col divide-y">
                {recruitingOnly.map((post) => (
                  <li key={post._id} className="py-4 first:pt-0">
                    <ArticleRow
                      id={post._id}
                      title={post.title}
                      image={post.image}
                      slug={post.slug}
                      author={post.authors[0]?.name}
                      date={post.publishedAt}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-6 empty:hidden lg:sticky lg:top-20 lg:col-span-4 lg:self-start">
          <TeamConnectWidget
            schoolName={teamShortName}
            schoolSocialLinks={school.socialLinks}
            globalSocialLinks={globalSettings?.socialLinks}
          />
        </aside>
      </div>
    </PageTransition>
  );
}
