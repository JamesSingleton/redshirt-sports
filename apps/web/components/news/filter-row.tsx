import { cn } from "@redshirt-sports/ui/lib/utils";
import type { Route } from "next";
import Link from "next/link";

export type FilterItem = {
  key: string;
  label: string;
  href: string;
  keywords?: string;
};

/** Horizontally scrolling chip links used to narrow a news listing. */
export function FilterRow({
  label,
  items,
  activeHref,
}: {
  label: string;
  items: FilterItem[];
  activeHref?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label={label}
      className="-mx-4 overflow-x-auto px-4 scrollbar-none"
    >
      <ul className="flex w-max gap-2">
        {items.map((item) => {
          const isActive = item.href === activeHref;
          return (
            <li key={item.key}>
              <Link
                href={item.href as Route}
                prefetch={false}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card hover:bg-accent",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
