import { PUBLISHED_FETCH_OPTIONS } from "@redshirt-sports/sanity/live";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { TeamsDirectory } from "@/components/teams/teams-directory";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { getCachedTeamDirectory } from "@/lib/team-directory-data";

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = PUBLISHED_FETCH_OPTIONS;
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
  const teams = await getCachedTeamDirectory();

  return (
    <>
      <a
        href="#teams-grid"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to teams
      </a>
      <div className="border-b bg-gradient-to-b from-muted/60 to-background">
        <div className="mx-auto max-w-site px-4 pt-5 pb-6 lg:px-6">
          <nav
            className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
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
      <main
        id="main"
        className="mx-auto min-w-0 max-w-site overflow-x-clip px-4 lg:px-6"
        aria-busy="false"
      >
        <TeamsDirectory teams={teams} />
      </main>
    </>
  );
}
