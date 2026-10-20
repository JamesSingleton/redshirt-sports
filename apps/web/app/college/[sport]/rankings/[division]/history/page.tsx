import type { Metadata } from "next";

import { RankingsTabs } from "@/components/rankings/rankings-tabs";
import { getPageMetadata } from "@/lib/global-seo-settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; division: string }>;
}): Promise<Metadata> {
  const { sport, division } = await params;
  return getPageMetadata(
    {
      title: `${division.toUpperCase()} rankings history`,
      description: `Week-by-week history of the ${division.toUpperCase()} Redshirt Sports poll.`,
      slug: `/college/${sport}/rankings/${division}/history`,
    },
    "published",
  );
}

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ sport: string; division: string }>;
}) {
  const { sport, division } = await params;

  return (
    <div className="max-w-site mx-auto px-4 py-8 lg:px-6">
      <div className="kicker text-primary">
        Redshirt Sports Poll · {division.toUpperCase()}
      </div>
      <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight uppercase">
        History
      </h1>
      <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
        Season-long rank movement for the {division.toUpperCase()} Top 25.
        Team pages show each school&apos;s week-by-week line.
      </p>
      <RankingsTabs sport={sport} division={division} active="history" />
      <div className="mt-8 overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Week</th>
              <th className="px-4 py-3 font-semibold">No. 1</th>
              <th className="px-4 py-3 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-3" colSpan={3}>
                Open a published week from the Poll tab to see that week&apos;s
                full ranking. Historical No. 1 charts will fill in as seasons
                are archived.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
