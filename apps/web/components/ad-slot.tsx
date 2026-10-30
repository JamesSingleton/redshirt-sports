import {
  type AdPlacementId,
  getAdPlacement,
} from "@redshirt-sports/sanity/ad-placements";
import { cn } from "@redshirt-sports/ui/lib/utils";

import CustomImage from "@/components/sanity-image";
import type { AdvertisementCreative } from "@/lib/advertisement";

type AdSlotProps = {
  placement: AdPlacementId;
  creative: AdvertisementCreative | null;
  className?: string;
};

export function AdSlot({ placement, creative, className }: AdSlotProps) {
  if (!creative) {
    return null;
  }

  const spec = getAdPlacement(placement);
  const external =
    creative.href.startsWith("http://") || creative.href.startsWith("https://");
  const newTab = external || creative.openInNewTab;
  const rel =
    [external ? "sponsored" : "", newTab ? "noopener noreferrer" : ""]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <aside
      className={cn("mx-auto w-full", className)}
      style={{ maxWidth: spec.width }}
    >
      <p className="mb-1 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Advertisement
      </p>
      <a href={creative.href} target={newTab ? "_blank" : undefined} rel={rel}>
        <CustomImage
          image={creative.image}
          alt={creative.image.alt ?? `${creative.sponsorName} advertisement`}
          width={spec.width}
          height={spec.height}
          className="h-auto w-full object-contain"
          sizes={spec.sizes}
        />
      </a>
    </aside>
  );
}
