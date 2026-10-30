import {
  type DynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
} from "@redshirt-sports/sanity/live";
import { querySettingsData } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import type { ContactPage as ContactPageJsonLd, WithContext } from "schema-dts";

import { ContactPageContent } from "@/components/contact/contact-page-content";
import { JsonLdScript, websiteId } from "@/components/json-ld";
import { draftAwarePage } from "@/lib/draft-cache";
import { getBaseUrl, getSiteEmailDomain } from "@/lib/get-base-url";
import {
  fetchGlobalSeoSettings,
  getPageMetadata,
} from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = PUBLISHED_FETCH_OPTIONS;
  return getPageMetadata(
    {
      title: "Contact",
      description: `Contact ${process.env.NEXT_PUBLIC_APP_NAME} for tips, corrections, advertising, or poll questions.`,
      slug: "/contact",
    },
    perspective,
  );
}

const baseUrl = getBaseUrl();

const contactPageJsonLd: WithContext<ContactPageJsonLd> = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": `${baseUrl}/contact`,
  name: "Contact",
  description: `Contact ${process.env.NEXT_PUBLIC_APP_NAME}.`,
  url: `${baseUrl}/contact`,
  isPartOf: {
    "@type": "WebSite",
    "@id": websiteId,
  },
  inLanguage: "en-US",
  breadcrumb: {
    "@type": "BreadcrumbList",
    "@id": `${baseUrl}/contact#breadcrumb`,
    name: "Contact Breadcrumbs",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${baseUrl}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Contact",
        item: `${baseUrl}/contact`,
      },
    ],
  },
};

export default async function ContactPage() {
  return draftAwarePage(null, renderContactPage);
}

async function renderContactPage({ perspective, stega }: DynamicFetchOptions) {
  "use cache";
  const [{ data: settings }, seoSettings] = await Promise.all([
    sanityFetchPage({
      query: querySettingsData,
      perspective,
      stega,
    }),
    fetchGlobalSeoSettings(perspective),
  ]);

  const emailDomain = getSiteEmailDomain();
  const contactEmail =
    settings?.contactEmail?.trim() || `contact@${emailDomain}`;

  return (
    <>
      <JsonLdScript data={contactPageJsonLd} id="contact-page-json-ld" />
      <ContactPageContent
        contactEmail={contactEmail}
        socialLinks={seoSettings?.socialLinks ?? null}
      />
    </>
  );
}
