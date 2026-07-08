import { searchRecruitingPlayers } from "@redshirt-sports/db/queries/transfer-portal";
import { getDynamicFetchOptions } from "@redshirt-sports/sanity/live";
import type { Metadata } from "next";
import Link from "next/link";

import { getPageMetadata } from "@/lib/global-seo-settings";
import { requireSportBySlug } from "@/lib/sport-by-slug";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string }>;
}): Promise<Metadata> {
  const { sport } = await params;
  const { perspective } = await getDynamicFetchOptions();
  const sportInfo = await requireSportBySlug(sport, perspective);

  return getPageMetadata(
    {
      title: `${sportInfo.title} Recruiting Player Search`,
      description: `Search ${sportInfo.title.toLowerCase()} recruits by name or hometown.`,
      slug: `/recruiting/${sport}/players`,
    },
    perspective,
  );
}

export default async function RecruitingPlayersPage({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ sport }, { q }, { perspective }] = await Promise.all([
    params,
    searchParams,
    getDynamicFetchOptions(),
  ]);
  const sportInfo = await requireSportBySlug(sport, perspective);

  const players = await searchRecruitingPlayers({
    query: q,
    sportSlug: sport,
    limit: 50,
  });

  return (
    <div className="container max-w-5xl px-4 py-8">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-xs font-bold tracking-widest text-primary uppercase">
          <Link href={`/recruiting/${sport}`} className="hover:underline">
            {sportInfo.title} Recruiting
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight uppercase sm:text-4xl">
          Recruit Search
        </h1>
        <form
          className="mt-4 flex gap-2"
          action={`/recruiting/${sport}/players`}
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by player name or hometown"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Search
          </button>
        </form>
      </header>

      {players.length === 0 ? (
        <p className="text-muted-foreground">
          {q
            ? `No players found for "${q}".`
            : "Enter a search term to find recruits."}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {players.map((player) => {
            const name =
              player.displayName ?? `${player.firstName} ${player.lastName}`;
            return (
              <li key={player.id} className="px-4 py-3">
                <Link
                  href={`/player/${player.slug}`}
                  className="font-semibold hover:text-primary"
                >
                  {name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {player.position ?? "—"} · {player.hometown ?? "—"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
