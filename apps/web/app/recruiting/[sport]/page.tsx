import { listRecruitingPlayersByClassYear } from "@redshirt-sports/db/queries/transfer-portal";
import type { Metadata } from "next";
import Link from "next/link";

import { getPageMetadata } from "@/lib/global-seo-settings";
import { requireSportBySlug } from "@/lib/sport-by-slug";
import { getDynamicFetchOptions } from "@redshirt-sports/sanity/live";

const CLASS_YEARS = [2027, 2026, 2025] as const;

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
      title: `${sportInfo.title} Recruiting Rankings`,
      description: `College ${sportInfo.title.toLowerCase()} recruiting rankings, commitments, and player profiles.`,
      slug: `/recruiting/${sport}`,
    },
    perspective,
  );
}

export default async function RecruitingSportPage({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<{ classYear?: string }>;
}) {
  const [{ sport }, { classYear: classYearParam }, { perspective }] =
    await Promise.all([params, searchParams, getDynamicFetchOptions()]);
  const sportInfo = await requireSportBySlug(sport, perspective);

  const classYear = classYearParam
    ? Number.parseInt(classYearParam, 10)
    : CLASS_YEARS[0];

  const players = await listRecruitingPlayersByClassYear({
    sportSlug: sport,
    classYear: Number.isNaN(classYear) ? CLASS_YEARS[0] : classYear,
  });

  return (
    <div className="container max-w-5xl px-4 py-8">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-xs font-bold tracking-widest text-primary uppercase">
          <Link href="/recruiting" className="hover:underline">
            Recruiting
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight uppercase sm:text-4xl">
          {sportInfo.title} Recruiting
        </h1>
        <nav className="mt-4 flex flex-wrap gap-2">
          {CLASS_YEARS.map((year) => (
            <Link
              key={year}
              href={`/recruiting/${sport}?classYear=${year}`}
              className="rounded-full border border-border px-3 py-1 text-sm font-medium hover:bg-muted"
            >
              Class of {year}
            </Link>
          ))}
          <Link
            href={`/recruiting/${sport}/players`}
            className="rounded-full border border-border px-3 py-1 text-sm font-medium hover:bg-muted"
          >
            Player search
          </Link>
        </nav>
      </header>

      {players.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-muted-foreground">
          No recruiting data yet for {sportInfo.title.toLowerCase()}.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {players.map((player, index) => {
            const name =
              player.displayName ?? `${player.firstName} ${player.lastName}`;
            return (
              <li
                key={player.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 text-sm font-bold text-muted-foreground tabular-nums">
                    {index + 1}
                  </span>
                  <div>
                    <Link
                      href={`/player/${player.slug}`}
                      className="font-semibold hover:text-primary"
                    >
                      {name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {player.position ?? "—"} · {player.hometown ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">
                    {player.schoolShortName ?? player.schoolName ?? "Uncommitted"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {player.currentStatus ?? "Prospect"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
