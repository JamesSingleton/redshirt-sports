import type { Metadata } from "next";
import { Suspense } from "react";

import { BracketSkeleton } from "@/components/bracket/bracket-skeleton";
import { BracketBuilder } from "@/components/bracket/builder/bracket-builder";
import { bracketBuilderName } from "@/lib/bracket-builder";
import { bracketPaths, loadBracketBuilder } from "@/lib/bracket-data";
import {
  fetchGlobalSeoSettings,
  getPageMetadata,
} from "@/lib/global-seo-settings";

type Params = Promise<{ sport: string; division: string }>;

/**
 * The reader's own bracket for this season: pick the field, pick the winners,
 * save an image or print it. 404s where the division has no playoff format.
 */
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { sport, division } = await params;
  const model = await loadBracketBuilder({ sport, division });
  const name = bracketBuilderName(division, model.year);
  return getPageMetadata({
    title: `${name} Builder`,
    description: `Make your own ${name}: choose the teams, pick every winner, then download it as an image or print it. Blank printable bracket included.`,
    slug: bracketPaths(sport, division).builder,
  });
}

async function Builder({ params }: { params: Params }) {
  const { sport, division } = await params;
  // The settings are already fetched for this page's metadata.
  const [model, settings] = await Promise.all([
    loadBracketBuilder({ sport, division }),
    fetchGlobalSeoSettings(),
  ]);
  return <BracketBuilder model={model} logo={settings?.footerLogo} />;
}

export default function BracketBuilderPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<BracketSkeleton />}>
      <Builder params={params} />
    </Suspense>
  );
}
