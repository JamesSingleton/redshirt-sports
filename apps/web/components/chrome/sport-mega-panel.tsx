import { NavigationMenuLink } from "@redshirt-sports/ui/components/navigation-menu";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import {
  NavListItem,
  NavSectionLabel,
} from "@/components/chrome/nav-list-item";
import type { NavSportMenuItem } from "@/components/navbar";
import { pollLatestPath } from "@/lib/rankings/poll-paths";
import {
  navPollLabel,
  sportHubPath,
  sportNavLabel,
  sportRankingsIndexPath,
} from "@/lib/sport-nav";

export function sportMenuLabel(item: NavSportMenuItem): string {
  return item.label?.trim() || sportNavLabel(item.sport.slug, item.sport.name);
}

/** One-line summary for the hub card, built from the menu's divisions. */
export function sportHubBlurb(names: string[]): string {
  if (names.length === 0) return "Every story, all season long.";
  if (names.length === 1) return `Every story from ${names[0]}.`;
  return `Every story from ${names.slice(0, -1).join(", ")} and ${names.at(-1)}.`;
}

/** Sport dropdown: hub card, the sport's Top 25 polls, and division news. */
export function SportMenuContent({ item }: { item: NavSportMenuItem }) {
  const { sport } = item;
  const label = sportMenuLabel(item);
  const polls = sport.polls ?? [];
  const divisions = (item.divisions ?? []).filter(
    (division): division is typeof division & { slug: string } =>
      Boolean(division.slug),
  );

  return (
    <div className="grid w-[560px] gap-3 p-1 lg:w-[620px] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
      <NavigationMenuLink asChild>
        <Link
          href={sportHubPath(sport.slug)}
          prefetch={false}
          className="flex h-full min-h-44 flex-col justify-end rounded-md bg-linear-to-br from-primary/15 via-muted/60 to-muted p-5 no-underline outline-hidden select-none focus:shadow-md"
        >
          <span className="kicker text-primary">News hub</span>
          <span className="mt-1 font-display text-2xl font-bold uppercase leading-tight">
            {label}
          </span>
          <span className="mt-2 text-sm leading-snug text-muted-foreground">
            {sportHubBlurb(divisions.map((division) => division.name))}
          </span>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium">
            All {label} news
            <ArrowRight className="size-3.5" aria-hidden />
          </span>
        </Link>
      </NavigationMenuLink>
      <div className="grid content-start gap-3">
        {polls.length > 0 ? (
          <div>
            <NavSectionLabel>Top 25</NavSectionLabel>
            <ul className="grid gap-0.5">
              {polls.map((poll) => (
                <NavListItem
                  key={poll._key}
                  href={pollLatestPath(sport.slug, poll.slug)}
                  title={`${navPollLabel(poll)} Top 25`}
                >
                  Latest poll and every voter&apos;s ballot
                </NavListItem>
              ))}
              <NavListItem
                href={sportRankingsIndexPath(sport.slug)}
                title="All rankings"
              />
            </ul>
          </div>
        ) : null}
        {divisions.length > 0 ? (
          <div>
            <NavSectionLabel>News by division</NavSectionLabel>
            <ul className="flex flex-wrap gap-1.5 px-2">
              {divisions.map((division) => (
                <li key={division._id}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={`/college/${sport.slug}/news/${division.slug}`}
                      prefetch={false}
                      className="inline-flex flex-row items-center rounded-full border px-3 py-1 text-xs font-medium"
                    >
                      {division.name}
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
