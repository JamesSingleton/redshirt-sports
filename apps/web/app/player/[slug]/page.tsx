import {
  getPlayerBySlug,
  listPlayerSlugs,
} from "@redshirt-sports/db/queries/players";
import { getDynamicFetchOptions } from "@redshirt-sports/sanity/live";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlayerProfileView } from "@/components/player/player-profile";
import { getPageMetadata } from "@/lib/global-seo-settings";

export async function generateStaticParams() {
  try {
    const slugs = await listPlayerSlugs();
    return slugs.map(({ slug }) => ({ slug }));
  } catch {
    return [];
  }
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

  const name = player.displayName ?? `${player.firstName} ${player.lastName}`;

  return getPageMetadata(
    {
      title: `${name} — ${player.position ?? "Player"} Profile`,
      description:
        player.bio ??
        `${name} college ${player.sportName ?? "sports"} profile, recruiting updates, and transfer portal history.`,
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
