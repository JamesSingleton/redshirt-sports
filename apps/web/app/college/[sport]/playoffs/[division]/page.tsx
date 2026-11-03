import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BracketSkeleton } from "@/components/bracket/bracket-skeleton";
import { bracketPaths, getCachedBracketSeasons } from "@/lib/bracket-data";
import { getPageMetadata } from "@/lib/global-seo-settings";

type Params = Promise<{ sport: string; division: string }>;

function landingTitle(division: string) {
  return `${division.toUpperCase()} Playoff Brackets`;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { sport, division } = await params;
  return getPageMetadata({
    title: landingTitle(division),
    description: `Every ${division.toUpperCase()} playoff bracket from Redshirt Sports: weekly projections and the official field.`,
    slug: bracketPaths(sport, division).landing,
  });
}

/** Every season with a published bracket. Renders, never redirects. */
async function BracketSeasons({ params }: { params: Params }) {
  const { sport, division } = await params;
  const years = await getCachedBracketSeasons(sport, division);
  if (years.length === 0) notFound();
  const paths = bracketPaths(sport, division);

  return (
    <div className="mx-auto flex w-full max-w-site flex-col gap-6 px-4 py-6 pb-12 lg:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {landingTitle(division)}
      </h1>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {years.map((year, index) => (
          <li key={year}>
            <Link
              href={paths.season(year)}
              className="flex flex-col gap-1 rounded-lg border border-border p-4 hover:bg-muted"
            >
              <span className="font-display text-xl font-bold">{year}</span>
              <span className="text-muted-foreground text-sm">
                {index === 0 ? "Current bracket" : "Final bracket"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BracketSeasonsPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<BracketSkeleton />}>
      <BracketSeasons params={params} />
    </Suspense>
  );
}
