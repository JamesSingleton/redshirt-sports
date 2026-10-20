import { cn } from "@redshirt-sports/ui/lib/utils";
import Link from "next/link";

export type RankingsTabId =
  | "poll"
  | "ballots"
  | "voters"
  | "history"
  | "methodology";

type Tab = {
  id: RankingsTabId;
  label: string;
  href: string;
};

export function RankingsTabs({
  tabs,
  active,
}: {
  tabs: Tab[];
  active: RankingsTabId;
}) {
  return (
    <nav
      className="mt-5 flex gap-6 overflow-x-auto border-b"
      aria-label="Rankings sections"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "border-b-2 px-1 pt-1 pb-3 text-sm font-semibold whitespace-nowrap",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
