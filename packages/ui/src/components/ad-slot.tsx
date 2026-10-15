import { cn } from "@redshirt-sports/ui/lib/utils";

export const AD_SLOT_MIN_HEIGHT = {
  leaderboard: "min-h-[100px] md:min-h-[90px]",
  rectangle: "min-h-[250px]",
} as const;

export type AdSlotSize = keyof typeof AD_SLOT_MIN_HEIGHT;

export function AdSlot({
  size,
  label = "Advertisement",
}: {
  size: AdSlotSize;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "ad-slot flex items-center justify-center rounded-md text-muted-foreground text-xs",
        AD_SLOT_MIN_HEIGHT[size],
      )}
      role="complementary"
      aria-label={label}
    >
      {label}
    </div>
  );
}
