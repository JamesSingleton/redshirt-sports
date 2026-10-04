import type { PortalEntry } from "@redshirt-sports/db/queries";
import { Skeleton } from "@redshirt-sports/ui/components/skeleton";
import { ArrowRightIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import BreadCrumbs from "@/components/breadcrumbs";
import { SectionHeader } from "@/components/news/section-header";
import { PageTransition } from "@/components/page-transition";
import {
  PortalSchool,
  PortalSchoolLogo,
} from "@/components/transfer-portal/portal-school";
import { PortalStatusBadge } from "@/components/transfer-portal/portal-status-badge";
import { getCachedPlayer } from "@/lib/transfer-portal";
import {
  formatAcademicYear,
  formatHeight,
  formatPortalDate,
  formatWeight,
  PORTAL_STATUS_LABELS,
  playerFullName,
  portalSportLabel,
} from "@/lib/transfer-portal-format";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCachedPlayer(slug);
  if (!data) return {};
  const name = playerFullName(data.player);
  return {
    title: `${name} Transfer Portal Profile`,
    description: `${name} transfer portal history, commitments, and profile.`,
  };
}

const playerSkeleton = (
  <div className="flex flex-col">
    <div className="bg-card border-b">
      <div className="container flex flex-col gap-4 py-8">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-6 w-96 max-w-full" />
      </div>
    </div>
    <div className="container py-8">
      <Skeleton className="h-64 w-full max-w-3xl" />
    </div>
  </div>
);

export default function PlayerPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={playerSkeleton}>
      <PlayerContent params={params} />
    </Suspense>
  );
}

async function PlayerContent({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getCachedPlayer(slug);
  if (!data) {
    notFound();
  }

  const { player, history } = data;
  const sportLabel = portalSportLabel(player.sport.slug) ?? player.sport.name;
  const highSchool = player.highSchool
    ? [
        player.highSchool.name,
        [player.highSchool.city, player.highSchool.state]
          .filter(Boolean)
          .join(", "),
      ]
        .filter(Boolean)
        .join(", ")
    : null;
  const facts = [
    { label: "Position", value: player.position },
    {
      label: "Class",
      value: formatAcademicYear(player.academicYear, player.isRedshirt),
    },
    { label: "Height", value: formatHeight(player.heightInches) },
    { label: "Weight", value: formatWeight(player.weightLbs) },
    { label: "Hometown", value: player.hometown },
    { label: "High school", value: highSchool },
  ].filter((fact): fact is { label: string; value: string } =>
    Boolean(fact.value),
  );
  const current = history[0];

  return (
    <PageTransition>
      <header className="bg-card border-b">
        <div className="container flex flex-col gap-5 py-6 md:py-8">
          <BreadCrumbs
            breadCrumbPages={[
              {
                title: "Transfer portal",
                href: `/college/${player.sport.slug}/transfer-portal`,
              },
            ]}
          />
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-4">
              {current ? (
                <PortalSchoolLogo
                  school={current.toSchool ?? current.fromSchool}
                  size={72}
                  className="hidden sm:flex"
                />
              ) : null}
              <div className="flex flex-col gap-2">
                <p className="text-brand text-sm font-semibold">{sportLabel}</p>
                <h1 className="headline text-4xl text-balance md:text-5xl">
                  {playerFullName(player)}
                </h1>
              </div>
            </div>
            {current ? <PortalStatusBadge status={current.status} /> : null}
          </div>
          {facts.length > 0 ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
              {facts.map((fact) => (
                <div key={fact.label} className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">
                    {fact.label}
                  </dt>
                  <dd className="text-sm font-semibold">{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </header>

      <div className="container flex max-w-4xl flex-col gap-6 py-8 md:py-10">
        <SectionHeader id="portal-journey" title="Portal journey" />
        {history.length > 0 ? (
          <ol aria-labelledby="portal-journey" className="flex flex-col gap-4">
            {history.map((entry) => (
              <li key={entry.id}>
                <PortalJourneyCard entry={entry} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground">
            No transfer portal entries for this player yet.
          </p>
        )}
      </div>
    </PageTransition>
  );
}

function PortalJourneyCard({ entry }: { entry: PortalEntry }) {
  const steps = (
    [
      ["ENTERED", entry.enteredAt],
      ["COMMITTED", entry.committedAt],
      ["SIGNED", entry.signedAt],
      ["ENROLLED", entry.enrolledAt],
      ["WITHDRAWN", entry.withdrawnAt],
    ] as const
  ).flatMap(([status, date]) => (date ? [{ status, date }] : []));

  return (
    <article className="bg-card flex flex-col gap-5 rounded-md border p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="headline text-xl">{entry.portalYear} portal</h3>
        <PortalStatusBadge status={entry.status} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <PortalSchool school={entry.fromSchool} />
        <ArrowRightIcon
          aria-hidden
          className="text-muted-foreground size-4 shrink-0"
        />
        <PortalSchool
          school={entry.toSchool}
          fallback={entry.status === "WITHDRAWN" ? "Returning" : "Undecided"}
        />
      </div>
      <ol className="flex flex-col gap-3">
        {steps.map((step) => (
          <li key={step.status} className="flex gap-3">
            <span
              aria-hidden
              className="bg-brand mt-1.5 size-2 shrink-0 rounded-full"
            />
            <span className="flex flex-col">
              <span className="text-sm font-semibold">
                {PORTAL_STATUS_LABELS[step.status]}
              </span>
              <time
                dateTime={new Date(step.date).toISOString()}
                className="text-muted-foreground text-xs"
              >
                {formatPortalDate(step.date)}
              </time>
            </span>
          </li>
        ))}
      </ol>
      {entry.toSchool?.slug ? (
        <Link
          href={`/college/teams/${entry.toSchool.slug}` as Route}
          className="text-primary text-sm font-semibold hover:underline"
        >
          More {entry.toSchool.shortName ?? entry.toSchool.name} news
        </Link>
      ) : null}
    </article>
  );
}
