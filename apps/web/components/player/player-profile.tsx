import Link from "next/link";

import type { getPlayerBySlug } from "@redshirt-sports/db/queries/players";

type PlayerProfile = NonNullable<Awaited<ReturnType<typeof getPlayerBySlug>>>;

function formatHeight(inches: number | null): string {
  if (!inches) return "—";
  const feet = Math.floor(inches / 12);
  const remaining = inches % 12;
  return `${feet}'${remaining}"`;
}

function displayName(player: PlayerProfile) {
  return player.displayName ?? `${player.firstName} ${player.lastName}`.trim();
}

export function PlayerProfileView({ player }: { player: PlayerProfile }) {
  const name = displayName(player);

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b border-border bg-card">
        <div className="container max-w-5xl px-4 py-2 text-xs text-muted-foreground">
          <Link
            href={
              player.sportSlug
                ? `/recruiting/${player.sportSlug}`
                : "/recruiting"
            }
            className="hover:text-foreground"
          >
            Recruiting
          </Link>
          <span className="mx-2">·</span>
          <span className="font-semibold text-foreground">{name}</span>
        </div>
      </div>

      <div className="container max-w-5xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {player.headshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.headshotUrl}
                alt={name}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-muted text-4xl font-black text-muted-foreground">
                {player.firstName[0]}
                {player.lastName[0]}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold tracking-widest text-primary uppercase">
              {player.sportName ?? "Athlete"}
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">{name}</h1>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Position</dt>
                <dd className="font-medium">{player.position ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Class</dt>
                <dd className="font-medium">{player.classYear ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Height / Weight</dt>
                <dd className="font-medium">
                  {formatHeight(player.heightInches)}
                  {player.weightLbs ? ` · ${player.weightLbs} lbs` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Hometown</dt>
                <dd className="font-medium">{player.hometown ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">High School</dt>
                <dd className="font-medium">{player.highSchool ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium">
                  {player.currentStatus ?? "—"}
                  {player.schoolShortName || player.schoolName
                    ? ` · ${player.schoolShortName ?? player.schoolName}`
                    : null}
                </dd>
              </div>
            </dl>

            {player.bio ? (
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                {player.bio}
              </p>
            ) : null}
          </div>
        </div>

        {player.organizationHistory.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-xl font-bold tracking-tight">Journey</h2>
            <ol className="mt-4 space-y-3 border-l border-border pl-4">
              {player.organizationHistory.map((stop) => (
                <li key={stop.id} className="text-sm">
                  <p className="font-medium">
                    {stop.schoolShortName ?? stop.schoolName ?? "School"}
                  </p>
                  <p className="text-muted-foreground">
                    {stop.startYear}
                    {stop.endYear ? `–${stop.endYear}` : "–present"}
                    {stop.isTransfer ? " · Transfer" : ""}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {player.timeline.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-xl font-bold tracking-tight">Timeline</h2>
            <ul className="mt-4 space-y-2">
              {player.timeline.map((event) => (
                <li
                  key={event.id}
                  className="rounded-lg border border-border bg-card px-4 py-3 text-sm"
                >
                  <p className="font-medium">{event.label}</p>
                  {event.schoolName ? (
                    <p className="text-muted-foreground">{event.schoolName}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
