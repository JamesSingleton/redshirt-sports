import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import type { Movement } from "@/lib/rankings-movement";

export function RankMovement({ movement }: { movement: Movement }) {
  switch (movement.kind) {
    case "up":
      return (
        <span
          className="inline-flex items-center gap-0.5 text-emerald-600 tabular-nums dark:text-emerald-400"
          aria-label={`up ${movement.delta}`}
        >
          <ArrowUp className="size-3.5" aria-hidden />
          <span className="text-xs font-semibold">{movement.delta}</span>
        </span>
      );
    case "down":
      return (
        <span
          className="text-brand inline-flex items-center gap-0.5 tabular-nums"
          aria-label={`down ${movement.delta}`}
        >
          <ArrowDown className="size-3.5" aria-hidden />
          <span className="text-xs font-semibold">{movement.delta}</span>
        </span>
      );
    case "same":
      return (
        <span
          className="text-muted-foreground inline-flex"
          aria-label="unchanged"
        >
          <Minus className="size-3.5" aria-hidden />
        </span>
      );
    case "nr":
      return (
        <span
          className="text-muted-foreground text-xs font-semibold"
          aria-label="new to rankings"
        >
          NR
        </span>
      );
  }
}
