import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { draftMode } from "next/headers";
import { type ReactNode, Suspense } from "react";

async function DraftAwareRender({
  render,
}: {
  render: (options: DynamicFetchOptions) => Promise<ReactNode>;
}) {
  const { isEnabled: isDraftMode } = await draftMode();
  if (isDraftMode) {
    return render(await getDynamicFetchOptions());
  }
  return render({ perspective: "published", stega: false });
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
  const [{ isEnabled: isDraftMode }, resolved] = await Promise.all([
    draftMode(),
    params,
  ]);

  if (isDraftMode) {
    return render(resolved, await getDynamicFetchOptions());
  }

  return render(resolved, { perspective: "published", stega: false });
}

/** Layer 1 branch for routes with dynamic `params`. */
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
