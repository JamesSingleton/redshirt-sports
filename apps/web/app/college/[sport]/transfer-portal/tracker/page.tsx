import { Badge } from "@redshirt-sports/ui/components/badge";
import type { Metadata } from "next";

import { portalMoves } from "@/lib/mock/portal";
import { getPageMetadata } from "@/lib/global-seo-settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string }>;
}): Promise<Metadata> {
  const { sport } = await params;
  return getPageMetadata(
    {
      title: "Transfer portal tracker",
      description: "Example portal tracker rows. Not linked from navigation.",
      slug: `/college/${sport}/transfer-portal/tracker`,
      noIndex: true,
    },
    "published",
  );
}

export default async function PortalTrackerPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;

  return (
    <div className="max-w-site mx-auto px-4 py-8 lg:px-6">
      <div className="kicker text-primary">Tracker</div>
      <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight uppercase">
        {sport.replace("-", " ")} portal tracker
      </h1>
      <div className="portal-row-head text-muted-foreground kicker mt-6 px-3">
        <span style={{ gridArea: "name" }}>Player</span>
        <span style={{ gridArea: "pos" }}>Pos</span>
        <span style={{ gridArea: "schools" }}>Movement</span>
        <span style={{ gridArea: "status" }}>Status</span>
        <span style={{ gridArea: "story" }}>Date</span>
      </div>
      <ul className="mt-2 divide-y rounded-xl border">
        {portalMoves.map((move) => (
          <li key={move.id} className="portal-row px-3 py-3">
            <span
              className="bg-muted font-display flex size-10 items-center justify-center rounded-full text-xs font-bold"
              style={{ gridArea: "avatar" }}
            >
              {move.pos}
            </span>
            <span className="font-semibold" style={{ gridArea: "name" }}>
              {move.name}
            </span>
            <span
              className="text-muted-foreground text-xs"
              style={{ gridArea: "meta" }}
            >
              Example
            </span>
            <span className="text-sm font-medium" style={{ gridArea: "pos" }}>
              {move.pos}
            </span>
            <span className="text-sm" style={{ gridArea: "schools" }}>
              {move.from} → {move.to}
            </span>
            <Badge variant="secondary" style={{ gridArea: "status" }}>
              {move.status}
            </Badge>
            <span
              className="text-muted-foreground text-sm"
              style={{ gridArea: "date" }}
            >
              {move.date}
            </span>
            <span className="text-sm" style={{ gridArea: "story" }}>
              —
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
