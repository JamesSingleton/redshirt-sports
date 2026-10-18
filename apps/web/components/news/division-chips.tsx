import { Badge } from "@redshirt-sports/ui/components/badge";
import { cn } from "@redshirt-sports/ui/lib/utils";
import Link from "next/link";

export type DivisionChip = { label: string; href: string };

export const FOOTBALL_DIVISION_CHIPS: DivisionChip[] = [
  { label: "All", href: "/college/football/news" },
  { label: "FBS", href: "/college/football/news/fbs" },
  { label: "FCS", href: "/college/football/news/fcs" },
  { label: "Division II", href: "/college/football/news/d2" },
  { label: "Division III", href: "/college/football/news/d3" },
];

/** Horizontally scrollable chip row; chips are real links, not client filters. */
export function DivisionChips({
  chips,
  activeHref,
  className,
}: {
  chips: DivisionChip[];
  activeHref: string;
  className?: string;
}) {
  return (
    <nav aria-label="Filter by division" className={className}>
      <ul className="-mx-1 flex gap-1.5 overflow-x-auto px-1">
        {chips.map((chip) => {
          const isActive = chip.href === activeHref;
          return (
            <li key={chip.href}>
              <Badge
                asChild
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "h-7 px-2.5 text-[13px]",
                  !isActive && "hover:bg-accent",
                )}
              >
                <Link
                  href={chip.href}
                  prefetch={false}
                  aria-current={isActive ? "page" : undefined}
                >
                  {chip.label}
                </Link>
              </Badge>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
