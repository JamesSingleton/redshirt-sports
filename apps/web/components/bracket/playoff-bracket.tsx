import type {
  BracketTeam,
  BracketView,
} from "@redshirt-sports/db/playoff-bracket";
import {
  Bracket,
  type BracketPicking,
  type BracketSelection,
  type BracketSideAt,
  type BracketSideLike,
} from "@redshirt-sports/ui/components/bracket";
import type { ReactNode } from "react";

import { TeamMark } from "@/components/rankings/team-mark";
import { TeamPageLink } from "@/components/rankings/team-page-link";

/**
 * With `selection`, each card opens its matchup instead, and with `picking`
 * each team row is a button, so team names are plain text (a link can't sit
 * inside a button). `plain` is for the copy that gets printed or saved as an
 * image: no links, and logos load at once.
 */
export function PlayoffBracket({
  view,
  selection,
  picking,
  plain = false,
  tightSeeds = false,
  renderEmpty,
  renderTeamAction,
  className,
}: {
  view: BracketView;
  selection?: BracketSelection;
  picking?: BracketPicking;
  plain?: boolean;
  /**
   * For the reader's own bracket, where many teams have no seed: such a team
   * starts at the card's edge instead of leaving room for a seed.
   */
  tightSeeds?: boolean;
  renderEmpty?: (
    side: BracketSideLike<BracketTeam>,
    at: BracketSideAt,
  ) => ReactNode;
  renderTeamAction?: (
    side: BracketSideLike<BracketTeam>,
    at: BracketSideAt,
  ) => ReactNode;
  className?: string;
}) {
  const linked = !selection && !picking && !plain;
  return (
    <Bracket
      view={view}
      className={className}
      selection={selection}
      picking={picking}
      renderEmpty={renderEmpty}
      renderTeamAction={renderTeamAction}
      tightSeeds={tightSeeds}
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
              eager={plain}
            />
            <span className="truncate" title={team.name ?? undefined}>
              {linked ? (
                <TeamPageLink slug={team.slug} className="hover:underline">
                  {label}
                </TeamPageLink>
              ) : (
                label
              )}
            </span>
          </>
        );
      }}
    />
  );
}
