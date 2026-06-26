import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { collegeNewsQuery } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CollectionPage, WithContext } from "schema-dts";

import { CollegeNewsArticleList } from "@/components/college-news/college-news-article-list";
import { CollegeNewsArticleListLoading } from "@/components/college-news/college-news-loading";
import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import PaginationControls from "@/components/pagination-controls";
import { COLLEGE_NEWS_DESCRIPTION } from "@/lib/college-news-config";
import { perPage } from "@/lib/constants";
import { searchParamsPage } from "@/lib/draft-cache";
import { getBaseUrl } from "@/lib/get-base-url";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { validatePageIndex } from "@/utils/validate-page-index";

const baseUrl = getBaseUrl();

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const [params, { perspective }] = await Promise.all([
    searchParams,
    getDynamicFetchOptions(),
  ]);
  const page = params.page;

  const pageNumber = typeof page === "string" ? parseInt(page, 10) : 1;
  const isFirstPage = !page || pageNumber <= 1;

  const baseTitle = "College Sports News";
  const baseCanonical = "/college/news";

  return getPageMetadata(
    {
      title: isFirstPage ? baseTitle : `${baseTitle} - Page ${pageNumber}`,
      description: isFirstPage
        ? COLLEGE_NEWS_DESCRIPTION
        : `Continue reading more college sports news on Page ${pageNumber}.`,
      slug: isFirstPage ? baseCanonical : `${baseCanonical}?page=${pageNumber}`,
    },
    perspective,
  );
}

export default function CollegeSportsNews({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return searchParamsPage(<CollegeNewsArticleListLoading />, () =>
    renderCollegeSportsNews(searchParams),
  );
}

async function renderCollegeSportsNews(
  searchParams: Promise<{ page?: string }>,
) {
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);
  const { perspective, stega } = await getDynamicFetchOptions();
  return cachedRenderCollegeSportsNews({ pageIndex, perspective, stega });
}

async function cachedRenderCollegeSportsNews({
  pageIndex,
  perspective,
  stega,
}: DynamicFetchOptions & { pageIndex: number }) {
  "use cache";
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;
  const {
    data: { posts, totalPosts },
  } = await sanityFetchPage({
    query: collegeNewsQuery,
    params: { from, to },
    perspective,
    stega,
  });

  if (posts.length === 0) {
    notFound();
  }

  const totalPages = Math.ceil(totalPosts / perPage);

  const newsJsonLd: WithContext<CollectionPage> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "College Sports News",
    url: `${baseUrl}/college/news`,
    description: COLLEGE_NEWS_DESCRIPTION,
    isPartOf: {
      "@type": "WebSite",
      "@id": websiteId,
    },
    publisher: {
      "@type": "Organization",
      "@id": organizationId,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index: number) => ({
        "@id": `${baseUrl}/${post.slug}#article`,
        position: index + 1,
      })),
      numberOfItems: posts.length,
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
          name: "College Sports News",
          item: `${baseUrl}/college/news`,
        },
      ],
    },
  };

  return (
    <>
      <JsonLdScript data={newsJsonLd} id="college-sports-news-json-ld" />
      <CollegeNewsArticleList articles={posts} />
      {totalPages > 1 ? <PaginationControls totalPosts={totalPosts} /> : null}
    </>
  );
}
