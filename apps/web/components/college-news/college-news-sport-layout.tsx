import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";
import { notFound } from "next/navigation";

import { CollegeNewsBreadcrumbs } from "@/components/college-news/college-news-breadcrumbs";
import { CollegeNewsPageShell } from "@/components/college-news/college-news-page-shell";
import { CollegeNewsPollWidget } from "@/components/college-news/college-news-poll-widget";
import { CollegeNewsSidebar } from "@/components/college-news/college-news-sidebar";
import { getSportNewsDescription } from "@/lib/college-news-config";
import { fetchCollegeNewsSportLayoutData } from "@/lib/college-news-layout-data";

export async function CollegeNewsSportLayout({
  sport,
  perspective,
  stega,
  children,
}: DynamicFetchOptions & {
  sport: string;
  children: React.ReactNode;
}) {
  const layoutData = await fetchCollegeNewsSportLayoutData({
    sport,
    perspective,
    stega,
  });

  if (!layoutData) {
    notFound();
  }

  const { sportTitle, divisionNavLinks, pollWidget } = layoutData;

  return (
    <CollegeNewsPageShell
      header={<CollegeNewsBreadcrumbs items={[{ label: sportTitle }]} />}
      main={
        <>
          <header className="mb-6">
            <h1 className="text-2xl font-black text-foreground leading-tight md:text-3xl">
              College {sportTitle} News
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {getSportNewsDescription(sport, sportTitle)}
            </p>
          </header>
          {children}
        </>
      }
      sidebar={
        <CollegeNewsSidebar divisions={divisionNavLinks}>
          <CollegeNewsPollWidget data={pollWidget} />
        </CollegeNewsSidebar>
      }
    />
  );
}
