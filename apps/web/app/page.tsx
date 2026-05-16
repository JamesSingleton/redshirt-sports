import { sanityFetch } from "@redshirt-sports/sanity/live";
import {
  queryHomePageData,
  queryLatestArticles,
  queryLatestCollegeSportsArticles,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";

import ArticleCard from "@/components/article-card";
import ArticleSection from "@/components/article-section";
import Hero from "@/components/home/hero";
import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import { SectionHeader } from "@/components/section-header";
import { getBaseUrl } from "@/lib/get-base-url";
import { getSEOMetadata } from "@/lib/seo";

async function fetchHomePageData() {
  return await sanityFetch({
    query: queryHomePageData,
  });
}

async function fetchLatestArticles() {
  return await sanityFetch({
    query: queryLatestArticles,
  });
}

async function fetchLatestCollegeSportsArticles({
  division,
  sport,
  articleIds,
}: {
  division: string;
  sport: string;
  articleIds: string[];
}) {
  return await sanityFetch({
    query: queryLatestCollegeSportsArticles,
    params: { division, sport, articleIds },
  });
}

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
  return getSEOMetadata();
}

export default async function HomePage() {
  const [{ data: homePageData }, { data: latestArticles }] = await Promise.all([
    fetchHomePageData(),
    fetchLatestArticles(),
  ]);

  const articleIds = [...homePageData, ...latestArticles].map(
    (article) => article._id,
  );

  const collegeSportsResults = await Promise.all(
    divisions.map(({ division }) =>
      fetchLatestCollegeSportsArticles({
        division,
        sport: "Football",
        articleIds,
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
      <Hero heroPosts={homePageData} />
      {latestArticles.length > 0 && (
        <section className="pb-12 sm:pb-16 lg:pb-20">
          <div className="container">
            <SectionHeader title="Latest News" viewAllHref="/college/news" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {latestArticles?.map((article, index) => (
                <ArticleCard
                  title={article.title}
                  date={article.publishedAt}
                  image={article.mainImage}
                  slug={article.slug}
                  key={article._id}
                  author={article.authors[0]!.name}
                  division={index % 4 === 0 ? "fbs" : index % 4 === 1 ? "fcs" : index % 4 === 2 ? "d2" : "d3"}
                />
              ))}
            </div>
          </div>
        </section>
      )}
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
            division={section.key}
          />
        );
      })}
    </>
  );
}
