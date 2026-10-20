"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@redshirt-sports/ui/components/popover";
import { ListFilter, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { NewsFilterConference } from "@/components/news/news-archive-filters";

export function DivisionConferencePicker({
  sportSlug,
  divisionSlug,
  divisionLabel,
  conferences,
  activeConferenceSlug,
}: {
  sportSlug: string;
  divisionSlug: string;
  divisionLabel: string;
  conferences: NewsFilterConference[];
  activeConferenceSlug?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const divisionConferences = useMemo(
    () => conferences.filter((c) => c.divisionSlug === divisionSlug),
    [conferences, divisionSlug],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return divisionConferences;
    return divisionConferences.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
  }, [divisionConferences, search]);

  const popular = divisionConferences.slice(0, 5);
  const active = divisionConferences.find((c) => c.slug === activeConferenceSlug);
  const triggerLabel = active?.name ?? `All conferences`;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 px-3 font-medium"
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <ListFilter className="size-4" aria-hidden />
            {triggerLabel}
            <span className="text-xs text-muted-foreground">
              ({divisionConferences.length})
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] p-0" align="start">
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="size-4 opacity-50" aria-hidden />
            <label htmlFor="conf-picker-search" className="sr-only">
              Search conferences
            </label>
            <input
              id="conf-picker-search"
              type="search"
              placeholder="Search conferences…"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ul
            role="listbox"
            aria-label={`${divisionLabel} conferences`}
            className="max-h-72 overflow-y-auto p-1"
          >
            <li>
              <Link
                href={`/college/${sportSlug}/news/${divisionSlug}`}
                className="flex rounded-sm px-2 py-1.5 text-sm font-semibold hover:bg-accent"
                prefetch={false}
                onClick={() => setOpen(false)}
              >
                All {divisionLabel} conferences
              </Link>
            </li>
            {filtered.map((conference) => (
              <li key={conference.slug} role="option" aria-selected={conference.slug === activeConferenceSlug}>
                <Link
                  href={`/college/${sportSlug}/news/${divisionSlug}/${conference.slug}`}
                  className="flex items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                  prefetch={false}
                  onClick={() => setOpen(false)}
                >
                  <span>{conference.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
      {popular.length > 0 ? (
        <>
          <span className="text-xs text-muted-foreground">Popular:</span>
          {popular.map((conference) => (
            <Link
              key={conference.slug}
              href={`/college/${sportSlug}/news/${divisionSlug}/${conference.slug}`}
              className="inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
              prefetch={false}
            >
              {conference.name.length > 12
                ? conference.name.split(" ")[0]
                : conference.name}
            </Link>
          ))}
        </>
      ) : null}
    </div>
  );
}
