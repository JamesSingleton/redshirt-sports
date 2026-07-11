import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";
import { notFound, redirect } from "next/navigation";

import { CollegeNewsBreadcrumbs } from "@/components/college-news/college-news-breadcrumbs";
import { CollegeNewsConferenceFilter } from "@/components/college-news/college-news-conference-filter";
import { CollegeNewsPageShell } from "@/components/college-news/college-news-page-shell";
import { CollegeNewsPollWidget } from "@/components/college-news/college-news-poll-widget";
import { CollegeNewsSidebar } from "@/components/college-news/college-news-sidebar";
import {
  getDivisionNewsDescription,
  resolveDivisionRouteSlug,
} from "@/lib/college-news-config";
import { fetchCollegeNewsConferenceLayoutData } from "@/lib/college-news-layout-data";

export async function CollegeNewsConferenceLayout({
  sport,
  division,
  conference,
  perspective,
  stega,
  children,
}: DynamicFetchOptions & {
  sport: string;
  division: string;
  conference: string;
  children: React.ReactNode;
}) {
  const resolvedDivision = resolveDivisionRouteSlug(division);
  if (resolvedDivision !== division) {
    redirect(`/college/${sport}/news/${resolvedDivision}/${conference}`);
  }

  const layoutData = await fetchCollegeNewsConferenceLayoutData({
    sport,
    division: resolvedDivision,
    conference,
    perspective,
    stega,
  });

  if (!layoutData) {
    notFound();
  }

  const {
    sportTitle,
    divisionName,
    conferenceName,
    divisionNavLinks,
    conferences,
    pollWidget,
  } = layoutData;

  return (
    <CollegeNewsPageShell
      header={
        <CollegeNewsBreadcrumbs
          items={[
            {
              label: sportTitle,
              href: `/college/${sport}/news`,
            },
            {
              label: divisionName,
              href: `/college/${sport}/news/${division}`,
            },
            { label: conferenceName },
          ]}
        />
      }
      main={
        <>
          <header className="mb-6">
            <h1 className="text-2xl font-black text-foreground leading-tight md:text-3xl">
              {conferenceName} {sportTitle} News
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {getDivisionNewsDescription(division, divisionName, sportTitle)}
            </p>
          </header>

          <CollegeNewsConferenceFilter
            conferences={conferences}
            sport={sport}
            division={division}
            activeConference={conference}
          />

          {children}
        </>
      }
      sidebar={
        <CollegeNewsSidebar
          divisions={divisionNavLinks}
          activeDivisionSlug={division}
        >
          <CollegeNewsPollWidget data={pollWidget} />
        </CollegeNewsSidebar>
      }
    />
  );
}
