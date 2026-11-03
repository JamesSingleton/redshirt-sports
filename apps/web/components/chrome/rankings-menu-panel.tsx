import {
  NavListItem,
  NavSectionLabel,
} from "@/components/chrome/nav-list-item";
import type { NavRankingsMenuItem } from "@/components/navbar";
import { pollLatestPath } from "@/lib/rankings/poll-paths";
import {
  navPollLabel,
  sportNavLabel,
  sportRankingsIndexPath,
} from "@/lib/sport-nav";

type RankingsMenuSport = NavRankingsMenuItem["sports"][number];
type RankingsMenuPoll = NonNullable<RankingsMenuSport["polls"]>[number];
export type RankingsMenuLink = NonNullable<
  NavRankingsMenuItem["links"]
>[number] & { href: string };

/**
 * Sports in a Rankings menu with their polls and editor-added links. A sport
 * shows when it has at least one of either.
 */
export function rankingsMenuSports(item: NavRankingsMenuItem) {
  const links = (item.links ?? []).filter((link): link is RankingsMenuLink =>
    Boolean(link.href),
  );
  return item.sports.flatMap((sport) => {
    const polls: RankingsMenuPoll[] = sport.polls ?? [];
    const sportLinks = links.filter((link) => link.sportId === sport._id);
    return polls.length || sportLinks.length
      ? [{ ...sport, polls, links: sportLinks }]
      : [];
  });
}

/** Rankings dropdown: each sport's polls, then its extra links. */
export function RankingsMenuContent({ item }: { item: NavRankingsMenuItem }) {
  const sports = rankingsMenuSports(item);

  return (
    <div
      className={
        sports.length > 1
          ? "grid w-[560px] grid-cols-2 gap-4 p-1"
          : "grid w-[340px] gap-4 p-1"
      }
    >
      {sports.map((sport) => {
        const label = sportNavLabel(sport.slug, sport.name);
        return (
          <div key={sport._id}>
            <NavSectionLabel>{label}</NavSectionLabel>
            <ul className="grid gap-0.5">
              {sport.polls.map((poll) => (
                <NavListItem
                  key={poll._key}
                  href={pollLatestPath(sport.slug, poll.slug)}
                  title={`${navPollLabel(poll)} Top 25`}
                >
                  Latest poll, ballots, and voters
                </NavListItem>
              ))}
              {sport.links.map((link) => (
                <NavListItem
                  key={link._key}
                  href={link.href}
                  title={link.name}
                  openInNewTab={link.openInNewTab}
                >
                  {link.description}
                </NavListItem>
              ))}
              {sport.polls.length > 0 ? (
                <NavListItem
                  href={sportRankingsIndexPath(sport.slug)}
                  title={`All ${label} rankings`}
                  className="text-muted-foreground"
                />
              ) : null}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
