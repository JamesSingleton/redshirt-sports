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
import { IconCheck, IconSelector } from "@tabler/icons-react";
import { useState } from "react";

export type SchoolOption = {
  id: string;
  name: string | null;
  shortName: string | null;
};

function schoolLabel(school: SchoolOption) {
  return school.name ?? school.shortName ?? school.id;
}

export function SchoolCombobox({
  id,
  schools,
  value,
  onChange,
  placeholder = "Select a school",
  clearLabel,
}: {
  id?: string;
  schools: SchoolOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  /** When set, adds an option that clears the selection. */
  clearLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = schools.find((school) => school.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span
            className={cn("truncate", !selected && "text-muted-foreground")}
          >
            {selected ? schoolLabel(selected) : placeholder}
          </span>
          <IconSelector className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Search schools" />
          <CommandList>
            <CommandEmpty>No schools found.</CommandEmpty>
            <CommandGroup>
              {clearLabel ? (
                <CommandItem
                  value={`__clear ${clearLabel}`}
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <IconCheck
                    className={cn(value ? "opacity-0" : "opacity-100")}
                  />
                  {clearLabel}
                </CommandItem>
              ) : null}
              {schools.map((school) => (
                <CommandItem
                  key={school.id}
                  value={`${schoolLabel(school)} ${school.shortName ?? ""} ${school.id}`}
                  onSelect={() => {
                    onChange(school.id);
                    setOpen(false);
                  }}
                >
                  <IconCheck
                    className={cn(
                      value === school.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {schoolLabel(school)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
