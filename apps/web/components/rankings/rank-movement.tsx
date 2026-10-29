import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import type { Movement } from "@/lib/rankings-movement";

export function RankMovement({ movement }: { movement: Movement }) {
  switch (movement.kind) {
    case "up":
      return (
        <span
          className="inline-flex items-center gap-0.5 text-sm font-bold text-up tabular-nums"
          role="img"
          aria-label={`Up ${movement.delta}`}
        >
          <ArrowUp className="size-3.5 shrink-0" aria-hidden />
          {movement.delta}
        </span>
      );
    case "down":
      return (
        <span
          className="inline-flex items-center gap-0.5 text-sm font-bold text-down tabular-nums"
          role="img"
          aria-label={`Down ${movement.delta}`}
        >
          <ArrowDown className="size-3.5 shrink-0" aria-hidden />
          {movement.delta}
        </span>
      );
    case "same":
      return (
        <span
          className="inline-flex items-center text-muted-foreground"
          role="img"
          aria-label="No change"
        >
          <Minus className="size-3.5 shrink-0" aria-hidden />
        </span>
      );
    case "nr":
      return (
        <span
          className="inline-flex items-center gap-0.5 text-sm font-bold text-new"
          role="img"
          aria-label="Newly ranked"
        >
          NEW
        </span>
      );
  }
}
