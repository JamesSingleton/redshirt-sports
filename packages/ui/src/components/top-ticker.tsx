"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { useState } from "react";

export type TickerItem = {
  href: string;
  label: string;
};

export function TopTicker({ items }: { items: TickerItem[] }) {
  const [index, setIndex] = useState(0);
  const item = items[index];
  if (!item) return null;

  const step = (delta: number) => {
    setIndex((current) => (current + delta + items.length) % items.length);
  };

  return (
    <div className="flex h-9 items-center gap-3 bg-ink px-4 text-ink-foreground">
      <span className="kicker shrink-0">Top 25 & Top Stories</span>
      <a href={item.href} className="min-w-0 flex-1 truncate text-sm">
        {item.label}
      </a>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-ink-foreground"
        aria-label="Previous ticker item"
        onClick={() => step(-1)}
      >
        Prev
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-ink-foreground"
        aria-label="Next ticker item"
        onClick={() => step(1)}
      >
        Next
      </Button>
    </div>
  );
}
