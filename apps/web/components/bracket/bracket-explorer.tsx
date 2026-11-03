"use client";

import type {
  BracketGameView,
  BracketTeamStatsSet,
  BracketView,
} from "@redshirt-sports/db/playoff-bracket";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@redshirt-sports/ui/components/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@redshirt-sports/ui/components/sheet";
import { useIsMobile } from "@redshirt-sports/ui/hooks/use-mobile";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MatchupPanel } from "@/components/bracket/matchup-panel";
import { PlayoffBracket } from "@/components/bracket/playoff-bracket";

const PARAM = "game";

function allGames(view: BracketView) {
  return new Map<string, BracketGameView>(
    [
      ...view.left.columns.flatMap((column) => column.games),
      ...view.right.columns.flatMap((column) => column.games),
      view.final,
    ].map((game) => [game.key, game]),
  );
}

function title(game: BracketGameView) {
  const name = (side: BracketGameView["sideA"]) =>
    side.team ? (side.team.shortName ?? side.team.name) : side.placeholder;
  return `${name(game.sideA)} vs. ${name(game.sideB)}`;
}

/** Writes `?game=` without a navigation, so the page stays server-cached. */
function writeGameParam(key: string | null) {
  const url = new URL(window.location.href);
  if (key) url.searchParams.set(PARAM, key);
  else url.searchParams.delete(PARAM);
  window.history.replaceState(window.history.state, "", url);
}

/**
 * The bracket with clickable games. The chosen game opens in a side sheet on
 * desktop and a bottom drawer on phones, and lives in `?game=` so a matchup
 * can be linked. The bracket itself still renders on the server.
 */
export function BracketExplorer({
  view,
  stats,
  sport,
  division,
}: {
  view: BracketView;
  stats: BracketTeamStatsSet;
  sport: string;
  division: string;
}) {
  const games = useMemo(() => allGames(view), [view]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Read the link after mount: reading search params during render would
  // keep the bracket out of the server HTML.
  useEffect(() => {
    const key = new URL(window.location.href).searchParams.get(PARAM);
    if (key && games.has(key)) setSelectedKey(key);
  }, [games]);

  const select = useCallback((key: string | null) => {
    setSelectedKey(key);
    writeGameParam(key);
  }, []);

  // Keys only come from cards or a link checked on mount, so they exist.
  const game = selectedKey ? games.get(selectedKey) : undefined;
  // There is no trigger, so the sheet only ever asks to close.
  const onOpenChange = () => select(null);
  const panel = game ? (
    <MatchupPanel
      game={game}
      games={games}
      stats={stats}
      sport={sport}
      division={division}
    />
  ) : null;
  const heading = game ? title(game) : "";
  const subheading = game?.roundLabel ?? "";

  return (
    <>
      <PlayoffBracket
        view={view}
        selection={{ selectedKey, onSelect: select }}
      />
      {isMobile ? (
        <Drawer open={game !== undefined} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="text-left">
              <DrawerDescription>{subheading}</DrawerDescription>
              <DrawerTitle>{heading}</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-6">{panel}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={game !== undefined} onOpenChange={onOpenChange}>
          <SheetContent className="w-full overflow-y-auto sm:max-w-md">
            <SheetHeader>
              <SheetDescription>{subheading}</SheetDescription>
              <SheetTitle>{heading}</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-6">{panel}</div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
