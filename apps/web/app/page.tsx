import {
  type DynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
} from "@redshirt-sports/sanity/live";
import {
  queryHomePageData,
  queryLatestArticles,
  queryLatestCollegeSportsArticles,
  queryRecentContributors,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";

import HomePageSkeleton from "@/components/home/home-page-skeleton";
import { Megaboard } from "@/components/home/megaboard";
import {
  FeatureSection,
  GridSection,
  LeadListSection,
  SplitSection,
} from "@/components/home/sections";
import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import { OurTeamCard } from "@/components/our-team-card";
import { PageTransition } from "@/components/page-transition";
import { Top25Card, Top25CardSkeleton } from "@/components/rankings/top25-card";
import { SuspenseReveal } from "@/components/suspense-reveal";
import { draftAwarePage } from "@/lib/draft-cache";
import { getBaseUrl } from "@/lib/get-base-url";
import {
  fetchGlobalSeoSettings,
  getPageMetadata,
} from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";

/** Ordered by readership. */
const SPORT_SECTIONS = [
  {
    key: "fcs",
    sport: "Football",
    division: "Football Championship Subdivision",
    title: "FCS football",
    href: "/college/football/news/fcs",
    description:
      "News, analysis and rankings from the Football Championship Subdivision, from the Missouri Valley and CAA to the Big Sky, SWAC and Pioneer League.",
  },
  {
    key: "fbs",
    sport: "Football",
    division: "Football Bowl Subdivision",
    title: "FBS football",
    href: "/college/football/news/fbs",
    description:
      "Bowl projections, conference realignment and game coverage from the Football Bowl Subdivision.",
  },
  {
    key: "d2",
    sport: "Football",
    division: "D2",
    title: "Division II football",
    href: "/college/football/news/d2",
    description:
      "Scores, playoff races and stories from Division II programs across the country.",
  },
  {
    key: "d3",
    sport: "Football",
    division: "D3",
    title: "Division III football",
    href: "/college/football/news/d3",
    description:
      "Student-athlete stories, rivalries and history from Division III football.",
  },
  {
    key: "mid-major",
    sport: "Men's Basketball",
    division: "Mid-Major",
    title: "Mid-major men's basketball",
    href: "/college/mens-basketball/news/mid-major",
    description:
      "Upsets, transfers and March storylines from mid-major men's basketball.",
  },
] as const;

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
  return draftAwarePage(<HomePageSkeleton />, renderHomePage);
}

/**
 * Not cached itself: the Sanity page data and the Postgres-backed Top 25
 * card are sibling cache scopes.
 */
async function renderHomePage(options: DynamicFetchOptions) {
  const data = await getCachedHomePageData(options);
  return (
    <HomePageView
      {...data}
      top25={
        <SuspenseReveal fallback={<Top25CardSkeleton />}>
          <Top25Card />
        </SuspenseReveal>
      }
    />
  );
}

async function getCachedHomePageData({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";

  const [
    { data: homePageData },
    { data: latestArticles },
    { data: authors },
    settings,
  ] = await Promise.all([
    sanityFetchPage({ query: queryHomePageData, perspective, stega }),
    sanityFetchPage({ query: queryLatestArticles, perspective, stega }),
    sanityFetchPage({ query: queryRecentContributors, perspective, stega }),
    fetchGlobalSeoSettings(perspective),
  ]);

  const articleIds = [...homePageData, ...latestArticles].map(
    (article) => article._id,
  );

  const sectionResults = await Promise.all(
    SPORT_SECTIONS.map(({ sport, division }) =>
      sanityFetchPage({
        query: queryLatestCollegeSportsArticles,
        params: { division, sport, articleIds },
        perspective,
        stega,
      }),
    ),
  );

  const sections = SPORT_SECTIONS.map((section, index) => ({
    ...section,
    articles: sectionResults[index]?.data ?? [],
  }));

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

  return {
    webPageJson,
    homePageData,
    latestArticles,
    authors,
    sections,
  };
}

type HomePageData = Awaited<ReturnType<typeof getCachedHomePageData>>;
type Section = HomePageData["sections"][number];

function SportSection({ section }: { section: Section }) {
  const props = {
    id: `section-${section.key}`,
    title: section.title,
    href: section.href,
    description: section.description,
    articles: section.articles,
  };

  switch (section.key) {
    case "fcs":
      return <FeatureSection {...props} />;
    case "fbs":
      return <GridSection {...props} columns={3} />;
    case "d2":
      return <SplitSection {...props} />;
    case "d3":
      return <LeadListSection {...props} />;
    default:
      return <SplitSection {...props} />;
  }
}

function HomePageView({
  webPageJson,
  homePageData,
  latestArticles,
  authors,
  sections,
  top25,
}: HomePageData & { top25: React.ReactNode }) {
  return (
    <PageTransition>
      <div className="container flex flex-col gap-8 py-6">
        <JsonLdScript data={webPageJson} id="home-webpage-json-ld" />
        <Megaboard articles={homePageData} />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-10 lg:col-span-8">
            <GridSection
              id="section-latest"
              title="Latest news"
              href="/college/news"
              articles={latestArticles}
            />
            {sections.map((section) => (
              <SportSection key={section.key} section={section} />
            ))}
          </div>
          <aside className="flex flex-col gap-6 lg:col-span-4">
            {top25}
            <OurTeamCard authors={authors} />
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}
