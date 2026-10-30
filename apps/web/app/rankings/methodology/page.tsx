import {
  type DynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
} from "@redshirt-sports/sanity/live";
import type { Metadata } from "next";

import { SiteBreadcrumb } from "@/components/chrome/site-breadcrumb";
import { JsonLdScript } from "@/components/json-ld";
import { RankingsMethodologyContent } from "@/components/rankings/rankings-methodology-content";
import { loadAdvertisement } from "@/lib/advertisement";
import { draftAwarePage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { buildIndexedPageJsonLd } from "@/lib/page-json-ld";
import { RANKINGS_METHODOLOGY_PATH } from "@/lib/rankings-nav";

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = PUBLISHED_FETCH_OPTIONS;
  return getPageMetadata(
    {
      title: "How our Top 25 polls work",
      description:
        "Points, transparency, ballot windows, and outlier policy for every Redshirt Sports poll.",
      slug: RANKINGS_METHODOLOGY_PATH,
    },
    perspective,
  );
}

export default function RankingsMethodologyPage() {
  return draftAwarePage(null, CachedRankingsMethodologyPage);
}

async function CachedRankingsMethodologyPage({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";

  const advertisement = await loadAdvertisement({
    placement: "rankings-methodology-sidebar",
    fetchOptions: { perspective, stega },
  });

  return (
    <>
      <JsonLdScript
        id="rankings-methodology-json-ld"
        data={buildIndexedPageJsonLd({
          name: "How our Top 25 polls work",
          description:
            "Points, transparency, ballot windows, and outlier policy for every Redshirt Sports poll.",
          path: RANKINGS_METHODOLOGY_PATH,
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: "Methodology", path: RANKINGS_METHODOLOGY_PATH },
          ],
        })}
      />
      <div className="mx-auto max-w-site px-4 pb-14 lg:px-6">
        <div className="pt-5">
          <SiteBreadcrumb
            items={[{ label: "Home", href: "/" }, { label: "Methodology" }]}
          />
        </div>
        <div className="mt-3">
          <div className="kicker text-primary">Redshirt Sports Poll</div>
          <h1 className="font-display text-[2.3rem] font-extrabold uppercase leading-none lg:text-headline-lg">
            How the Top 25 works
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            The same rules for every Redshirt Sports Top 25, in every sport and
            division.
          </p>
        </div>
        <RankingsMethodologyContent advertisement={advertisement} />
      </div>
    </>
  );
}
