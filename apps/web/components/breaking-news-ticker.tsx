"use client";

import { cn } from "@redshirt-sports/ui/lib/utils";
import { useEffect, useState } from "react";

interface BreakingNewsItem {
  id: string;
  text: string;
  href?: string;
}

interface BreakingNewsTickerProps {
  items: BreakingNewsItem[];
  className?: string;
}

export function BreakingNewsTicker({
  items,
  className,
}: BreakingNewsTickerProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Hide ticker if no items
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-primary text-white overflow-hidden",
        !isVisible && "hidden",
        className
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center gap-4 py-2">
          <span className="shrink-0 text-xs font-bold uppercase tracking-wider bg-white text-primary px-2 py-0.5 rounded">
            Breaking
          </span>
          <div className="overflow-hidden flex-1">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
              {/* Duplicate items for seamless loop */}
              {[...items, ...items].map((item, index) => (
                <span
                  key={`${item.id}-${index}`}
                  className="inline-flex items-center gap-2 text-sm font-medium"
                >
                  {item.href ? (
                    <a
                      href={item.href}
                      className="hover:underline"
                    >
                      {item.text}
                    </a>
                  ) : (
                    item.text
                  )}
                  <span className="text-white/50">•</span>
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="shrink-0 text-white/70 hover:text-white text-xs"
            aria-label="Close breaking news"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
