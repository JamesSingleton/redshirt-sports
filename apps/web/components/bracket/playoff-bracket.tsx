import type { BracketView } from "@redshirt-sports/db/playoff-bracket";
import {
  Bracket,
  type BracketSelection,
} from "@redshirt-sports/ui/components/bracket";

import { TeamMark } from "@/components/rankings/team-mark";
import { TeamPageLink } from "@/components/rankings/team-page-link";

/**
 * With `selection`, each card opens its matchup instead, so team names are
 * plain text (a link can't sit inside the card's button).
 */
export function PlayoffBracket({
  view,
  selection,
  className,
}: {
  view: BracketView;
  selection?: BracketSelection;
  className?: string;
}) {
  return (
    <Bracket
      view={view}
      className={className}
      selection={selection}
      renderTeam={(team) => {
        const label = team.shortName ?? team.name;
        return (
          <>
            <TeamMark
              image={team.image}
              shortName={team.shortName}
              abbreviation={team.abbreviation}
              name={team.name}
              size="xs"
            />
            <span className="truncate" title={team.name ?? undefined}>
              {selection ? (
                label
              ) : (
                <TeamPageLink slug={team.slug} className="hover:underline">
                  {label}
                </TeamPageLink>
              )}
            </span>
          </>
        );
      }}
    />
  );
}
