import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";
import { Suspense } from "react";

import { CollegeNewsArchiveFilters } from "@/components/news/college-news-archive-filters";
import { DivisionConferencePicker } from "@/components/news/division-conference-picker";
import { NewsArchiveFilters } from "@/components/news/news-archive-filters";
import {
  ConferencePickerSkeleton,
  NewsArchiveFilterBarSkeleton,
} from "@/components/news/news-archive-inline-skeletons";
import { buildCollegeNewsFilterOptions } from "@/lib/college-news-filters";
import type { NewsArchiveSearchParams } from "@/lib/news-archive";
import { getCachedGlobalNavigation } from "@/lib/news-archive/cached-global-navigation";
import { buildSportNewsFilterOptions } from "@/lib/sport-news-filters";

export async function CachedCollegeNewsFiltersInner({
  filterParams,
  perspective,
  stega,
}: DynamicFetchOptions & { filterParams: NewsArchiveSearchParams }) {
  "use cache";
  const navResponse = await getCachedGlobalNavigation({ perspective, stega });
  const { sports, divisions, conferences } = buildCollegeNewsFilterOptions(
    navResponse.data,
  );

  return (
    <CollegeNewsArchiveFilters
      sports={sports}
      divisions={divisions}
      conferences={conferences}
      initial={filterParams}
    />
  );
}

export function CollegeNewsFiltersSlot({
  filterParams,
  perspective,
  stega,
}: DynamicFetchOptions & { filterParams: NewsArchiveSearchParams }) {
  return (
    <Suspense
      fallback={<NewsArchiveFilterBarSkeleton filterBarSize="college" />}
    >
      <CachedCollegeNewsFiltersInner
        filterParams={filterParams}
        perspective={perspective}
        stega={stega}
      />
    </Suspense>
  );
}

export async function CachedSportNewsFiltersInner({
  sportSlug,
  filterParams,
  perspective,
  stega,
}: DynamicFetchOptions & {
  sportSlug: string;
  filterParams: NewsArchiveSearchParams;
}) {
  "use cache";
  const navResponse = await getCachedGlobalNavigation({ perspective, stega });
  const { divisions, conferences } = buildSportNewsFilterOptions(
    sportSlug,
    navResponse.data,
  );

  return (
    <NewsArchiveFilters
      sportSlug={sportSlug}
      divisions={divisions}
      conferences={conferences}
      initial={filterParams}
    />
  );
}

export function SportNewsFiltersSlot({
  sportSlug,
  filterParams,
  perspective,
  stega,
}: DynamicFetchOptions & {
  sportSlug: string;
  filterParams: NewsArchiveSearchParams;
}) {
  return (
    <Suspense fallback={<NewsArchiveFilterBarSkeleton filterBarSize="sport" />}>
      <CachedSportNewsFiltersInner
        sportSlug={sportSlug}
        filterParams={filterParams}
        perspective={perspective}
        stega={stega}
      />
    </Suspense>
  );
}

export function FolderConferencePickerSlot({
  sportSlug,
  divisionSlug,
  divisionLabel,
  activeConferenceSlug,
  perspective,
  stega,
}: DynamicFetchOptions & {
  sportSlug: string;
  divisionSlug: string;
  divisionLabel: string;
  activeConferenceSlug?: string;
}) {
  return (
    <Suspense fallback={<ConferencePickerSkeleton />}>
      <CachedFolderConferencePicker
        sportSlug={sportSlug}
        divisionSlug={divisionSlug}
        divisionLabel={divisionLabel}
        activeConferenceSlug={activeConferenceSlug}
        perspective={perspective}
        stega={stega}
      />
    </Suspense>
  );
}

export async function CachedFolderConferencePicker({
  sportSlug,
  divisionSlug,
  divisionLabel,
  activeConferenceSlug,
  perspective,
  stega,
}: DynamicFetchOptions & {
  sportSlug: string;
  divisionSlug: string;
  divisionLabel: string;
  activeConferenceSlug?: string;
}) {
  "use cache";
  const navResponse = await getCachedGlobalNavigation({ perspective, stega });
  const { conferences } = buildSportNewsFilterOptions(
    sportSlug,
    navResponse.data,
  );

  return (
    <DivisionConferencePicker
      sportSlug={sportSlug}
      divisionSlug={divisionSlug}
      divisionLabel={divisionLabel}
      conferences={conferences}
      activeConferenceSlug={activeConferenceSlug}
    />
  );
}

export function FolderNewsFiltersBelowHeaderSlot(
  props: DynamicFetchOptions & {
    sportSlug: string;
    filterParams: NewsArchiveSearchParams;
  },
) {
  return (
    <Suspense fallback={<NewsArchiveFilterBarSkeleton filterBarSize="sport" />}>
      <CachedFolderNewsFiltersBelowHeaderInner {...props} />
    </Suspense>
  );
}

export async function CachedFolderNewsFiltersBelowHeaderInner({
  sportSlug,
  filterParams,
  perspective,
  stega,
}: DynamicFetchOptions & {
  sportSlug: string;
  filterParams: NewsArchiveSearchParams;
}) {
  "use cache";
  const navResponse = await getCachedGlobalNavigation({ perspective, stega });
  const { divisions, conferences } = buildSportNewsFilterOptions(
    sportSlug,
    navResponse.data,
  );

  return (
    <NewsArchiveFilters
      variant="folder"
      sportSlug={sportSlug}
      divisions={divisions}
      conferences={conferences}
      initial={filterParams}
    />
  );
}
