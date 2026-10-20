import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function RankingsBreadcrumb({
  sport,
  sportLabel,
  divisionName,
  rankingsIndexHref,
}: {
  sport: string;
  sportLabel: string;
  divisionName: string;
  rankingsIndexHref: string;
}) {
  return (
    <nav
      className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
      aria-label="Breadcrumb"
    >
      <Link href="/college/news" prefetch={false} className="hover:text-foreground">
        College
      </Link>
      <ChevronRight className="size-3 shrink-0" aria-hidden />
      <Link
        href={`/college/${sport}/news`}
        prefetch={false}
        className="hover:text-foreground"
      >
        {sportLabel}
      </Link>
      <ChevronRight className="size-3 shrink-0" aria-hidden />
      <Link
        href={rankingsIndexHref}
        prefetch={false}
        className="hover:text-foreground"
      >
        Rankings
      </Link>
      <ChevronRight className="size-3 shrink-0" aria-hidden />
      <span className="text-foreground">{divisionName}</span>
    </nav>
  );
}
