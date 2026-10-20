"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

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
            <div className="grid gap-1">
              <label
                htmlFor="news-f-div"
                className="text-xs font-semibold text-muted-foreground"
              >
                Division
              </label>
              <select
                id="news-f-div"
                className="border-input h-9 rounded-md border bg-background px-2.5 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                defaultValue=""
                onChange={(e) => onDivisionChange(e.target.value)}
              >
                <option value="">All divisions</option>
                {divisions.map((division) => (
                  <option key={division.slug} value={division.slug}>
                    {division.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <label
                htmlFor="news-f-conf"
                className="text-xs font-semibold text-muted-foreground"
              >
                Conference
              </label>
              <select
                id="news-f-conf"
                className="border-input h-9 rounded-md border bg-background px-2.5 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                defaultValue=""
                onChange={(e) => onConferenceChange(e.target.value)}
              >
                <option value="">All conferences</option>
                {conferences.map((conference) => (
                  <option key={conference.slug} value={conference.slug}>
                    {conference.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}
        <div className="grid gap-1">
          <label
            htmlFor="news-f-type"
            className="text-xs font-semibold text-muted-foreground"
          >
            Type
          </label>
          <select
            id="news-f-type"
            className="border-input h-9 rounded-md border bg-background px-2.5 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={storyType}
            onChange={(e) => setStoryType(e.target.value)}
          >
            <option value="">All types</option>
            {STORY_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label
            htmlFor="news-f-sort"
            className="text-xs font-semibold text-muted-foreground"
          >
            Sort
          </label>
          <select
            id="news-f-sort"
            className="border-input h-9 rounded-md border bg-background px-2.5 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <div className="grid min-w-56 flex-1 basis-56 gap-1">
          <label
            htmlFor="news-f-q"
            className="text-xs font-semibold text-muted-foreground"
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
