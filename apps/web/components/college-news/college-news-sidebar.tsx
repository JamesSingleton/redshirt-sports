import { cn } from "@redshirt-sports/ui/lib/utils";
import Link from "next/link";

import { SectionHeader } from "@/components/home/section-header";
import type { NavLink } from "@/components/nav-config";
import { getDivisionSlugFromHref } from "@/lib/college-news-config";

interface CollegeNewsSidebarProps {
  divisions?: NavLink[];
  activeDivisionSlug?: string;
  children?: React.ReactNode;
}

export function CollegeNewsSidebar({
  divisions = [],
  activeDivisionSlug,
  children,
}: CollegeNewsSidebarProps) {
  return (
    <aside aria-label="Sidebar" className="space-y-6">
      <div
        className="flex h-[250px] items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground"
        aria-hidden="true"
      >
        Advertisement
      </div>

      {divisions.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="px-4 pt-4">
            <SectionHeader title="Browse by Division" className="mb-0" />
          </div>
          <nav aria-label="Browse by division">
            <ul className="divide-y divide-border">
              {divisions.map((division) => {
                const divisionSlug = getDivisionSlugFromHref(division.href);
                const isActive = divisionSlug === activeDivisionSlug;

                return (
                  <li key={division.href}>
                    <Link
                      href={division.href}
                      prefetch={false}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 text-sm transition-colors hover:text-primary",
                        isActive
                          ? "border-primary border-l-2 bg-primary/5 font-bold text-primary"
                          : "text-foreground hover:bg-muted/50",
                      )}
                    >
                      {division.label}
                      {isActive ? (
                        <span
                          className="size-1.5 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ) : null}

      {children}
    </aside>
  );
}
