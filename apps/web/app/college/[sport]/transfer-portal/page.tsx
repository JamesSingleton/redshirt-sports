import { Badge } from "@redshirt-sports/ui/components/badge";
import type { Metadata } from "next";
import Link from "next/link";

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
      title: "Transfer portal",
      description: "Example transfer portal hub. Not linked from navigation.",
      slug: `/college/${sport}/transfer-portal`,
      noIndex: true,
    },
    "published",
  );
}

export default async function TransferPortalPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;

  return (
    <div className="max-w-site mx-auto px-4 py-8 lg:px-6">
      <div className="kicker text-primary">Transfer portal</div>
      <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight uppercase">
        {sport.replace("-", " ")} portal
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Example hub. Not in the main navigation.
      </p>
      <Link
        href={`/college/${sport}/transfer-portal/tracker`}
        className="text-primary mt-3 inline-block text-sm font-medium hover:underline"
        prefetch={false}
      >
        Open tracker
      </Link>
      <ul className="mt-6 divide-y rounded-xl border">
        {portalMoves.map((move) => (
          <li
            key={move.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <div className="font-semibold">{move.name}</div>
              <div className="text-muted-foreground text-sm">
                {move.pos} · {move.from} → {move.to}
              </div>
            </div>
            <Badge variant="secondary">{move.status}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
