import { cn } from "@redshirt-sports/ui/lib/utils";

type AdSlotProps = {
  width: number;
  height: number;
  className?: string;
};

export function AdSlot({ width, height, className }: AdSlotProps) {
  return (
    <div
      className={cn(
        "ad-slot flex items-center justify-center rounded-md border border-dashed text-[10px] font-semibold uppercase tracking-widest text-muted-foreground",
        className,
      )}
      style={{ minHeight: height, maxWidth: width, width: "100%" }}
      aria-label="Advertisement"
    >
      Ad · {width}×{height} reserved
    </div>
  );
}
