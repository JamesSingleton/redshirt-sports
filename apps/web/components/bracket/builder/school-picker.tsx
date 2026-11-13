"use client";

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
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";

import { TeamMark } from "@/components/rankings/team-mark";
import type { BracketBuilderSchool } from "@/lib/bracket-data";

const row =
  "group flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 text-left outline-none";
const seedCell =
  "w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums";

/**
 * The control that fills one spot in the bracket, drawn as part of the card,
 * so the bracket stays in view while teams are chosen. An empty spot is a
 * whole "Choose team" row; a filled one gets a small switch button after the
 * team. Both open the same searchable list.
 */
export function SchoolPicker({
  slotLabel,
  seed,
  current,
  schools,
  placed,
  onPlace,
}: {
  /** "No. 5 seed", or how an unseeded spot is described. */
  slotLabel: string;
  /** Shown in the seed column of an empty row. */
  seed: number | null;
  current: BracketBuilderSchool | null;
  schools: BracketBuilderSchool[];
  /** School ids already somewhere in the bracket. */
  placed: ReadonlySet<string>;
  onPlace: (schoolId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const name = (school: BracketBuilderSchool) =>
    school.shortName ?? school.name ?? "School";

  function place(schoolId: string | null) {
    setOpen(false);
    onPlace(schoolId);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {current ? (
          <button
            type="button"
            aria-label={`Change the ${slotLabel}: ${name(current)}`}
            title="Change team"
            className="flex w-6 shrink-0 cursor-pointer items-center justify-center border-border border-l text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset aria-expanded:bg-accent aria-expanded:text-foreground"
          >
            <ChevronsUpDown className="size-3.5" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Choose the ${slotLabel}`}
            className={`${row} text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset aria-expanded:bg-accent`}
          >
            {seed === null ? null : <span className={seedCell}>{seed}</span>}
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/50 border-dashed transition-colors group-hover:border-foreground/60">
              <Plus className="size-3" aria-hidden />
            </span>
            <span className="truncate">Choose team</span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search for the ${slotLabel}…`} />
          <CommandList>
            <CommandEmpty>No school by that name.</CommandEmpty>
            <CommandGroup>
              {current ? (
                <CommandItem value="__remove__" onSelect={() => place(null)}>
                  <span className="text-muted-foreground">Remove team</span>
                </CommandItem>
              ) : null}
              {schools.map((school) => {
                const isCurrent = school.schoolId === current?.schoolId;
                return (
                  <CommandItem
                    key={school.schoolId}
                    value={`${name(school)} ${school.conference ?? ""}`}
                    onSelect={() => place(school.schoolId)}
                  >
                    <TeamMark
                      image={school.image}
                      shortName={school.shortName}
                      abbreviation={school.abbreviation}
                      name={school.name}
                      size="xs"
                    />
                    <span className="truncate">{name(school)}</span>
                    <span className="ml-auto flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                      {isCurrent ? (
                        <Check className="size-3.5" aria-label="Selected" />
                      ) : placed.has(school.schoolId) ? (
                        "Swap"
                      ) : (
                        school.conference
                      )}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
