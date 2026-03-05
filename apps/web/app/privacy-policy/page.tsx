import { sanityFetch } from "@redshirt-sports/sanity/live";
import { privacyPolicyQuery } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";

import FormatDate from "@/components/format-date";
import { JsonLdScript, websiteId } from "@/components/json-ld";
import PageHeader from "@/components/page-header";
import { RichText } from "@/components/rich-text";
import { getBaseUrl } from "@/lib/get-base-url";
import { getSEOMetadata } from "@/lib/seo";

async function fetchPrivacyPolicy() {
  return await sanityFetch({
    query: privacyPolicyQuery,
  });
}

export async function generateMetadata(): Promise<Metadata> {
  return getSEOMetadata({
    title: "Privacy Policy",
    description: `Review ${process.env.NEXT_PUBLIC_APP_NAME}' Privacy Policy to see how we handle your data, ensure security, and maintain your privacy.`,
    slug: "/privacy-policy",
  });
}

const baseUrl = getBaseUrl();

const privacyPolicyJsonLd: WithContext<WebPage> = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  url: `${baseUrl}/privacy-policy`,
  name: "Privacy Policy",
  description: `Review ${process.env.NEXT_PUBLIC_APP_NAME}' Privacy Policy to see how we handle your data, ensure security, and maintain your privacy.`,
  isPartOf: {
    "@type": "WebSite",
    "@id": websiteId,
  },
  inLanguage: "en-US",
  breadcrumb: {
    "@type": "BreadcrumbList",
    "@id": `${baseUrl}/privacy-policy#breadcrumb`,
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
        name: "Privacy Policy",
        item: `${baseUrl}/privacy-policy`,
      },
    ],
  },
};

export default async function PrivacyPolicyPage() {
  const { data: privacyPolicy } = await fetchPrivacyPolicy();

  return (
    <>
      <JsonLdScript data={privacyPolicyJsonLd} id="privacy-policy-json-ld" />
      {privacyPolicy && (
        <>
          <PageHeader
            title="Privacy Policy"
            subtitle={
              <p className="mt-4 text-lg font-normal lg:text-xl">
                Last updated on{" "}
                <FormatDate dateString={privacyPolicy._updatedAt} />
              </p>
            }
          />
          <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
            <RichText richText={privacyPolicy.body} />
          </section>
        </>
      )}
    </>
  );
}
