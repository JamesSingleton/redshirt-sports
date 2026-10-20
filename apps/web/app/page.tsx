import {
  type DynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
} from "@redshirt-sports/sanity/live";
import { queryHomeFeed } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";

import {
  HomePageContent,
  type HomePost,
} from "@/components/home/home-page-content";
import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import { draftAwarePage } from "@/lib/draft-cache";
import { getBaseUrl } from "@/lib/get-base-url";
import {
  fetchGlobalSeoSettings,
  getPageMetadata,
} from "@/lib/global-seo-settings";
import { getCachedMostReadPosts } from "@/lib/most-read-data";
import { getCachedRankingsWidgetPolls } from "@/lib/rankings-widget-data";
import { sanityFetchPage } from "@/lib/sanity-fetch";

import HomeRouteLoading from "./home-route-loading";

const baseUrl = getBaseUrl();

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = PUBLISHED_FETCH_OPTIONS;
  const settings = await fetchGlobalSeoSettings(perspective);

  return getPageMetadata(
    {
      title: settings?.siteTitle,
      description: settings?.siteDescription,
      slug: "/",
    },
    perspective,
  );
}

export default function HomePage() {
  return draftAwarePage(<HomeRouteLoading />, CachedHomePage);
}

export async function CachedHomePage({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";

  const [{ data: feedPosts }, settings, mostRead, rankingsPolls] =
    await Promise.all([
      sanityFetchPage({ query: queryHomeFeed, perspective, stega }),
      fetchGlobalSeoSettings(perspective),
      getCachedMostReadPosts(),
      getCachedRankingsWidgetPolls(),
    ]);

  const posts = (feedPosts ?? []) as HomePost[];

  const webPageJson: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": baseUrl,
    url: baseUrl,
    name: settings?.siteTitle ?? process.env.NEXT_PUBLIC_APP_NAME,
    description: settings?.siteDescription ?? undefined,
    isPartOf: {
      "@type": "WebSite",
      "@id": websiteId,
    },
    about: {
      "@id": organizationId,
    },
    inLanguage: "en-US",
    datePublished: "2021-12-13T00:00:00-07:00",
    dateModified: posts[0]?.publishedAt || new Date().toISOString(),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
      ],
    },
  };

  return (
    <>
      <JsonLdScript data={webPageJson} id="home-webpage-json-ld" />
      <HomePageContent
        posts={posts}
        mostRead={mostRead}
        rankingsPolls={rankingsPolls}
      />
    </>
  );
}
