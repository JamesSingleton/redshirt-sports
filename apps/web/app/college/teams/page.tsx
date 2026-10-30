import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { JsonLdScript } from "@/components/json-ld";
import { TeamsDirectory } from "@/components/teams/teams-directory";
import { draftAwarePage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { buildIndexedPageJsonLd } from "@/lib/page-json-ld";
import { getCachedTeamDirectory } from "@/lib/team-directory-data";
import CollegeTeamsLoading from "./loading";

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = await getDynamicFetchOptions();
  return getPageMetadata(
    {
      title: "College Teams",
      description:
        "Every school we've covered. Pick a team for news and rankings across football and basketball.",
      slug: "/college/teams",
    },
    perspective,
  );
}

export default async function CollegeTeamsPage() {
  return draftAwarePage(<CollegeTeamsLoading />, renderCollegeTeamsPage);
}

async function renderCollegeTeamsPage({
  perspective,
  stega,
}: DynamicFetchOptions) {
  const teams = await getCachedTeamDirectory({ perspective, stega });

  return (
    <>
      <JsonLdScript
        id="college-teams-json-ld"
        data={buildIndexedPageJsonLd({
          pageType: "CollectionPage",
          name: "College Teams",
          description:
            "Every school we've covered. Pick a team for news and rankings across football and basketball.",
          path: "/college/teams",
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: "Teams", path: "/college/teams" },
          ],
          items: teams.map((team) => ({
            name: team.name,
            path: `/college/teams/${team.slug}`,
          })),
        })}
      />
      <a
        href="#teams-grid"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to teams
      </a>
      <div className="border-b bg-gradient-to-b from-muted/60 to-background">
        <div className="mx-auto max-w-site px-4 pt-5 pb-6 lg:px-6">
          <nav
            className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-foreground" prefetch={false}>
              Home
            </Link>
            <ChevronRight className="size-3 shrink-0" aria-hidden />
            <span className="text-foreground">Teams</span>
          </nav>
          <h1 className="mt-3 font-display text-[2.4rem] font-extrabold uppercase leading-none lg:text-headline-lg">
            College Teams
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Every school we&apos;ve covered. Pick a team for its news and
            rankings across football and basketball.
          </p>
        </div>
      </div>
      <div
        className="mx-auto min-w-0 max-w-site overflow-x-clip px-4 lg:px-6"
        aria-busy="false"
      >
        <TeamsDirectory teams={teams} />
      </div>
    </>
  );
}
