import type { AdPlacementId } from "@redshirt-sports/sanity/ad-placements";
import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";
import { connection } from "next/server";
import { Suspense } from "react";

import { AdSlot } from "@/components/ad-slot";
import { loadAdvertisement } from "@/lib/advertisement";

type LiveAdSlotProps = {
  placement: AdPlacementId;
  /** Sports this page is about. Empty shows only sponsorships not limited to a sport. */
  sportSlugs?: string[];
  fetchOptions: DynamicFetchOptions;
  className?: string;
};

/**
 * A sponsorship placement, chosen on each request instead of being written
 * into the page's static shell. A flight starts and ends on its dates, and
 * editing a sponsorship rewrites no cached pages.
 *
 * The fallback is empty because most placements are unsold, and reserving the
 * creative's box would leave a hole on every page that has none.
 */
export function LiveAdSlot(props: LiveAdSlotProps) {
  return (
    <Suspense fallback={null}>
      <RequestTimeAdSlot {...props} />
    </Suspense>
  );
}

/** Exported for tests. Render `LiveAdSlot`, which supplies the boundary. */
export async function RequestTimeAdSlot({
  placement,
  sportSlugs,
  fetchOptions,
  className,
}: LiveAdSlotProps) {
  await connection();
  const creative = await loadAdvertisement({
    placement,
    sportSlugs,
    fetchOptions,
    now: new Date(),
  });

  return (
    <AdSlot placement={placement} creative={creative} className={className} />
  );
}
