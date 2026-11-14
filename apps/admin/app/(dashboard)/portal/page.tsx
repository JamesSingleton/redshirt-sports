import { Badge } from "@redshirt-sports/ui/components/badge";
import { Button } from "@redshirt-sports/ui/components/button";
import Link from "next/link";
import { Suspense } from "react";

import { getPortalDesk } from "@/actions/portal";
import { STATUS_LABELS } from "@/components/portal/labels";
import { PortalPushBar } from "@/components/portal/push-bar";

type SearchParams = Promise<{ pending?: string; before?: string }>;

function PortalFallback() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="bg-muted h-9 w-64 max-w-full animate-pulse rounded" />
      <div className="bg-muted h-14 w-full animate-pulse rounded-lg" />
      <div className="bg-muted h-80 w-full animate-pulse rounded-xl" />
    </div>
  );
}

async function PortalContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const pendingOnly = params.pending === "1";
  const before = Number(params.before);
  const beforeId =
    Number.isSafeInteger(before) && before > 0 ? before : undefined;
  const { pending, players } = await getPortalDesk({ pendingOnly, beforeId });
  const filter = pendingOnly ? "&pending=1" : "";
  const last = players.at(-1);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
            Transfer portal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Players</h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Add players and record their moves. Saves stay private until you
            push; sources are never published.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/portal/duplicates">Possible duplicates</Link>
          </Button>
          <Button asChild>
            <Link href="/portal/new">Add player</Link>
          </Button>
        </div>
      </div>

      <PortalPushBar pending={pending} />

      <div className="flex gap-2 text-sm">
        <Link
          href="/portal"
          className={
            pendingOnly
              ? "text-muted-foreground hover:underline"
              : "font-medium"
          }
        >
          All
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link
          href="/portal?pending=1"
          className={
            pendingOnly
              ? "font-medium"
              : "text-muted-foreground hover:underline"
          }
        >
          Not pushed
        </Link>
      </div>

      {players.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {pendingOnly ? "Nothing waiting to push." : "No players yet."}
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {players.map((player) => (
            <li key={player.id}>
              <Link
                href={`/portal/players/${player.id}`}
                className="hover:bg-muted/50 flex flex-wrap items-center gap-2 px-4 py-3"
              >
                <span className="font-medium">
                  {player.firstName} {player.lastName}
                  {player.suffix ? ` ${player.suffix}` : ""}
                </span>
                <span className="text-muted-foreground text-xs">
                  #{player.id}
                </span>
                {player.latest.map((row) => (
                  <Badge key={row.id} variant="secondary">
                    {row.sportSlug} {row.cycleYear}:{" "}
                    {STATUS_LABELS[row.status] ?? row.status}
                    {row.destinationName ? ` · ${row.destinationName}` : ""}
                  </Badge>
                ))}
                {player.pendingSince ? (
                  <Badge variant="outline">Not pushed</Badge>
                ) : null}
                {player.hiddenAt ? (
                  <Badge variant="destructive">Hidden</Badge>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-3 text-sm">
        {beforeId ? (
          <Link href={`/portal?${filter.slice(1)}`} className="hover:underline">
            Newest
          </Link>
        ) : null}
        {last && players.length === 50 ? (
          <Link
            href={`/portal?before=${last.id}${filter}`}
            className="hover:underline"
          >
            Older
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default function PortalPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<PortalFallback />}>
      <PortalContent searchParams={searchParams} />
    </Suspense>
  );
}
