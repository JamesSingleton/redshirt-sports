import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";
import {
  queryArticlesBySportDivisionAndConference,
  queryArticlesBySportDivisionAndConferenceOldest,
  queryCollegeNews,
  queryCollegeNewsOldest,
  queryDivisionOrSubgroupingDisplayName,
  querySportsAndDivisionNews,
  querySportsAndDivisionNewsOldest,
  querySportsNews,
  querySportsNewsOldest,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import { notFound } from "next/navigation";

import type { HomePost } from "@/components/home/home-page-content";
import { JsonLdScript } from "@/components/json-ld";
import { NewsArchiveHeader } from "@/components/news/news-archive-header";
import { NewsArchiveRiver } from "@/components/news/news-archive-river";
import { NewsArchiveSidebar } from "@/components/news/news-archive-sidebar";
import PaginationControls from "@/components/pagination-controls";
import { perPage } from "@/lib/constants";
import type { DivisionDisplayMeta } from "@/lib/division-display-meta";
import type { NewsArchiveSearchParams } from "@/lib/news-archive";
import {
  CollegeNewsFiltersSlot,
  FolderConferencePickerSlot,
  FolderNewsFiltersBelowHeaderSlot,
  SportNewsFiltersSlot,
} from "@/lib/news-archive/cached-nav-chrome";
import { NewsArchiveSidebarSlot } from "@/lib/news-archive/cached-sidebar";
import {
  buildConferenceNewsCollectionJsonLd,
  buildDivisionNewsCollectionJsonLd,
} from "@/lib/news-archive/collection-json-ld";
import type { NewsArchiveScope } from "@/lib/news-archive/scope";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { sportNavLabel } from "@/lib/sport-nav";

export type CachedNewsArchiveInput = DynamicFetchOptions & {
  scope: NewsArchiveScope;
  pageIndex: number;
  search: string;
  storyType: string;
  sort: "newest" | "oldest";
  filterParams: NewsArchiveSearchParams;
};

function newsQueryForScope(scope: NewsArchiveScope, sort: "newest" | "oldest") {
  const oldest = sort === "oldest";
  switch (scope.type) {
    case "college":
      return oldest ? queryCollegeNewsOldest : queryCollegeNews;
    case "sport":
      return oldest ? querySportsNewsOldest : querySportsNews;
    case "division":
      return oldest
        ? querySportsAndDivisionNewsOldest
        : querySportsAndDivisionNews;
    case "conference":
      return oldest
        ? queryArticlesBySportDivisionAndConferenceOldest
        : queryArticlesBySportDivisionAndConference;
  }
}

function newsQueryParams(
  scope: NewsArchiveScope,
  from: number,
  to: number,
  search: string,
  storyType: string,
) {
  const base = { from, to, search, storyType };
  switch (scope.type) {
    case "college":
      return base;
    case "sport":
      return { ...base, sport: scope.sport };
    case "division":
      return { ...base, sport: scope.sport, division: scope.division };
    case "conference":
      return {
        ...base,
        sport: scope.sport,
        division: scope.division,
        conference: scope.conference,
      };
  }
}

export async function cachedRenderNewsArchivePage(
  input: CachedNewsArchiveInput,
) {
  "use cache";
  const {
    scope,
    pageIndex,
    search,
    storyType,
    sort,
    perspective,
    stega,
    filterParams,
  } = input;

  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;
  const newsQuery = newsQueryForScope(scope, sort);
  const queryParams = newsQueryParams(scope, from, to, search, storyType);

  const sportSlug = scope.type === "college" ? null : scope.sport;
  const needsSportMeta = scope.type !== "college";
  const needsDivisionMeta =
    scope.type === "division" || scope.type === "conference";
  const divisionSlugForDisplay =
    scope.type === "division" || scope.type === "conference"
      ? scope.division
      : null;

  const [newsResponse, sportInfoResponse, divisionNameResponse] =
    await Promise.all([
      sanityFetchPage({
        query: newsQuery,
        params: queryParams,
        perspective,
        stega,
      }),
      needsSportMeta
        ? sanityFetchPage({
            query: sportInfoBySlug,
            params: { slug: sportSlug! },
            perspective,
            stega,
          })
        : Promise.resolve({ data: null }),
      divisionSlugForDisplay
        ? sanityFetchPage({
            query: queryDivisionOrSubgroupingDisplayName,
            params: { slugOrShortName: divisionSlugForDisplay },
            perspective,
            stega,
          })
        : Promise.resolve({ data: null }),
    ]);

  const news = newsResponse.data as {
    posts?: HomePost[];
    totalPosts?: number;
    conferenceInfo?: {
      name: string;
      shortName?: string | null;
    } | null;
  } | null;

  if (!news?.posts?.length) {
    notFound();
  }

  if (scope.type === "conference" && !news.conferenceInfo) {
    notFound();
  }

  const totalPostCount = news.totalPosts ?? news.posts.length;
  const totalPages = Math.ceil(totalPostCount / perPage);
  const sportInfo = sportInfoResponse?.data;
  const divisionMeta = divisionNameResponse?.data as DivisionDisplayMeta | null;
  const divisionDisplayName = divisionMeta?.displayName ?? "";
  const divisionRouteSlug =
    scope.type === "division" || scope.type === "conference"
      ? scope.division
      : "";
  const divisionLabel = divisionDisplayName || divisionRouteSlug;
  const archiveKicker = divisionMeta?.archiveKicker ?? divisionLabel;

  const pagination =
    totalPages > 1 ? (
      <nav aria-label="Pagination" className="pt-6">
        <PaginationControls totalPosts={news.totalPosts ?? news.posts.length} />
      </nav>
    ) : null;

  const river = (
    <NewsArchiveRiver
      posts={news.posts}
      pageIndex={pageIndex}
      totalPosts={news.totalPosts ?? news.posts.length}
      totalPages={totalPages}
      showSportLabels={scope.type === "college"}
    />
  );

  const grid = (
    <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div>
        {river}
        {pagination}
      </div>
      <NewsArchiveSidebarSlot
        perspective={perspective}
        stega={stega}
        sportSlug={sportSlug}
      />
    </div>
  );

  if (scope.type === "college") {
    const breadcrumbItems = [
      { title: "College", href: "/college/news" },
      { title: "News", href: "/college/news" },
    ];

    return (
      <div className="mx-auto max-w-site px-4 lg:px-6">
        <NewsArchiveHeader
          breadcrumbs={breadcrumbItems}
          kicker="All sports · Archive"
          title="College News"
          description="Every Redshirt story across college football and basketball, newest first."
        />
        <CollegeNewsFiltersSlot
          filterParams={filterParams}
          perspective={perspective}
          stega={stega}
        />
        {grid}
      </div>
    );
  }

  const sport = scope.sport;
  const sportLabel = sportNavLabel(sport, sportInfo?.title ?? sport);

  const breadcrumbItems = [
    { title: "College", href: "/college/news" },
    { title: sportInfo?.title ?? sport, href: `/college/${sport}/news` },
    { title: "News", href: `/college/${sport}/news` },
  ];

  if (scope.type === "sport") {
    return (
      <div className="mx-auto max-w-site px-4 lg:px-6">
        <NewsArchiveHeader
          breadcrumbs={breadcrumbItems}
          title={`${sportLabel} News`}
          description={`Every ${sportLabel} story, newest first.`}
        />
        <SportNewsFiltersSlot
          sportSlug={sport}
          filterParams={filterParams}
          perspective={perspective}
          stega={stega}
        />
        {grid}
      </div>
    );
  }

  if (scope.type === "division") {
    const pageTitle = `${divisionLabel} ${sportInfo?.title} News`;
    const collectionPageJsonLd = buildDivisionNewsCollectionJsonLd({
      sport,
      division: scope.division,
      sportTitle: sportInfo?.title,
      divisionTitle: divisionLabel,
      divisionOrSubgroupingName: divisionLabel,
      pageIndex,
      posts: news.posts,
      totalPosts: news.totalPosts,
    });

    return (
      <>
        <JsonLdScript
          data={collectionPageJsonLd}
          id={`collection-page-${sport}-${scope.division}`}
        />
        <div className="mx-auto max-w-site px-4 lg:px-6">
          <NewsArchiveHeader
            breadcrumbs={[
              ...breadcrumbItems,
              {
                title: divisionLabel,
                href: `/college/${sport}/news/${scope.division}`,
              },
            ]}
            kicker={archiveKicker}
            title={pageTitle}
          >
            <FolderConferencePickerSlot
              sportSlug={sport}
              divisionSlug={scope.division}
              divisionLabel={divisionLabel}
              perspective={perspective}
              stega={stega}
            />
          </NewsArchiveHeader>
          <FolderNewsFiltersBelowHeaderSlot
            sportSlug={sport}
            filterParams={filterParams}
            perspective={perspective}
            stega={stega}
          />
          {grid}
        </div>
      </>
    );
  }

  const conferenceInfo = news.conferenceInfo!;
  const title = conferenceInfo.shortName
    ? `${conferenceInfo.shortName} ${sportInfo?.title} News`
    : `${conferenceInfo.name} ${sportInfo?.title} News`;

  const collectionPageJsonLd = buildConferenceNewsCollectionJsonLd({
    sport,
    division: scope.division,
    conference: scope.conference,
    sportTitle: sportInfo?.title,
    divisionOrSubgroupingName: divisionLabel,
    conferenceName: conferenceInfo.name,
    conferenceShortName: conferenceInfo.shortName,
    pageIndex,
    posts: news.posts,
    totalPosts: news.totalPosts,
  });

  return (
    <>
      <JsonLdScript
        data={collectionPageJsonLd}
        id={`collection-page-${sport}-${scope.division}-${scope.conference}`}
      />
      <div className="mx-auto max-w-site px-4 lg:px-6">
        <NewsArchiveHeader
          breadcrumbs={[
            ...breadcrumbItems,
            {
              title: divisionLabel,
              href: `/college/${sport}/news/${scope.division}`,
            },
            {
              title:
                conferenceInfo.shortName ||
                conferenceInfo.name ||
                scope.conference,
              href: `/college/${sport}/news/${scope.division}/${scope.conference}`,
            },
          ]}
          kicker={archiveKicker}
          title={title}
        >
          <FolderConferencePickerSlot
            sportSlug={sport}
            divisionSlug={scope.division}
            divisionLabel={divisionLabel}
            activeConferenceSlug={scope.conference}
            perspective={perspective}
            stega={stega}
          />
        </NewsArchiveHeader>
        <FolderNewsFiltersBelowHeaderSlot
          sportSlug={sport}
          filterParams={filterParams}
          perspective={perspective}
          stega={stega}
        />
        {grid}
      </div>
    </>
  );
}
