import { getDynamicFetchOptions } from "@redshirt-sports/sanity/live";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  PORTAL_HUB_DESCRIPTION,
  PORTAL_HUB_PATH,
  PORTAL_HUB_TITLE,
  PortalHub,
  PortalHubSkeleton,
} from "@/components/portal/hub-page";
import { draftAwareSearchParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { portalIsPublic } from "@/lib/portal-data";

type SearchParams = Promise<{ page?: string }>;

/** `?page=n` as a page number; anything else is page 1. */
function pageNumber(page: string | undefined) {
  return Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  if (!portalIsPublic()) return {};
  const pageIndex = pageNumber((await searchParams).page);
  const { perspective } = await getDynamicFetchOptions();
  return getPageMetadata(
    {
      title:
        pageIndex > 1
          ? `${PORTAL_HUB_TITLE} - Page ${pageIndex}`
          : PORTAL_HUB_TITLE,
      description: PORTAL_HUB_DESCRIPTION,
      slug:
        pageIndex > 1
          ? `${PORTAL_HUB_PATH}?page=${pageIndex}`
          : PORTAL_HUB_PATH,
    },
    perspective,
  );
}

export default function TransferPortalHubPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Static: the switch is read at build time, so a hidden portal is a real 404.
  if (!portalIsPublic()) notFound();
  return draftAwareSearchParamsPage(
    searchParams,
    <PortalHubSkeleton />,
    ({ page }, options) =>
      PortalHub({ pageIndex: pageNumber(page), ...options }),
  );
}
