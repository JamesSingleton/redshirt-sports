import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import {
  queryHomePostsByStoryType,
  queryHomepageTeamAuthors,
  queryLatestArticles,
  queryLatestCollegeSportsArticles,
  queryMegaboardArticles,
} from "@redshirt-sports/sanity/queries";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";

import { HomeNewsSection } from "@/components/home/home-news-section";
import { Megaboard } from "@/components/home/megaboard";
import { OurTeamWidget } from "@/components/home/our-team-widget";
import { Top25Widget } from "@/components/home/top25-widget";
import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import { NewsletterForm } from "@/components/newsletter-form";
import { getBaseUrl } from "@/lib/get-base-url";
import {
  fetchGlobalSeoSettings,
  getPageMetadata,
} from "@/lib/global-seo-settings";
import {
  allocateArticles,
  HOME_SECTION_LIMITS,
} from "@/lib/home-article-allocation";
import { getHomeFootballPolls } from "@/lib/home-rankings";
import { sanityFetchPage } from "@/lib/sanity-fetch";

const footballDivisions = [
  {
    key: "fcs",
    division: "Football Championship Subdivision",
    title: "Division I FCS Football",
    href: "/college/football/news/fcs",
    badge: "FCS",
    layout: "grid-2-plus-horizontal" as const,
    description:
      "The latest news, scores, rankings, and analysis from NCAA Division I Football Championship Subdivision (FCS) — covering the Missouri Valley, CAA, Big South, and more.",
  },
  {
    key: "fbs",
    division: "Football Bowl Subdivision",
    title: "Division I FBS Football",
    href: "/college/football/news/fbs",
    badge: "FBS",
    layout: "grid-3" as const,
    description:
      "Breaking news, recruiting updates, and game analysis from NCAA Division I Football Bowl Subdivision (FBS) programs — SEC, Big Ten, Big 12, ACC, Pac-12, and more.",
  },
  {
    key: "d2",
    division: "D2",
    title: "Division II Football",
    href: "/college/football/news/d2",
    layout: "grid-2-plus-horizontal" as const,
    description:
      "Coverage of NCAA Division II football — scores, standings, playoff updates, and player news from conferences like the GLIAC, MIAA, RMAC, and SIAC.",
  },
  {
    key: "d3",
    division: "D3",
    title: "Division III Football",
    href: "/college/football/news/d3",
    layout: "grid-3" as const,
    description:
      "News and highlights from NCAA Division III football — student-athlete stories, playoff results, and program updates from conferences like the NESCAC, CCIW, and UAA.",
  },
];

const sectionOrder = ["fcs", "fbs", "d2", "d3"] as const;

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
  const { perspective, stega } = await getDynamicFetchOptions();

  return <CachedHomePage perspective={perspective} stega={stega} />;
}

export async function CachedHomePage({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";

  const [
    { data: megaboardArticles },
    { data: collegeSportsArticles },
    { data: recruitingArticles },
    { data: transferArticles },
    { data: authors },
    settings,
    footballPolls,
  ] = await Promise.all([
    sanityFetchPage({
      query: queryMegaboardArticles,
      perspective,
      stega,
    }),
    sanityFetchPage({
      query: queryLatestArticles,
      perspective,
      stega,
    }),
    sanityFetchPage({
      query: queryHomePostsByStoryType,
      params: { storyType: "recruiting" },
      perspective,
      stega,
    }),
    sanityFetchPage({
      query: queryHomePostsByStoryType,
      params: { storyType: "transfer" },
      perspective,
      stega,
    }),
    sanityFetchPage({
      query: queryHomepageTeamAuthors,
      perspective,
      stega,
    }),
    fetchGlobalSeoSettings(perspective),
    getHomeFootballPolls(),
  ]);

  const usedArticleIds = new Set<string>();

  const megaboardPosts = allocateArticles(
    megaboardArticles,
    usedArticleIds,
    HOME_SECTION_LIMITS.megaboard,
  );

  const collegeSportsPosts = allocateArticles(
    collegeSportsArticles,
    usedArticleIds,
    HOME_SECTION_LIMITS.collegeSports,
  );

  const recruitingPosts = allocateArticles(
    recruitingArticles,
    usedArticleIds,
    HOME_SECTION_LIMITS.recruiting,
  );

  const transferPosts = allocateArticles(
    transferArticles,
    usedArticleIds,
    HOME_SECTION_LIMITS.transfer,
  );

  const excludedArticleIds = [...usedArticleIds];

  const footballDivisionResults = await Promise.all(
    footballDivisions.map(({ division }) =>
      sanityFetchPage({
        query: queryLatestCollegeSportsArticles,
        params: {
          division,
          sport: "Football",
          articleIds: excludedArticleIds,
        },
        perspective,
        stega,
      }),
    ),
  );

  const divisionArticleLimit = (
    layout: (typeof footballDivisions)[number]["layout"],
  ) => {
    if (layout === "grid-3") return HOME_SECTION_LIMITS.grid3;
    if (layout === "grid-2-plus-horizontal") {
      return HOME_SECTION_LIMITS.grid2PlusHorizontal;
    }
    return HOME_SECTION_LIMITS.grid2;
  };

  const divisionsWithArticles = footballDivisions.map((division, index) => ({
    ...division,
    articles: allocateArticles(
      footballDivisionResults[index]?.data,
      usedArticleIds,
      divisionArticleLimit(division.layout),
    ),
  }));

  const { data: midMajorBasketballArticles } = await sanityFetchPage({
    query: queryLatestCollegeSportsArticles,
    params: {
      division: "Mid-Major",
      sport: "Men's Basketball",
      articleIds: [...usedArticleIds],
    },
    perspective,
    stega,
  });

  const midMajorPosts = allocateArticles(
    midMajorBasketballArticles,
    usedArticleIds,
    HOME_SECTION_LIMITS.grid2PlusHorizontal,
  );

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
    dateModified: megaboardPosts[0]?.publishedAt || new Date().toISOString(),
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
      <Megaboard articles={megaboardPosts} />

      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <HomeNewsSection
              title="College Sports"
              href="/college/news"
              articles={collegeSportsPosts}
            />

            <HomeNewsSection
              title="Recruiting"
              href="/recruiting"
              badge="HOT"
              articles={recruitingPosts}
              layout="grid-3"
            />

            <HomeNewsSection
              title="Transfer Portal"
              href="/transfer-portal/news"
              badge="NEW"
              articles={transferPosts}
            />

            {sectionOrder.map((key) => {
              const section = divisionsWithArticles.find((d) => d.key === key);
              if (!section?.articles.length) return null;

              return (
                <HomeNewsSection
                  key={section.key}
                  title={section.title}
                  href={section.href}
                  badge={section.badge}
                  description={section.description}
                  articles={section.articles}
                  layout={section.layout}
                  sectionId={`section-${section.key}-football`}
                />
              );
            })}

            <HomeNewsSection
              title="Division I Mid-Major Men's Basketball"
              href="/college/mens-basketball/news/mid-major"
              description="Mid-major men's basketball coverage — recruiting, transfer portal moves, upsets, and deep-dive analysis from conferences like the MWC, A-10, WCC, American, and MAC."
              articles={midMajorPosts}
              layout="grid-2-plus-horizontal"
              sectionId="section-mid-major-basketball"
            />
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <Top25Widget sportSlug="football" polls={footballPolls} />
            <OurTeamWidget authors={authors} />

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-black tracking-tight uppercase">
                  Newsletter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">
                  Get the latest college sports news delivered to your inbox.
                </p>
                <NewsletterForm />
              </CardContent>
            </Card>

            <div
              className="flex h-[250px] items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground"
              aria-hidden="true"
            >
              Advertisement
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
