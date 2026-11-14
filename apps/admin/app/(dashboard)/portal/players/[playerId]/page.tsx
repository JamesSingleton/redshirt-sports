import { Badge } from "@redshirt-sports/ui/components/badge";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { getPortalPlayerPage } from "@/actions/portal";
import { PlayerDesk } from "@/components/portal/player-desk";
import { PortalPushBar } from "@/components/portal/push-bar";

type Params = Promise<{ playerId: string }>;

function PlayerFallback() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="bg-muted h-9 w-64 max-w-full animate-pulse rounded" />
      <div className="bg-muted h-14 w-full animate-pulse rounded-lg" />
      <div className="bg-muted h-96 w-full animate-pulse rounded-xl" />
    </div>
  );
}

async function PlayerContent({ params }: { params: Params }) {
  const { playerId } = await params;
  const id = Number(playerId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const page = await getPortalPlayerPage(id);
  if (!page) notFound();
  const { player } = page;
  if (player.mergedIntoId !== null)
    redirect(`/portal/players/${player.mergedIntoId}`);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/portal"
          className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase hover:underline"
        >
          Transfer portal
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {player.firstName} {player.lastName}
            {player.suffix ? ` ${player.suffix}` : ""}
          </h1>
          {player.pendingSince ? (
            <Badge variant="outline">Not pushed</Badge>
          ) : null}
          {player.hiddenAt ? <Badge variant="destructive">Hidden</Badge> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-muted-foreground font-mono text-xs">
            /players/{player.slug}-{player.id}
          </p>
          <Link
            href={`/portal/duplicates/compare?a=${player.id}`}
            className="text-muted-foreground text-xs hover:underline"
          >
            Merge with another player…
          </Link>
        </div>
      </div>
      <PortalPushBar pending={page.pending} />
      {/* Keyed on the data so every save resets the forms to what was saved. */}
      <PlayerDesk key={JSON.stringify(player)} page={page} />
    </div>
  );
}

export default function PortalPlayerPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<PlayerFallback />}>
      <PlayerContent params={params} />
    </Suspense>
  );
}
