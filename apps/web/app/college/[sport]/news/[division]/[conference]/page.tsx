import {
  conferenceInfoBySlugQuery,
  queryArticlesBySportDivisionAndConference,
  queryDivisionOrSubgroupingDisplayName,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { CollectionPage, WithContext } from "schema-dts";

import ArticleFeed from "@/components/article-feed";
import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import PageHeader from "@/components/page-header";
import PaginationControls from "@/components/pagination-controls";
import { perPage } from "@/lib/constants";
import { getBaseUrl } from "@/lib/get-base-url";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchPage,
} from "@/lib/sanity-fetch";
import { getSEOMetadata } from "@/lib/seo";
import { validatePageIndex } from "@/utils/validate-page-index";

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/college/[sport]/news/[division]/[conference]">): Promise<Metadata> {
  const { sport, division, conference } = await params;
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);

  const { perspective } = await getDynamicFetchOptions();
  const [divisionDisplayName, conferenceInfo, sportTitle] = await Promise.all([
    sanityFetchMetadata({
      query: queryDivisionOrSubgroupingDisplayName,
      params: { slugOrShortName: division },
      perspective,
    }),
    sanityFetchMetadata({
      query: conferenceInfoBySlugQuery,
      params: { slug: conference },
      perspective,
    }),
    sanityFetchMetadata({
      query: sportInfoBySlug,
      params: { slug: sport },
      perspective,
    }),
  ]);

  if (
    !conferenceInfo ||
    !sportTitle.data?.title ||
    !divisionDisplayName?.data
  ) {
    return {};
  }

  const conferenceName =
    conferenceInfo.data?.shortName ?? conferenceInfo.data?.name;
  let canonical = `/college/${sport}/news/${division}/${conference}`;

  const baseTitle = `${conferenceName} ${divisionDisplayName?.data.displayName} ${sportTitle.data.title} News, Updates & Analysis`;
  const baseDescription = `Stay informed with breaking ${conferenceName} ${divisionDisplayName?.data.displayName} ${sportTitle.data.title} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`;

  let finalTitle = baseTitle;
  let finalDescription = baseDescription;

  if (pageIndex && pageIndex > 1) {
    finalTitle = `${baseTitle} - Page ${pageIndex}`;
    finalDescription = `Continue exploring coverage of ${conferenceName} ${divisionDisplayName?.data.displayName} ${sportTitle.data.title} on Page ${pageIndex}. Find more detailed articles, updates, and analysis at ${process.env.NEXT_PUBLIC_APP_NAME}.`;
    canonical = `/college/${sport}/news/${division}/${conference}?page=${pageIndex}`;
  }

  return getSEOMetadata({
    title: finalTitle,
    description: finalDescription,
    slug: canonical,
  });
}

export default async function Page({
  params,
  searchParams,
}: PageProps<"/college/[sport]/news/[division]/[conference]">) {
  const { sport, division, conference } = await params;
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);
  const baseUrl = getBaseUrl();

  const fetchOptions = await getDynamicFetchOptions();
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;

  const [newsResponse, sportInfoResponse, divisionNameResponse] =
    await Promise.all([
      sanityFetchPage({
        query: queryArticlesBySportDivisionAndConference,
        params: { sport, division, conference, from, to },
        ...fetchOptions,
      }),
      sanityFetchPage({
        query: sportInfoBySlug,
        params: { slug: sport },
        ...fetchOptions,
      }),
      sanityFetchPage({
        query: queryDivisionOrSubgroupingDisplayName,
        params: { slugOrShortName: division },
        ...fetchOptions,
      }),
    ]);

  const news = newsResponse.data;
  const sportInfo = sportInfoResponse.data;
  const divisionOrSubgroupingName = divisionNameResponse.data?.displayName;

  if (!news?.posts?.length || !news.conferenceInfo) {
    notFound();
  }

  const totalPages = Math.ceil(news.totalPosts / perPage);

  const sportTitle = sportInfo?.title;

  const title = news.conferenceInfo.shortName
    ? `${news.conferenceInfo.shortName} ${sportTitle} News`
    : `${news.conferenceInfo.name} ${sportTitle} News`;

  const collectionPageJsonLd: WithContext<CollectionPage> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: `Stay informed with breaking ${news.conferenceInfo.shortName ?? news.conferenceInfo.name} ${divisionOrSubgroupingName} ${sportTitle} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`,
    url: `${baseUrl}/college/${sport}/news/${division}/${conference}${page ? `?page=${page}` : ""}`,
    isPartOf: { "@id": websiteId, "@type": "WebSite" },
    publisher: { "@id": organizationId, "@type": "Organization" },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: news.posts.map((post, index: number) => ({
        "@id": `${baseUrl}/${post.slug}#article`,
        position: index + 1,
      })),
      numberOfItems: news.totalPosts,
      url: `${baseUrl}/college/${sport}/news/${division}/${conference}`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "News",
          item: `${baseUrl}/college/news`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: sportTitle,
          item: `${baseUrl}/college/${sport}/news`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: divisionOrSubgroupingName || "",
          item: `${baseUrl}/college/${sport}/news/${division}`,
        },
        {
          "@type": "ListItem",
          position: 5,
          name: news.conferenceInfo.shortName ?? news.conferenceInfo.name,
          item: `${baseUrl}/college/${sport}/news/${division}/${conference}`,
        },
      ],
    },
  };

  const breadcrumbItems = [
    {
      title: "News",
      href: "/college/news",
    },
    {
      title: sportInfo?.title,
      href: `/college/${sport}/news`,
    },
    {
      title: divisionOrSubgroupingName || "",
      href: `/college/${sport}/news/${division}`,
    },
    {
      title: news.conferenceInfo.shortName ?? news.conferenceInfo.name,
      href: `/college/${sport}/news/${division}/${conference}`,
    },
  ];

  return (
    <>
      <JsonLdScript
        data={collectionPageJsonLd}
        id={`collection-page-${sport}-${division}-${conference}`}
      />
      {/* @ts-expect-error for some reason it doesn't like the type */}
      <PageHeader title={title} breadcrumbs={breadcrumbItems} />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <ArticleFeed articles={news.posts} />
        {totalPages > 1 && (
          <Suspense fallback={<>Loading...</>}>
            <PaginationControls totalPosts={news.totalPosts} />
          </Suspense>
        )}
      </section>
    </>
  );
}
