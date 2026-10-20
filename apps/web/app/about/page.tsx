import {
  type DynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
} from "@redshirt-sports/sanity/live";
import { authorsListNotArchived } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import type { AboutPage as AboutPageSchema, WithContext } from "schema-dts";

import { AboutPageContent } from "@/components/about/about-page-content";
import { JsonLdScript, websiteId } from "@/components/json-ld";
import { draftAwarePage } from "@/lib/draft-cache";
import { getBaseUrl } from "@/lib/get-base-url";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = PUBLISHED_FETCH_OPTIONS;
  return getPageMetadata(
    {
      title: "About",
      description: `Meet the team at ${process.env.NEXT_PUBLIC_APP_NAME}. Independent coverage of college sports at every level, plus transparent Top 25 rankings.`,
      slug: "/about",
    },
    perspective,
  );
}

const aboutPageJsonLd: WithContext<AboutPageSchema> = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${getBaseUrl()}/about`,
  url: `${getBaseUrl()}/about`,
  description: `Meet the team at ${process.env.NEXT_PUBLIC_APP_NAME}.`,
  isPartOf: {
    "@type": "WebSite",
    "@id": websiteId,
  },
  inLanguage: "en-US",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${getBaseUrl()}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "About",
        item: `${getBaseUrl()}/about`,
      },
    ],
  },
};

export default async function AboutPage() {
  return draftAwarePage(null, renderAboutPage);
}

async function renderAboutPage({ perspective, stega }: DynamicFetchOptions) {
  "use cache";
  const { data: authors } = await sanityFetchPage({
    query: authorsListNotArchived,
    perspective,
    stega,
  });

  return (
    <>
      <JsonLdScript data={aboutPageJsonLd} id="about-page-json-ld" />
      <AboutPageContent authors={authors ?? []} />
    </>
  );
}
