import { parsePlayerSlugId, playerPath } from "@redshirt-sports/db/portal";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { LiveAdSlot } from "@/components/live-ad-slot";
import {
  playerPageDescription,
  playerPageTitle,
  sportsByActivity,
} from "@/components/portal/player-format";
import { PlayerProfile } from "@/components/portal/player-profile";
import { getPageMetadata } from "@/lib/global-seo-settings";
import {
  getCachedPortalCycles,
  getCachedPortalPlayer,
  getCachedPortalWire,
  isPortalSport,
  portalIsPublic,
} from "@/lib/portal-data";

export type PlayerParams = Promise<{ slugId: string }>;

/**
 * The published page for a URL segment, or null. Malformed ids never reach
 * the database.
 */
async function resolvePlayer(slugId: string) {
  const parsed = parsePlayerSlugId(slugId);
  if (!parsed) return null;
  const page = await getCachedPortalPlayer(parsed.id);
  return page ? { parsed, page } : null;
}

export async function playerMetadata(params: PlayerParams): Promise<Metadata> {
  if (!portalIsPublic()) return {};
  const { slugId } = await params;
  const resolved = await resolvePlayer(slugId);
  if (resolved?.page.kind !== "player") return {};
  const { data } = resolved.page;
  return getPageMetadata({
    title: playerPageTitle(data.doc, sportsByActivity(data.doc)[0]),
    description: playerPageDescription(data),
    slug: playerPath(data.doc),
    // Entered-only players stay out of search until they commit somewhere.
    noIndex: !data.indexable,
  });
}

/**
 * The profile at the player's one address. Unknown ids 404; merged ids
 * and stale slugs move for good. The shell has streamed by now, so these are
 * a noindex 404 and an instant refresh; the proxy turns them into real 404
 * and 301 responses.
 */
export async function PlayerRoute({ params }: { params: PlayerParams }) {
  const { slugId } = await params;
  const resolved = await resolvePlayer(slugId);
  if (!resolved) notFound();
  const { parsed, page } = resolved;
  if (page.kind === "redirect") permanentRedirect(playerPath(page));
  const { data } = page;
  if (parsed.slug !== data.doc.slug) {
    permanentRedirect(playerPath(data.doc));
  }

  const sports = data.doc.sports.filter((sport) =>
    isPortalSport(sport.sportSlug),
  );
  // The sidebar reads the cycle's wire, which the tracker has already cached,
  // and links to the tracker at its bare URL when the cycle is current.
  const [primary] = sportsByActivity(data.doc);
  const latest = primary?.recruitments[0];
  const tracked = primary && latest && isPortalSport(primary.sportSlug);
  const sidebar = tracked
    ? await Promise.all([
        getCachedPortalWire(primary.sportSlug, latest.cycleYear),
        getCachedPortalCycles(primary.sportSlug),
      ]).then(([wire, cycles]) =>
        wire ? { wire, currentCycle: cycles.current } : null,
      )
    : null;
  return (
    <PlayerProfile
      data={data}
      sidebar={sidebar}
      adSlot={
        <LiveAdSlot
          placement="player-sidebar"
          sportSlugs={sports.map((sport) => sport.sportSlug)}
          fetchOptions={{ perspective: "published", stega: false }}
          className="w-full max-w-[300px]"
        />
      }
    />
  );
}
