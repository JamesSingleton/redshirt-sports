import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
} from "@redshirt-sports/sanity/live";
import {
  collegeNewsQuery,
  querySportFilters,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CollectionPage, WithContext } from "schema-dts";

import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import { FilterRow } from "@/components/news/filter-row";
import { NewsListing } from "@/components/news/news-listing";
import PageHeader from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
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
  const params = await searchParams;
  const { perspective } = PUBLISHED_FETCH_OPTIONS;
  const page = params.page;

  const pageNumber = typeof page === "string" ? parseInt(page, 10) : 1;
  const isFirstPage = !page || pageNumber <= 1;

  const appName = process.env.NEXT_PUBLIC_APP_NAME;

  const baseTitle = `College Sports News`;
  const baseCanonical = `/college/news`;

  let title: string;
  let description: string;
  let canonical: string;

  if (isFirstPage) {
    title = baseTitle;
    description = `Stay updated with comprehensive college sports coverage: breaking news, game highlights, recruiting, & in-depth analysis from across the NCAA. Get the latest from ${appName}.`;
    canonical = baseCanonical;
  } else {
    title = `${baseTitle} - Page ${pageNumber}`;
    description = `Continue reading more college sports news on Page ${pageNumber}. Find the latest updates, player features, and postseason analysis from ${appName}.`;
    canonical = `${baseCanonical}?page=${pageNumber}`;
  }

  return getPageMetadata(
    {
      title,
      description,
      slug: canonical,
    },
    perspective,
  );
}

const breadcrumbItems = [
  {
    title: "News",
    href: "/college/news",
  },
];

export default function CollegeSportsNews({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return searchParamsPage(null, () => renderCollegeSportsNews(searchParams));
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
  const [
    {
      data: { posts, totalPosts },
    },
    { data: sports },
  ] = await Promise.all([
    sanityFetchPage({
      query: collegeNewsQuery,
      params: { from, to },
      perspective,
      stega,
    }),
    sanityFetchPage({ query: querySportFilters, perspective, stega: false }),
  ]);

  if (posts.length === 0) {
    notFound();
  }

  const newsJsonLd: WithContext<CollectionPage> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "College Sports News",
    url: `${baseUrl}/college/news`,
    description: `Stay updated with comprehensive college sports coverage: breaking news, game highlights, recruiting, & in-depth analysis from across the NCAA. Get the latest from ${process.env.NEXT_PUBLIC_APP_NAME}.`,
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

  const sportFilters = (sports ?? []).map((sport) => ({
    key: sport._id,
    label: sport.title ?? "",
    href: `/college/${sport.slug}/news`,
  }));

  return (
    <PageTransition>
      <JsonLdScript data={newsJsonLd} id="college-sports-news-json-ld" />
      <PageHeader title="College Sports News" breadcrumbs={breadcrumbItems}>
        <FilterRow
          label="Sports"
          items={[
            { key: "all", label: "All", href: "/college/news" },
            ...sportFilters,
          ]}
          activeHref="/college/news"
        />
      </PageHeader>
      <NewsListing.Layout>
        <NewsListing.Feed
          posts={posts}
          totalPosts={totalPosts}
          pageIndex={pageIndex}
        />
      </NewsListing.Layout>
    </PageTransition>
  );
}
