"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { Search } from "lucide-react";

import { NewsArchiveFilterSelect } from "@/components/news/news-archive-filter-select";
import { STORY_TYPE_OPTIONS } from "@/lib/news-archive";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

function ignore() {}

/**
 * The filter bar's static shell: the same fields as `NewsArchiveFilters` and
 * `CollegeNewsArchiveFilters`, without their options, inert until the real
 * bar streams in. It is built from the same parts so it is the same size at
 * every width and the stories below it don't move when the real bar arrives.
 * (Every value a field can show fits inside the select's minimum width, so
 * the bar's size doesn't depend on which filters are set.)
 */
export function NewsArchiveFilterBarPlaceholder({
  variant,
}: {
  variant: "college" | "sport" | "folder";
}) {
  const field = (name: string) => `news-placeholder-${name}`;
  return (
    <div className="pt-5" aria-hidden inert>
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/40 p-3">
        {variant === "college" ? (
          <NewsArchiveFilterSelect
            id={field("sport")}
            label="Sport"
            defaultValue=""
            onValueChange={ignore}
            allLabel="All sports"
            options={[]}
          />
        ) : null}
        {variant !== "folder" ? (
          <>
            <NewsArchiveFilterSelect
              id={field("div")}
              label="Division"
              defaultValue=""
              onValueChange={ignore}
              allLabel="All divisions"
              options={[]}
            />
            <NewsArchiveFilterSelect
              id={field("conf")}
              label="Conference"
              defaultValue=""
              onValueChange={ignore}
              allLabel="All conferences"
              options={[]}
            />
          </>
        ) : null}
        <NewsArchiveFilterSelect
          id={field("type")}
          label="Type"
          defaultValue=""
          onValueChange={ignore}
          allLabel="All types"
          options={STORY_TYPE_OPTIONS}
        />
        <NewsArchiveFilterSelect
          id={field("sort")}
          label="Sort"
          defaultValue="newest"
          onValueChange={ignore}
          allLabel="Newest first"
          includeAllOption={false}
          options={SORT_OPTIONS}
        />
        <div className="grid min-w-56 flex-1 basis-56 gap-1">
          <span className="text-sm font-semibold text-muted-foreground">
            Search headlines
          </span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <div className="border-input h-9 w-full rounded-md border bg-background shadow-xs" />
          </div>
        </div>
        <Button type="button" size="default" className="h-9" tabIndex={-1}>
          Apply
        </Button>
      </div>
    </div>
  );
}
