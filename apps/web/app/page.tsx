import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { queryHomeFeed } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";

import {
  HomePageContent,
  type HomePost,
} from "@/components/home/home-page-content";
import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import { loadAdvertisement } from "@/lib/advertisement";
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
  const { perspective } = await getDynamicFetchOptions();
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

export default async function HomePage() {
  return draftAwarePage(<HomeRouteLoading />, CachedHomePage);
}

export async function CachedHomePage({
  perspective,
  stega,
}: DynamicFetchOptions) {
  const [{ data: feedPosts }, settings, mostRead, rankingsPolls] =
    await Promise.all([
      sanityFetchPage({ query: queryHomeFeed, perspective, stega }),
      fetchGlobalSeoSettings(perspective),
      getCachedMostReadPosts({ perspective, stega }),
      getCachedRankingsWidgetPolls(),
    ]);

  const posts = (feedPosts ?? []) as HomePost[];
  const fetchOptions = { perspective, stega };
  const [leaderboardAd, sidebarAd] = await Promise.all([
    loadAdvertisement({ placement: "home-leaderboard", fetchOptions }),
    loadAdvertisement({ placement: "home-sidebar", fetchOptions }),
  ]);

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
    dateModified: posts[0]?.publishedAt || "2021-12-13T00:00:00-07:00",
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
        leaderboardAd={leaderboardAd}
        sidebarAd={sidebarAd}
      />
    </>
  );
}
