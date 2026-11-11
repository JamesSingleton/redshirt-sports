import {
  cachedSanity,
  type DynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { queryBreakingNews } from "@redshirt-sports/sanity/queries";

import { BreakingNewsBar } from "@/components/breaking-news-bar";
import { resolveDynamicFetchOptions } from "@/lib/resolve-dynamic-fetch-options";

/** The breaking-news banner from the `breakingNews` singleton, if one is live. */
export async function CachedBreakingNewsServer({
  perspective,
  stega,
}: DynamicFetchOptions) {
  const { data } = await cachedSanity({
    query: queryBreakingNews,
    perspective,
    stega,
  });
  const article = data?.article;
  if (!data || !article?.slug || !article.title) return null;

  return (
    <BreakingNewsBar
      label={data.label}
      title={article.title}
      slug={article.slug}
      expiresAt={data.expiresAt}
    />
  );
}

export async function DraftAwareBreakingNews() {
  return <CachedBreakingNewsServer {...(await resolveDynamicFetchOptions())} />;
}
