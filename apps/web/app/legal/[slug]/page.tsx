import {
  type DynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@redshirt-sports/sanity/live";
import {
  queryLegalDocumentBySlug,
  queryLegalDocumentPaths,
} from "@redshirt-sports/sanity/queries";
import { format, parseISO } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { PortableTextBlock } from "next-sanity";
import type { WebPage, WithContext } from "schema-dts";

import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import { getLegalHeadings } from "@/components/legal/headings";
import { LegalBody } from "@/components/legal/legal-body";
import {
  LegalMobileTableOfContents,
  LegalSidebar,
} from "@/components/legal/legal-sidebar";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getBaseUrl } from "@/lib/get-base-url";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";

export async function generateStaticParams() {
  const { data } = await sanityFetchStaticParams({
    query: queryLegalDocumentPaths,
  });
  return data?.map(({ slug }) => ({ slug })) ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { perspective } = PUBLISHED_FETCH_OPTIONS;
  const { data } = await sanityFetchMetadata({
    query: queryLegalDocumentBySlug,
    params: { slug },
    perspective,
  });

  if (!data) {
    notFound();
  }

  return getPageMetadata(
    {
      title: data.title,
      description: data.summary ?? undefined,
      slug: `/legal/${slug}`,
    },
    perspective,
  );
}

export default async function LegalDocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return draftAwareParamsPage(params, null, renderLegalDocumentPage);
}

/** Sanity `date` fields are calendar dates, so format them without a timezone shift. */
function LegalDate({ date }: { date: string }) {
  return <time dateTime={date}>{format(parseISO(date), "MMMM d, yyyy")}</time>;
}

async function renderLegalDocumentPage(
  { slug }: { slug: string },
  { perspective, stega }: DynamicFetchOptions,
) {
  "use cache";
  const { data } = await sanityFetchPage({
    query: queryLegalDocumentBySlug,
    params: { slug },
    perspective,
    stega,
  });

  if (!data) {
    notFound();
  }

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/legal/${slug}`;
  const body = data.body as PortableTextBlock[];
  const headings = getLegalHeadings(body);

  const jsonLd: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: data.title,
    description: data.summary ?? undefined,
    datePublished: data.effectiveDate ?? undefined,
    dateModified: data.lastUpdated ?? undefined,
    inLanguage: "en-US",
    isPartOf: { "@type": "WebSite", "@id": websiteId },
    publisher: { "@type": "Organization", "@id": organizationId },
  };

  return (
    <>
      <JsonLdScript data={jsonLd} id={`legal-${slug}-json-ld`} />
      <article className="container pb-12">
        <header className="border-b pt-6 pb-8 md:pt-10">
          <p className="text-brand text-sm font-semibold">Legal</p>
          <h1 className="headline mt-2 text-4xl text-balance md:text-5xl">
            {data.title}
          </h1>
          {data.summary && (
            <p className="text-muted-foreground mt-4 max-w-3xl text-lg text-pretty">
              {data.summary}
            </p>
          )}
          {data.effectiveDate && (
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Effective</dt>
                <dd className="font-medium">
                  <LegalDate date={data.effectiveDate} />
                </dd>
              </div>
              {data.lastUpdated !== data.effectiveDate && (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Last updated</dt>
                  <dd className="font-medium">
                    <LegalDate date={data.lastUpdated} />
                  </dd>
                </div>
              )}
            </dl>
          )}
        </header>
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-20">
          <div className="min-w-0 space-y-8">
            <LegalMobileTableOfContents headings={headings} />
            <LegalBody body={body} className="max-w-3xl" />
          </div>
          <LegalSidebar
            headings={headings}
            otherDocuments={data.otherDocuments}
          />
        </div>
      </article>
    </>
  );
}
