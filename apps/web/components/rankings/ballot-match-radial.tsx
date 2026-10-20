"use client";

import { cn } from "@redshirt-sports/ui/lib/utils";

/** Small match-% ring (ShadCN radial-text style, SVG for accurate 0–100 arc). */
const SIZE = {
  sm: {
    box: "size-9",
    radius: 14,
    stroke: 3,
    percentClass: "text-[11px] font-bold tabular",
    labelClass: "text-[8px] text-muted-foreground",
    showLabel: false,
  },
  md: {
    box: "size-14 sm:size-16",
    radius: 26,
    stroke: 5,
    percentClass: "font-display text-base font-extrabold tabular sm:text-lg",
    labelClass: "text-[10px] text-muted-foreground",
    showLabel: true,
  },
} as const;

export function BallotMatchRadial({
  percent,
  size = "md",
  className,
}: {
  percent: number;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const spec = SIZE[size];
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const center = spec.radius + spec.stroke;
  const viewSize = center * 2;
  const circumference = 2 * Math.PI * spec.radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div
      className={cn("relative shrink-0", spec.box, className)}
      role="img"
      aria-label={`Ballot match ${clamped} percent to the published Top 25`}
      title="Match % — how close this ballot's order was to the published Top 25"
    >
      <svg
        viewBox={`0 0 ${viewSize} ${viewSize}`}
        className="h-full w-full"
        aria-hidden
      >
        <g transform={`rotate(-90 ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={spec.radius}
            fill="none"
            className="stroke-muted"
            strokeWidth={spec.stroke}
          />
          <circle
            cx={center}
            cy={center}
            r={spec.radius}
            fill="none"
            className="stroke-primary"
            strokeWidth={spec.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </g>
      </svg>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-none",
          spec.showLabel && "gap-0.5",
        )}
      >
        <span className={spec.percentClass}>{clamped}%</span>
        {spec.showLabel ? <span className={spec.labelClass}>Match</span> : null}
      </div>
    </div>
  );
}
