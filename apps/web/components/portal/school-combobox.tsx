"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxSearch,
  ComboboxTrigger,
} from "@redshirt-sports/ui/components/combobox";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import type { WireSchoolOption } from "@/components/portal/wire-format";
import { TeamMark } from "@/components/rankings/team-mark";

const ALL = "__all";

/** Pick one school from the schools on the wire, or all of them. */
export function SchoolCombobox({
  options,
  value,
  onChange,
  onOpen,
  className,
}: {
  /** Trigger styling, so it can match the toolbar around it. */
  className?: string;
  options: WireSchoolOption[];
  value: string;
  onChange: (value: string) => void;
  /** Called when the list opens, so the caller can load every school. */
  onOpen?: () => void;
}) {
  const [button, setButton] = useState<HTMLButtonElement | null>(null);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.key === value);

  return (
    <Combobox
      value={value || ALL}
      onValueChange={(next) => onChange(next === ALL || !next ? "" : next)}
      query={query}
      onQueryChange={setQuery}
      onOpenChange={(open) => {
        if (!open) return;
        setQuery("");
        onOpen?.();
      }}
      onOpenChangeComplete={(open) => !open && button?.focus()}
      autoHighlight="selected"
      presentation="auto"
    >
      <ComboboxTrigger
        ref={setButton}
        aria-label="School"
        className={cn("w-auto font-normal", className)}
      >
        <span className="truncate">
          {selected?.name ?? (value ? "Selected school" : "All schools")}
        </span>
        <ChevronsUpDown className="opacity-50" aria-hidden />
      </ComboboxTrigger>
      <ComboboxContent anchor={button} className="w-64">
        <ComboboxSearch
          autoFocus
          aria-label="Find a school"
          placeholder="Find a school"
        />
        <ComboboxEmpty>No school found.</ComboboxEmpty>
        <ComboboxList>
          <ComboboxItem value={ALL} label="All schools">
            All schools
          </ComboboxItem>
          {options.map((option) => (
            <ComboboxItem
              key={option.key}
              value={option.key}
              label={option.name}
            >
              <TeamMark
                image={option.school?.image ?? null}
                shortName={option.school?.shortName ?? option.name}
                abbreviation={option.school?.abbreviation}
                name={option.school?.name ?? option.name}
                size="xs"
              />
              <span className="truncate">{option.name}</span>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
