import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PlayerProfileSkeleton } from "@/components/portal/player-profile";
import {
  type PlayerParams,
  PlayerRoute,
  playerMetadata,
} from "@/components/portal/player-route";
import { portalIsPublic } from "@/lib/portal-data";

export function generateMetadata({
  params,
}: {
  params: PlayerParams;
}): Promise<Metadata> {
  return playerMetadata(params);
}

export default function PlayerPage({ params }: { params: PlayerParams }) {
  // Static: the switch is read at build time, so a hidden portal is a real 404.
  if (!portalIsPublic()) notFound();
  return (
    <Suspense fallback={<PlayerProfileSkeleton />}>
      <PlayerRoute params={params} />
    </Suspense>
  );
}
