import type { getPlayerBySlug } from "@redshirt-sports/db/queries/players";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import Link from "next/link";
import type { Graph } from "schema-dts";

import { JsonLdScript, websiteId } from "@/components/json-ld";
import { getBaseUrl } from "@/lib/get-base-url";

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

function buildPlayerJsonLd(player: PlayerProfile): Graph {
  const baseUrl = getBaseUrl();
  const name = displayName(player);
  const url = `${baseUrl}/player/${player.slug}`;
  const personId = `${url}#person`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name,
        description: player.bio ?? undefined,
        isPartOf: { "@id": websiteId },
        inLanguage: "en-US",
        mainEntity: { "@id": personId },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: baseUrl,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Recruiting",
              item: `${baseUrl}/recruiting`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name,
              item: url,
            },
          ],
        },
      },
      {
        "@type": "Person",
        "@id": personId,
        name,
        url,
        description: player.bio ?? undefined,
        jobTitle: player.position ?? "Athlete",
        ...(player.headshotUrl
          ? {
              image: player.headshotUrl,
            }
          : {}),
        ...(player.hometown
          ? {
              homeLocation: {
                "@type": "Place",
                name: player.hometown,
              },
            }
          : {}),
        ...(player.schoolName || player.schoolShortName
          ? {
              memberOf: {
                "@type": "SportsTeam",
                name: player.schoolShortName ?? player.schoolName ?? undefined,
              },
            }
          : {}),
        ...(player.sportName
          ? {
              knowsAbout: player.sportName,
            }
          : {}),
        additionalType: "https://schema.org/Athlete",
      },
    ],
  };
}

export function PlayerProfileView({ player }: { player: PlayerProfile }) {
  const name = displayName(player);
  const jsonLd = buildPlayerJsonLd(player);

  return (
    <div className="min-h-screen bg-muted/20">
      <JsonLdScript data={jsonLd} id={`player-json-ld-${player.slug}`} />
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
          <Card className="overflow-hidden py-0">
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
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs font-bold tracking-widest text-primary uppercase">
                {player.sportName ?? "Athlete"}
              </p>
              <h1 className="font-heading text-4xl leading-snug font-black tracking-tight">
                {name}
              </h1>
              {player.schoolShortName || player.schoolName ? (
                <CardDescription>
                  {player.schoolShortName ?? player.schoolName}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
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
                  <dd className="font-medium">{player.currentStatus ?? "—"}</dd>
                </div>
              </dl>

              {player.bio ? (
                <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                  {player.bio}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {player.organizationHistory.length > 0 ? (
          <Card className="mt-10">
            <CardHeader>
              <CardTitle>Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 border-l border-border pl-4">
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
            </CardContent>
          </Card>
        ) : null}

        {player.commitments.length > 0 ? (
          <Card className="mt-10">
            <CardHeader>
              <CardTitle>Commitments</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {player.commitments.map((commitment) => (
                  <li
                    key={commitment.id}
                    className="rounded-lg border border-border px-4 py-3 text-sm"
                  >
                    <p className="font-medium">
                      {commitment.schoolName ?? "School"}
                    </p>
                    <p className="text-muted-foreground">
                      {[
                        commitment.sportName,
                        commitment.classYear
                          ? `Class of ${commitment.classYear}`
                          : null,
                        commitment.committedAt
                          ? new Date(
                              commitment.committedAt,
                            ).toLocaleDateString()
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {player.timeline.length > 0 ? (
          <Card className="mt-10">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {player.timeline.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-lg border border-border px-4 py-3 text-sm"
                  >
                    <p className="font-medium">{event.label}</p>
                    {event.schoolName ? (
                      <p className="text-muted-foreground">
                        {event.schoolName}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
