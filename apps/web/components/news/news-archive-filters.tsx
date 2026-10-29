"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { NewsArchiveFilterSelect } from "@/components/news/news-archive-filter-select";
import {
  type NewsArchiveSearchParams,
  STORY_TYPE_OPTIONS,
} from "@/lib/news-archive";

export type NewsFilterDivision = {
  slug: string;
  name: string;
};

export type NewsFilterConference = {
  slug: string;
  name: string;
  divisionSlug: string;
  sportSlug?: string;
};

export function NewsArchiveFilters({
  sportSlug,
  divisions,
  conferences,
  initial,
  variant = "sport",
}: {
  sportSlug: string;
  divisions: NewsFilterDivision[];
  conferences: NewsFilterConference[];
  initial: NewsArchiveSearchParams;
  variant?: "sport" | "folder";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [storyType, setStoryType] = useState(initial.type ?? "");
  const [sort, setSort] = useState(initial.sort ?? "newest");
  const [query, setQuery] = useState(initial.q ?? "");

  const applyQueryFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (storyType) params.set("type", storyType);
    else params.delete("type");
    if (sort && sort !== "newest") params.set("sort", sort);
    else params.delete("sort");
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, query, router, searchParams, sort, storyType]);

  const onDivisionChange = (value: string) => {
    if (!value) {
      router.push(`/college/${sportSlug}/news`);
      return;
    }
    router.push(`/college/${sportSlug}/news/${value}`);
  };

  const onConferenceChange = (value: string) => {
    if (!value) return;
    const conf = conferences.find((c) => c.slug === value);
    if (!conf) return;
    router.push(`/college/${sportSlug}/news/${conf.divisionSlug}/${conf.slug}`);
  };

  return (
    <div className="pt-5">
      <form
        role="search"
        aria-label="Filter stories"
        className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/40 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          applyQueryFilters();
        }}
      >
        {variant === "sport" ? (
          <>
            <NewsArchiveFilterSelect
              id="news-f-div"
              label="Division"
              defaultValue=""
              onValueChange={onDivisionChange}
              allLabel="All divisions"
              options={divisions.map((division) => ({
                value: division.slug,
                label: division.name,
              }))}
            />
            <NewsArchiveFilterSelect
              id="news-f-conf"
              label="Conference"
              defaultValue=""
              onValueChange={onConferenceChange}
              allLabel="All conferences"
              options={conferences.map((conference) => ({
                value: conference.slug,
                label: conference.name,
              }))}
            />
          </>
        ) : null}
        <NewsArchiveFilterSelect
          id="news-f-type"
          label="Type"
          value={storyType}
          onValueChange={setStoryType}
          allLabel="All types"
          options={STORY_TYPE_OPTIONS.map((type) => ({
            value: type,
            label: type,
          }))}
        />
        <NewsArchiveFilterSelect
          id="news-f-sort"
          label="Sort"
          value={sort}
          onValueChange={setSort}
          allLabel="Newest first"
          includeAllOption={false}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
          ]}
        />
        <div className="grid min-w-56 flex-1 basis-56 gap-1">
          <label
            htmlFor="news-f-q"
            className="text-sm font-semibold text-muted-foreground"
          >
            Search headlines
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="news-f-q"
              type="search"
              placeholder="e.g. playoff, Big Sky"
              className="border-input h-9 w-full rounded-md border bg-background pr-3 pl-8 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <Button type="submit" size="default" className="h-9">
          Apply
        </Button>
      </form>
    </div>
  );
}
