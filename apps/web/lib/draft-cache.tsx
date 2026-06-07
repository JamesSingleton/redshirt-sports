import { draftMode } from "next/headers";
import { Suspense, type ReactNode } from "react";

import {
  getDynamicFetchOptions,
  type DynamicFetchOptions,
} from "@redshirt-sports/sanity/live";

async function DraftDynamic({
  render,
}: {
  render: (options: DynamicFetchOptions) => Promise<ReactNode>;
}) {
  const options = await getDynamicFetchOptions();
  return render(options);
}

/** Layer 1 branch: static shell in production, Suspense + dynamic fetch options in draft mode. */
export async function draftAwarePage(
  fallback: ReactNode,
  render: (options: DynamicFetchOptions) => Promise<ReactNode>,
) {
  const { isEnabled: isDraftMode } = await draftMode();
  if (isDraftMode) {
    return (
      <Suspense fallback={fallback}>
        <DraftDynamic render={render} />
      </Suspense>
    );
  }
  return render({ perspective: "published", stega: false });
}

async function DraftParamsDynamic<P>({
  params,
  render,
}: {
  params: Promise<P>;
  render: (resolved: P, options: DynamicFetchOptions) => Promise<ReactNode>;
}) {
  const [resolved, options] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);
  return render(resolved, options);
}

async function PublishedParamsDynamic<P>({
  params,
  render,
}: {
  params: Promise<P>;
  render: (resolved: P, options: DynamicFetchOptions) => Promise<ReactNode>;
}) {
  const resolved = await params;
  return render(resolved, { perspective: "published", stega: false });
}

/** Layer 1 branch for routes with dynamic `params`. */
export async function draftAwareParamsPage<P>(
  params: Promise<P>,
  fallback: ReactNode,
  render: (resolved: P, options: DynamicFetchOptions) => Promise<ReactNode>,
) {
  const { isEnabled: isDraftMode } = await draftMode();
  if (isDraftMode) {
    return (
      <Suspense fallback={fallback}>
        <DraftParamsDynamic params={params} render={render} />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={fallback}>
      <PublishedParamsDynamic params={params} render={render} />
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

/** For routes that always read searchParams or other dynamic APIs — no draftMode branch. */
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
