import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";
import { type ReactNode, Suspense } from "react";

import { resolveDynamicFetchOptions } from "@/lib/resolve-dynamic-fetch-options";

async function DraftAwareRender({
  render,
}: {
  render: (options: DynamicFetchOptions) => Promise<ReactNode>;
}) {
  return render(await resolveDynamicFetchOptions());
}

/** Layer 1 branch: Suspense around draft/runtime reads so Cache Components can prerender a shell. */
export function draftAwarePage(
  fallback: ReactNode,
  render: (options: DynamicFetchOptions) => Promise<ReactNode>,
) {
  return (
    <Suspense fallback={fallback}>
      <DraftAwareRender render={render} />
    </Suspense>
  );
}

async function DraftAwareParamsRender<P>({
  params,
  render,
}: {
  params: Promise<P>;
  render: (resolved: P, options: DynamicFetchOptions) => Promise<ReactNode>;
}) {
  const [options, resolved] = await Promise.all([
    resolveDynamicFetchOptions(),
    params,
  ]);

  return render(resolved, options);
}

/**
 * Layer 1 branch for routes with dynamic `params`.
 * This Suspense is required so `draftMode()` can prerender a shell. It is
 * the nearest Suspense boundary during client navigations. When a segment has
 * `loading.tsx`, pass the same fallback component exported from that segment's
 * `loading.tsx` (see `lib/news-archive/page-loading.tsx`) so the skeleton
 * stays visible if the segment shell streams before async work finishes.
 * Passing `null` here leaves a blank gap after `loading.tsx` unmounts. Routes
 * without `loading.tsx` should pass an explicit fallback (e.g. home). Avoid a root
 * `app/loading.tsx` — it can show while navigating to unrelated routes.
 */
export function draftAwareParamsPage<P>(
  params: Promise<P>,
  fallback: ReactNode,
  render: (resolved: P, options: DynamicFetchOptions) => Promise<ReactNode>,
) {
  return (
    <Suspense fallback={fallback}>
      <DraftAwareParamsRender params={params} render={render} />
    </Suspense>
  );
}

async function DraftAwareSearchParamsRender<P>({
  searchParams,
  render,
}: {
  searchParams: Promise<P>;
  render: (resolved: P, options: DynamicFetchOptions) => Promise<ReactNode>;
}) {
  const [options, resolved] = await Promise.all([
    resolveDynamicFetchOptions(),
    searchParams,
  ]);

  return render(resolved, options);
}

/**
 * Layer 1 branch for routes with dynamic `searchParams` (no route `params`).
 * Resolves draft/runtime fetch options outside `"use cache"` scopes.
 */
export function draftAwareSearchParamsPage<P>(
  searchParams: Promise<P>,
  fallback: ReactNode,
  render: (resolved: P, options: DynamicFetchOptions) => Promise<ReactNode>,
) {
  return (
    <Suspense fallback={fallback}>
      <DraftAwareSearchParamsRender
        searchParams={searchParams}
        render={render}
      />
    </Suspense>
  );
}

async function SearchParamsDynamic({
  render,
}: {
  render: () => Promise<ReactNode>;
}) {
  return render();
}

/**
 * Suspense around searchParams only — no draft branch. Prefer
 * `draftAwareSearchParamsPage` when the render path uses Sanity perspective/stega.
 */
export function searchParamsPage(
  fallback: ReactNode,
  render: () => Promise<ReactNode>,
) {
  return (
    <Suspense fallback={fallback}>
      <SearchParamsDynamic render={render} />
    </Suspense>
  );
}
