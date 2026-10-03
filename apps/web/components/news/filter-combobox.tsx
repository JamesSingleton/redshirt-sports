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
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { FilterItem } from "@/components/news/filter-row";

/** Searchable dropdown of filter links; scales to long lists and small screens. */
export function FilterCombobox({
  label,
  items,
  activeHref,
  searchPlaceholder,
}: {
  label: string;
  items: FilterItem[];
  activeHref?: string;
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) return null;

  const active = items.find((item) => item.href === activeHref) ?? items[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={`${label}: ${active?.label}`}
            className="w-full justify-between sm:w-72"
            data-pending={isPending ? "" : undefined}
          />
        }
      >
        <span className="truncate">
          <span className="text-muted-foreground">{label}: </span>
          {active?.label}
        </span>
        <ChevronsUpDownIcon className="opacity-50" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--anchor-width) p-0 sm:w-72">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder ?? `Search ${label.toLowerCase()}`}
          />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.key}
                  value={`${item.label} ${item.key}`}
                  onSelect={() => {
                    setOpen(false);
                    if (item.href === activeHref) return;
                    startTransition(() => router.push(item.href as Route));
                  }}
                >
                  <CheckIcon
                    className={
                      item.href === active?.href ? "opacity-100" : "opacity-0"
                    }
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
