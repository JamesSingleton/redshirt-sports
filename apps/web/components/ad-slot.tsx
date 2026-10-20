import { cn } from "@redshirt-sports/ui/lib/utils";

const AD_SLOT_SIZES = {
  leaderboard: {
    className: "min-h-[90px] max-w-[970px]",
    label: "Ad · 970×90 desktop / 320×100 mobile · space reserved",
  },
  rectangle: {
    className: "min-h-[250px] max-w-[300px]",
    label: "Ad · 300×250 reserved",
  },
} as const;

export type AdSlotSize = keyof typeof AD_SLOT_SIZES;

/**
 * Reserved-space advertisement placeholder. Fixed minimum height keeps the
 * page from shifting (no CLS) when a real ad unit is wired in later.
 */
export function AdSlot({
  size,
  className,
}: {
  size: AdSlotSize;
  className?: string;
}) {
  const config = AD_SLOT_SIZES[size];

  return (
    <div
      className={cn(
        "ad-slot text-muted-foreground flex w-full items-center justify-center rounded-md border border-dashed text-center text-[10px] font-semibold tracking-widest uppercase",
        config.className,
        className,
      )}
      aria-label="Advertisement"
    >
      {config.label}
    </div>
  );
}

export function LeaderboardAd({ className }: { className?: string }) {
  return (
    <div className={cn("my-8 flex justify-center", className)}>
      <AdSlot size="leaderboard" />
    </div>
  );
}
