"use client";

import { Badge } from "@redshirt-sports/ui/components/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@redshirt-sports/ui/components/tooltip";

export function BallotMatchHeader() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="cursor-help underline decoration-dotted underline-offset-2"
        >
          Match %
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        How close this ballot's rank order was to the final Top 25.
      </TooltipContent>
    </Tooltip>
  );
}

export function BallotMatchBadge({ matchPercent }: { matchPercent: number }) {
  return (
    <Badge
      variant="secondary"
      aria-label={`Ballot match ${matchPercent} percent`}
    >
      {matchPercent}%
    </Badge>
  );
}
