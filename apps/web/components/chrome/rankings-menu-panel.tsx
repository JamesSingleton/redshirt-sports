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

/** Sports in a Rankings menu that have at least one poll listed. */
export function rankingsMenuSports(item: NavRankingsMenuItem) {
  return item.sports.flatMap((sport) =>
    sport.polls?.length
      ? [
          { ...sport, polls: sport.polls } as RankingsMenuSport & {
            polls: NonNullable<RankingsMenuSport["polls"]>;
          },
        ]
      : [],
  );
}

/** Rankings dropdown: each sport's polls, linking to their latest-poll pages. */
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
              <NavListItem
                href={sportRankingsIndexPath(sport.slug)}
                title={`All ${label} rankings`}
                className="text-muted-foreground"
              />
            </ul>
          </div>
        );
      })}
    </div>
  );
}
