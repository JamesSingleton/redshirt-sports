import {
  type DynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
} from "@redshirt-sports/sanity/live";
import {
  queryHomePageData,
  queryLatestArticles,
  queryLatestCollegeSportsArticles,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";

import { LeaderboardAd } from "@/components/ad-slot";
import ArticleSection from "@/components/article-section";
import { FollowTeamsBanner } from "@/components/home/follow-teams-banner";
import Hero from "@/components/home/hero";
import { HomeAside } from "@/components/home/home-aside";
import { LatestSection } from "@/components/home/latest-section";
import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import { draftAwarePage } from "@/lib/draft-cache";
import { getBaseUrl } from "@/lib/get-base-url";
import {
  fetchGlobalSeoSettings,
  getPageMetadata,
} from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";

const divisions = [
  {
    key: "fbs",
    division: "Football Bowl Subdivision",
    title: "FBS College Football News",
    slug: "/college/football/news/fbs",
    imageFirst: false,
  },
  {
    key: "fcs",
    division: "Football Championship Subdivision",
    title: "FCS College Football News",
    slug: "/college/football/news/fcs",
    imageFirst: false,
  },
  {
    key: "d2",
    division: "D2",
    title: "Division II Football News",
    slug: "/college/football/news/d2",
    imageFirst: false,
  },
  {
    key: "d3",
    division: "D3",
    title: "Division III Football News",
    slug: "/college/football/news/d3",
    imageFirst: true,
  },
];

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
  return draftAwarePage(null, CachedHomePage);
}

export async function CachedHomePage({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";

  const [{ data: homePageData }, { data: latestArticles }, settings] =
    await Promise.all([
      sanityFetchPage({ query: queryHomePageData, perspective, stega }),
      sanityFetchPage({ query: queryLatestArticles, perspective, stega }),
      fetchGlobalSeoSettings(perspective),
    ]);

  const articleIds = [...homePageData, ...latestArticles].map(
    (article) => article._id,
  );

  const collegeSportsResults = await Promise.all(
    divisions.map(({ division }) =>
      sanityFetchPage({
        query: queryLatestCollegeSportsArticles,
        params: { division, sport: "Football", articleIds },
        perspective,
        stega,
      }),
    ),
  );

  const divisionsWithArticles = divisions.map((division, index) => ({
    ...division,
    articles: collegeSportsResults[index]?.data,
  }));

  const sectionOrder = ["fbs", "fcs", "d2", "d3"];

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
    dateModified: homePageData[0]?.publishedAt || new Date().toISOString(),
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
      <FollowTeamsBanner />
      <div className="max-w-site mx-auto px-4 lg:px-6">
        <Hero heroPosts={homePageData} />
        <LeaderboardAd />
        <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <LatestSection articles={latestArticles} />
          <HomeAside />
        </section>
        {sectionOrder.map((key) => {
          const section = divisionsWithArticles.find((d) => d.key === key);
          if (!section || section.articles === undefined) return null;

          return (
            <ArticleSection
              key={section.key}
              title={section.title}
              slug={section.slug}
              articles={section.articles}
              imageFirst={section.imageFirst}
            />
          );
        })}
      </div>
    </>
  );
}
