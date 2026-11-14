"use client";

import { ChevronDown } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

/**
 * Older journey stops, hidden behind "Show all N stops" so a five-school
 * career doesn't push everything else down. The stops render on the server.
 */
export function JourneyMore({
  total,
  earlier,
  children,
}: {
  total: number;
  /** Names of the hidden stops, oldest last. */
  earlier: string[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const revealed = useRef<HTMLLIElement>(null);
  // The button goes away when clicked; keep keyboard focus where the new
  // stops start instead of dropping it to the top of the page.
  useEffect(() => {
    if (open) revealed.current?.focus();
  }, [open]);
  if (open) {
    return (
      <>
        <li ref={revealed} tabIndex={-1} className="sr-only">
          Showing all {total} stops
        </li>
        {children}
      </>
    );
  }
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-muted/40 hover:bg-accent/40 mt-1 flex w-full items-center gap-3 rounded-lg border border-dashed px-3 py-2 text-left text-sm"
      >
        <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold">
          +{earlier.length}
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-primary block font-semibold">
            Show all {total} stops
          </span>
          <span className="text-muted-foreground block truncate text-xs">
            Earlier: {earlier.join(", ")}
          </span>
        </span>
        <ChevronDown className="text-muted-foreground size-4" aria-hidden />
      </button>
    </li>
  );
}
