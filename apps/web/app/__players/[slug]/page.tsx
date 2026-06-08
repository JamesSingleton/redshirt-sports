import { getPlayerBySlug } from "@redshirt-sports/db/queries/players";
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
  const player = await getPlayerBySlug(slug);

  if (!player) return {};

  const name =
    player.displayName ?? `${player.firstName} ${player.lastName}`.trim();

  return getSEOMetadata({
    title: name,
    description:
      player.bio ??
      `${name} — ${player.position ?? "Player"}${player.sportName ? `, ${player.sportName}` : ""}.`,
    slug: `/players/${slug}`,
  });
}

function formatHeight(inches: number | null) {
  if (!inches) return null;
  const feet = Math.floor(inches / 12);
  const remaining = inches % 12;
  return `${feet}-${remaining}`;
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
  const player = await getPlayerBySlug(slug);

  if (!player) {
    notFound();
  }

  const name =
    player.displayName ?? `${player.firstName} ${player.lastName}`.trim();

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
            {[player.position, player.sportName, player.hometown]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            {formatHeight(player.heightInches) && (
              <span>HT: {formatHeight(player.heightInches)}</span>
            )}
            {player.weightLbs && <span>WT: {player.weightLbs}</span>}
            {player.classYear && <span>Class: {player.classYear}</span>}
            {player.currentStatus && (
              <span className="capitalize">{player.currentStatus}</span>
            )}
          </div>
          {player.schoolShortName && (
            <p className="font-medium">
              {player.currentStatus === "committed" ? "Committed to " : ""}
              {player.schoolShortName ?? player.schoolName}
            </p>
          )}
          {player.bio && <p className="max-w-3xl">{player.bio}</p>}
        </div>
      </header>

      {player.timeline.length > 0 && (
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold">The Journey</h2>
          <ol className="space-y-3 border-l pl-6">
            {player.timeline.map((event) => (
              <li key={event.id} className="relative">
                <span className="font-medium">{event.label}</span>
                {event.schoolName && (
                  <span className="text-muted-foreground">
                    {" "}
                    — {event.schoolName}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {player.commitments.length > 0 && (
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold">Commitments</h2>
          <ul className="space-y-2">
            {player.commitments.map((commitment) => (
              <li key={commitment.id}>
                {commitment.schoolName}
                {commitment.classYear
                  ? ` (Class of ${commitment.classYear})`
                  : ""}
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
