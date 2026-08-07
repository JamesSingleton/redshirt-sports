import { ArrowDown, ArrowUp } from "lucide-react";

import type { Movement } from "@/lib/rankings-movement";

export function RankMovement({ movement }: { movement: Movement }) {
  switch (movement.kind) {
    case "up":
      return (
        <span
          className="inline-flex items-center text-emerald-600 dark:text-emerald-400"
          aria-label={`up ${movement.delta}`}
        >
          <ArrowUp className="size-3.5" aria-hidden />
          <span className="text-xs font-medium">{movement.delta}</span>
        </span>
      );
    case "down":
      return (
        <span
          className="inline-flex items-center text-red-600 dark:text-red-400"
          aria-label={`down ${movement.delta}`}
        >
          <ArrowDown className="size-3.5" aria-hidden />
          <span className="text-xs font-medium">{movement.delta}</span>
        </span>
      );
    case "same":
      return (
        <span className="text-muted-foreground text-xs" aria-label="unchanged">
          —
        </span>
      );
    case "nr":
      return (
        <span
          className="text-muted-foreground text-xs font-medium tracking-wide"
          aria-label="new to rankings"
        >
          NR
        </span>
      );
  }
}
