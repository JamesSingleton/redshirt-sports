"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { use, useState } from "react";

const GAMES = [
  ["North Dakota State", "Example Team H"],
  ["Montana State", "Example Team G"],
  ["South Dakota State", "Example Team F"],
  ["Montana", "Example Team E"],
];

export default function MyBracketPage({
  params,
}: {
  params: Promise<{ sport: string; division: string; year: string }>;
}) {
  const { division, year } = use(params);
  const [picks, setPicks] = useState<Record<number, string>>({});

  return (
    <div className="max-w-site mx-auto px-4 py-8 lg:px-6">
      <div className="kicker text-primary">Your picks</div>
      <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight uppercase">
        {division.toUpperCase()} {year}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Example pick editor. Selections stay on this page only.
      </p>
      <div className="mt-6 grid max-w-lg gap-3">
        {GAMES.map((game, index) => (
          <fieldset key={game.join("-")} className="rounded-lg border p-3">
            <legend className="kicker text-muted-foreground px-1">
              Game {index + 1}
            </legend>
            <div className="mt-2 grid gap-2">
              {game.map((team) => (
                <label
                  key={team}
                  className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  <input
                    type="radio"
                    name={`game-${index}`}
                    checked={picks[index] === team}
                    onChange={() =>
                      setPicks((current) => ({ ...current, [index]: team }))
                    }
                  />
                  {team}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <Button className="mt-6" type="button" disabled>
        Save picks
      </Button>
    </div>
  );
}
