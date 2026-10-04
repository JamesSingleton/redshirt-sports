import type { PortalStatus } from "@redshirt-sports/db/transfer-portal-constants";
import { cn } from "@redshirt-sports/ui/lib/utils";

export function portalStatTotals(counts: Record<PortalStatus, number>) {
  return [
    { label: "In portal", value: counts.ENTERED },
    {
      label: "Committed",
      value: counts.COMMITTED + counts.SIGNED + counts.ENROLLED,
    },
    { label: "Withdrawn", value: counts.WITHDRAWN },
  ];
}

export function PortalStats({
  counts,
  className,
}: {
  counts: Record<PortalStatus, number>;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "bg-border grid grid-cols-3 gap-px overflow-hidden rounded-md border",
        className,
      )}
    >
      {portalStatTotals(counts).map((stat) => (
        <div key={stat.label} className="bg-card flex flex-col gap-1 p-4">
          <dt className="text-muted-foreground text-sm">{stat.label}</dt>
          <dd className="headline text-3xl tabular-nums">
            {stat.value.toLocaleString("en-US")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
