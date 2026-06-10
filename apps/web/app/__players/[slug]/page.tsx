import { getPlayerByPublicId } from "@redshirt-sports/db/queries/players";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getSEOMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const player = await getPlayerByPublicId(slug);

  if (!player) return {};

  const name =
    player.displayName ?? `${player.firstName} ${player.lastName}`.trim();
  const primaryProfile = player.sportProfiles[0];

  return getSEOMetadata({
    title: name,
    description:
      player.bio ??
      `${name} — ${primaryProfile?.primaryPosition ?? "Player"}${primaryProfile?.sportName ? `, ${primaryProfile.sportName}` : ""}.`,
    slug: `/players/${slug}`,
  });
}

export default function PlayerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense>
      <PlayerProfileContent params={params} />
    </Suspense>
  );
}

async function PlayerProfileContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const player = await getPlayerByPublicId(slug);

  if (!player) {
    notFound();
  }

  const name =
    player.displayName ?? `${player.firstName} ${player.lastName}`.trim();
  const primaryProfile = player.sportProfiles[0];

  return (
    <div className="container py-10">
      <header className="flex flex-col gap-6 border-b pb-10 md:flex-row md:items-start md:gap-10">
        {player.headshotUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.headshotUrl}
            alt={name}
            className="h-32 w-32 rounded-full object-cover"
          />
        )}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {name}
          </h1>
          <p className="text-muted-foreground text-lg">
            {[
              primaryProfile?.primaryPosition,
              primaryProfile?.sportName,
              player.hometownCity,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            {player.heightDisplay && <span>HT: {player.heightDisplay}</span>}
            {player.weight && <span>WT: {player.weight}</span>}
            {primaryProfile?.classStanding && (
              <span className="capitalize">
                {primaryProfile.classStanding.replace(/_/g, " ")}
              </span>
            )}
            {primaryProfile?.isGraduateTransfer && (
              <span>Graduate Transfer</span>
            )}
          </div>
          {player.highSchoolDisplay && (
            <p className="text-muted-foreground">{player.highSchoolDisplay}</p>
          )}
          {player.bio && <p className="max-w-3xl">{player.bio}</p>}
        </div>
      </header>

      {player.collegeAffiliations.length > 0 && (
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold">College History</h2>
          <ol className="space-y-3 border-l pl-6">
            {player.collegeAffiliations.map((affiliation) => (
              <li key={affiliation.id} className="relative">
                <span className="font-medium">
                  {affiliation.schoolShortName ?? affiliation.schoolName}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  ({affiliation.startYear}
                  {affiliation.endYear
                    ? `–${affiliation.endYear}`
                    : "–present"}
                  )
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {player.portalHistory.length > 0 && (
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold">Transfer Portal</h2>
          <ul className="space-y-2">
            {player.portalHistory.map((entry) => (
              <li key={entry.id} className="capitalize">
                {entry.status.replace(/_/g, " ")} — {entry.fromSchoolName}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12 rounded-lg border border-dashed p-8 text-center">
        <h2 className="text-lg font-semibold">Latest News</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Related articles will be linked here once player-to-post associations
          are configured.
        </p>
      </section>
    </div>
  );
}
