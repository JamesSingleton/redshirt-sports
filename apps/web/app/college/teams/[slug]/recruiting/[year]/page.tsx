import {
  getSportIdBySlug,
  getTeamRecruitingClass,
  type SportParam,
} from "@redshirt-sports/db/queries";
import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import { schoolIdBySlugQuery } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPageMetadata } from "@/lib/global-seo-settings";
import { resolveSchoolIdBySanitySlug } from "@/lib/resolve-school-id";

const DEFAULT_SPORT: SportParam = "football";

function playerDisplayName(player: {
  displayName: string | null;
  firstName: string;
  lastName: string;
}) {
  return player.displayName ?? `${player.firstName} ${player.lastName}`.trim();
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; year: string }>;
  searchParams: Promise<{ sport?: string }>;
}): Promise<Metadata> {
  const [{ slug, year }, { sport: sportParam }, { perspective }] =
    await Promise.all([params, searchParams, getDynamicFetchOptions()]);
  const classYear = Number.parseInt(year, 10);
  if (Number.isNaN(classYear)) {
    notFound();
  }

  const { data: school } = await sanityFetchMetadata({
    query: schoolIdBySlugQuery,
    params: { slug },
    perspective,
  });

  if (!school) {
    notFound();
  }

  const sport = (sportParam as SportParam | undefined) ?? DEFAULT_SPORT;
  const teamName = school.shortName ?? school.name ?? slug;

  return getPageMetadata(
    {
      title: `${teamName} ${classYear} Recruiting Class`,
      description: `${teamName} ${classYear} recruiting class commitments, rankings, and player profiles.`,
      slug: `/college/teams/${slug}/recruiting/${year}${sport !== DEFAULT_SPORT ? `?sport=${sport}` : ""}`,
    },
    perspective,
  );
}

export default async function TeamRecruitingClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; year: string }>;
  searchParams: Promise<{ sport?: string }>;
}) {
  const [{ slug, year }, { sport: sportParam }, { perspective }] =
    await Promise.all([params, searchParams, getDynamicFetchOptions()]);
  const classYear = Number.parseInt(year, 10);
  if (Number.isNaN(classYear)) {
    notFound();
  }

  return (
    <CachedTeamRecruitingClass
      slug={slug}
      classYear={classYear}
      sport={(sportParam as SportParam | undefined) ?? DEFAULT_SPORT}
      perspective={perspective}
    />
  );
}

async function CachedTeamRecruitingClass({
  slug,
  classYear,
  sport,
  perspective,
}: {
  slug: string;
  classYear: number;
  sport: SportParam;
  perspective: DynamicFetchOptions["perspective"];
}) {
  const [{ data: school }, schoolId, sportId] = await Promise.all([
    sanityFetchMetadata({
      query: schoolIdBySlugQuery,
      params: { slug },
      perspective,
    }),
    resolveSchoolIdBySanitySlug(slug, perspective),
    getSportIdBySlug(sport),
  ]);

  if (!school || !schoolId || !sportId) {
    notFound();
  }

  const commits = await getTeamRecruitingClass({
    schoolId,
    sportId,
    classYear,
  });

  const teamName = school.shortName ?? school.name ?? slug;

  return (
    <div className="container max-w-5xl px-4 py-8">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-xs font-bold tracking-widest text-primary uppercase">
          <Link href={`/college/teams/${slug}`} className="hover:underline">
            {teamName}
          </Link>
          <span className="mx-2 text-muted-foreground">·</span>
          <Link href="/recruiting" className="hover:underline">
            Recruiting
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight uppercase sm:text-4xl">
          {classYear} Recruiting Class
        </h1>
        <p className="mt-3 text-muted-foreground">
          Commitments and rankings for the {teamName} class of {classYear}.
        </p>
      </header>

      {commits.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-muted-foreground">
          No recruiting class data yet for {teamName} ({classYear}).
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {commits.map((player) => {
            const name = playerDisplayName(player);
            return (
              <li
                key={player.commitmentId}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 text-sm font-bold text-muted-foreground tabular-nums">
                    {player.nationalRank ?? "—"}
                  </span>
                  <div>
                    <p className="font-semibold">
                      {player.playerSlug ? (
                        <Link
                          href={`/player/${player.playerSlug}`}
                          prefetch={false}
                          className="hover:underline"
                        >
                          {name}
                        </Link>
                      ) : (
                        name
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {player.playerPosition ?? player.rankingPosition ?? "—"} ·{" "}
                      {player.hometown ?? "—"}
                      {player.stars != null ? ` · ${player.stars}★` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  {player.stars != null ? (
                    <p className="font-medium">
                      {player.stars} star{player.stars === 1 ? "" : "s"}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">Unranked</p>
                  )}
                  {player.highSchool ? (
                    <p className="text-xs text-muted-foreground">
                      {player.highSchool}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
