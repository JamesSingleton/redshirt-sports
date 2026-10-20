import { Minus } from "lucide-react";

import { RankMovement } from "@/components/rankings/rank-movement";

export function RankingsMovementLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <RankMovement movement={{ kind: "up", delta: 2 }} />
        moved up
      </span>
      <span className="flex items-center gap-1">
        <RankMovement movement={{ kind: "down", delta: 2 }} />
        moved down
      </span>
      <span className="flex items-center gap-1">
        <RankMovement movement={{ kind: "nr" }} />
        newly ranked
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-flex items-center text-muted-foreground" aria-hidden>
          <Minus className="size-3.5" />
        </span>
        unchanged
      </span>
    </div>
  );
}
