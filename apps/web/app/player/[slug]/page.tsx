import { getPlayerBySlug } from "@redshirt-sports/db/queries";
import { getDynamicFetchOptions } from "@redshirt-sports/sanity/live";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlayerProfileView } from "@/components/player/player-profile";
import { getPageMetadata } from "@/lib/global-seo-settings";

function playerDisplayName(player: {
  displayName: string | null;
  firstName: string;
  lastName: string;
}) {
  return player.displayName ?? `${player.firstName} ${player.lastName}`.trim();
}

function bioExcerpt(bio: string | null, fallback: string) {
  if (!bio?.trim()) return fallback;
  const trimmed = bio.trim();
  if (trimmed.length <= 160) return trimmed;
  return `${trimmed.slice(0, 157).trimEnd()}...`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const [{ slug }, { perspective }] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);

  const player = await getPlayerBySlug(slug);
  if (!player) {
    return { title: "Player Not Found" };
  }

  const name = playerDisplayName(player);

  return getPageMetadata(
    {
      title: `${name} — ${player.position ?? "Player"} Profile`,
      description: bioExcerpt(
        player.bio,
        `${name} college ${player.sportName ?? "sports"} profile, recruiting updates, and transfer portal history.`,
      ),
      slug: `/player/${slug}`,
    },
    perspective,
  );
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const player = await getPlayerBySlug(slug);

  if (!player) {
    notFound();
  }

  return <PlayerProfileView player={player} />;
}
