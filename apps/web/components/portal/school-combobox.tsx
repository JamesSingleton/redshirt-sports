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
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.key === value);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) onOpen?.();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="School"
          className={cn("justify-between font-normal", className)}
        >
          <span className="truncate">
            {selected?.name ?? (value ? "Selected school" : "All schools")}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Find a school" />
          <CommandList>
            <CommandEmpty>No school found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={ALL}
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn("size-4", value ? "opacity-0" : "opacity-100")}
                  aria-hidden
                />
                All schools
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.key}
                  value={`${option.name} ${option.key}`}
                  onSelect={() => {
                    onChange(option.key);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4",
                      option.key === value ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                  <TeamMark
                    image={option.school?.image ?? null}
                    shortName={option.school?.shortName ?? option.name}
                    abbreviation={option.school?.abbreviation}
                    name={option.school?.name ?? option.name}
                    size="xs"
                  />
                  <span className="truncate">{option.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
