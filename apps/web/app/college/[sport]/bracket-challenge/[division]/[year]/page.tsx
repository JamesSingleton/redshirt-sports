import { buttonVariants } from "@redshirt-sports/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";

import { getPageMetadata } from "@/lib/global-seo-settings";

const ROUNDS = [
  {
    name: "First round",
    games: [
      ["North Dakota State", "Example Team H"],
      ["Montana State", "Example Team G"],
      ["South Dakota State", "Example Team F"],
      ["Montana", "Example Team E"],
    ],
  },
  {
    name: "Quarterfinals",
    games: [
      ["North Dakota State", "Montana State"],
      ["South Dakota State", "Montana"],
    ],
  },
  {
    name: "Semifinals",
    games: [["North Dakota State", "South Dakota State"]],
  },
  {
    name: "Championship",
    games: [["North Dakota State", "TBD"]],
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; division: string; year: string }>;
}): Promise<Metadata> {
  const { sport, division, year } = await params;
  return getPageMetadata(
    {
      title: `${year} ${division.toUpperCase()} Bracket Challenge`,
      description: "Example bracket for the FCS playoff challenge.",
      slug: `/college/${sport}/bracket-challenge/${division}/${year}`,
    },
    "published",
  );
}

export default async function BracketPage({
  params,
}: {
  params: Promise<{ sport: string; division: string; year: string }>;
}) {
  const { sport, division, year } = await params;

  return (
    <div className="max-w-site mx-auto px-4 py-8 lg:px-6">
      <div className="kicker text-primary">Bracket Challenge</div>
      <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight uppercase lg:text-4xl">
        {division.toUpperCase()} {year}
      </h1>
      <p className="text-muted-foreground mt-2 max-w-xl text-sm">
        Example bracket. Picks are not saved yet.
      </p>
      <div className="mt-4">
        <Link
          href={`/college/${sport}/bracket-challenge/${division}/${year}/my-bracket`}
          className={buttonVariants()}
          prefetch={false}
        >
          Make your picks
        </Link>
      </div>
      <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
        {ROUNDS.map((round) => (
          <section key={round.name} className="w-56 shrink-0">
            <h2 className="kicker text-muted-foreground mb-3">{round.name}</h2>
            <div className="grid gap-3">
              {round.games.map((game) => (
                <div
                  key={game.join("-")}
                  className="overflow-hidden rounded-lg border"
                >
                  {game.map((team, index) => (
                    <div
                      key={team}
                      className="flex items-center justify-between border-b px-3 py-2 text-sm last:border-b-0"
                    >
                      <span className="font-medium">{team}</span>
                      <span className="text-muted-foreground tabular">
                        {index === 0 ? "—" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
