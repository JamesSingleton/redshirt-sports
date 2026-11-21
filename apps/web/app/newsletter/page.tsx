import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";
import { queryNewsletterPreview } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";

import { NewsletterPageContent } from "@/components/newsletter/newsletter-page-content";
import { draftAwarePage } from "@/lib/draft-cache";
import { getCachedPollOptions } from "@/lib/newsletter/topics";
import { sanityFetchPage } from "@/lib/sanity-fetch";

export const metadata: Metadata = {
  title: "Newsletter",
  description:
    "The Week in College Sports: every Redshirt Sports story from the week in your inbox Sunday morning, from FBS to Division III. Plus our Top 25, ratings and playoff projections.",
  alternates: { canonical: "/newsletter" },
};

export default async function NewsletterPage() {
  return draftAwarePage(
    <NewsletterPageContent posts={null} polls={[]} />,
    renderNewsletterPage,
  );
}

async function renderNewsletterPage({
  perspective,
  stega,
}: DynamicFetchOptions) {
  const [{ data }, polls] = await Promise.all([
    sanityFetchPage({ query: queryNewsletterPreview, perspective, stega }),
    getCachedPollOptions(),
  ]);
  return <NewsletterPageContent posts={data ?? []} polls={polls} />;
}
