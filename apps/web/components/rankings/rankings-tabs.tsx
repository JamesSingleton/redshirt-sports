import { cn } from "@redshirt-sports/ui/lib/utils";
import Link from "next/link";

export type RankingsTab =
  | "poll"
  | "ballots"
  | "voters"
  | "history"
  | "methodology";

type RankingsTabsProps = {
  sport: string;
  division: string;
  year?: string | number;
  week?: string | number;
  active: RankingsTab;
};

export function rankingsBasePath(sport: string, division: string) {
  return `/college/${sport}/rankings/${division}`;
}

export function RankingsTabs({
  sport,
  division,
  year,
  week,
  active,
}: RankingsTabsProps) {
  const base = rankingsBasePath(sport, division);
  const weekPath =
    year != null && week != null ? `${base}/${year}/${week}` : base;

  const tabs: { id: RankingsTab; label: string; href: string }[] = [
    { id: "poll", label: "Poll", href: weekPath },
    {
      id: "ballots",
      label: "Ballots",
      href: `${weekPath}/ballots`,
    },
    { id: "voters", label: "Voters", href: `${base}/voters` },
    { id: "history", label: "History", href: `${base}/history` },
    {
      id: "methodology",
      label: "Methodology",
      href: `/college/${sport}/rankings/methodology`,
    },
  ];

  return (
    <nav
      aria-label="Rankings sections"
      className="mt-5 flex gap-6 overflow-x-auto border-b"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          prefetch={false}
          className={cn(
            "border-b-2 px-1 pt-1 pb-3 text-sm font-semibold whitespace-nowrap",
            tab.id === active
              ? "border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground border-transparent",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
