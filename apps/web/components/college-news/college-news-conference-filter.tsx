"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@redshirt-sports/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@redshirt-sports/ui/components/popover";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type CollegeNewsConferenceOption = {
  label: string;
  slug: string;
};

interface CollegeNewsConferenceFilterProps {
  conferences: CollegeNewsConferenceOption[];
  sport: string;
  division: string;
  activeConference?: string;
}

export function CollegeNewsConferenceFilter({
  conferences,
  sport,
  division,
  activeConference,
}: CollegeNewsConferenceFilterProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (conferences.length === 0) return null;

  const selected = conferences.find(
    (conference) => conference.slug === activeConference,
  );

  function handleSelect(slug: string) {
    setOpen(false);
    if (slug === "__all__") {
      router.push(`/college/${sport}/news/${division}`);
      return;
    }
    router.push(`/college/${sport}/news/${division}/${slug}`);
  }

  return (
    <div className="mb-6 flex items-center gap-3">
      <span
        id="conference-filter-label"
        className="shrink-0 text-xs font-bold text-muted-foreground uppercase tracking-wider"
      >
        Filter by Conference
      </span>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-labelledby="conference-filter-label"
            aria-haspopup="listbox"
            className="h-8 min-w-[200px] justify-between text-sm font-medium"
          >
            <span className="truncate">
              {selected ? selected.label : "All Conferences"}
            </span>
            <ChevronsUpDown
              className="ml-2 size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search conferences..."
              className="h-9 text-sm"
            />
            <CommandList>
              <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                No conference found.
              </CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="All Conferences"
                  onSelect={() => handleSelect("__all__")}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4 text-primary",
                      !activeConference ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden="true"
                  />
                  All Conferences
                </CommandItem>
                {conferences.map((conference) => (
                  <CommandItem
                    key={conference.slug}
                    value={conference.label}
                    onSelect={() => handleSelect(conference.slug)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4 text-primary",
                        activeConference === conference.slug
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                      aria-hidden="true"
                    />
                    {conference.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
