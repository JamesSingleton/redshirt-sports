"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@redshirt-sports/ui/components/combobox";
import { cn } from "@redshirt-sports/ui/lib/utils";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { FilterItem } from "@/components/news/filter-row";

export type FilterOption = {
  value: string;
  label: string;
  /** Extra search text, e.g. the full name behind an abbreviated label. */
  keywords?: string;
};

function matchesOption(option: FilterOption, query: string) {
  const needle = query.trim().toLowerCase();
  return [option.label, option.keywords].some((text) =>
    text?.toLowerCase().includes(needle),
  );
}

/**
 * Searchable single-select filter. The search box lives in the popup and
 * starts empty, so picking a new option never means clearing the current one.
 */
export function FilterCombobox({
  label,
  options,
  value,
  onValueChange,
  searchPlaceholder,
  pending = false,
  className,
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onValueChange: (value: string) => void;
  searchPlaceholder?: string;
  pending?: boolean;
  className?: string;
}) {
  const selected =
    options.find((option) => option.value === value) ?? options[0] ?? null;

  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={(next) => {
        if (next) onValueChange(next.value);
      }}
      itemToStringLabel={(option) => option.label}
      isItemEqualToValue={(option, current) => option.value === current.value}
      filter={matchesOption}
    >
      <ComboboxTrigger
        aria-label={`${label}: ${selected?.label ?? ""}`}
        aria-busy={pending || undefined}
        render={
          <Button
            variant="outline"
            className={cn(
              "bg-card w-full justify-between font-normal sm:w-64",
              className,
            )}
          />
        }
      >
        <span className="truncate">
          <span className="text-muted-foreground">{label}: </span>
          {selected?.label}
        </span>
      </ComboboxTrigger>
      <ComboboxContent align="end">
        <ComboboxInput
          showTrigger={false}
          placeholder={searchPlaceholder ?? `Search ${label.toLowerCase()}`}
        />
        <ComboboxEmpty>No matches.</ComboboxEmpty>
        <ComboboxList>
          {(option: FilterOption) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/** `FilterCombobox` whose options are listing URLs; picking one navigates. */
export function RouteFilterCombobox({
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
  const [isPending, startTransition] = useTransition();

  const fallback = items[0];
  if (!fallback) return null;

  return (
    <FilterCombobox
      label={label}
      options={items.map((item) => ({
        value: item.href,
        label: item.label,
        keywords: item.keywords,
      }))}
      value={activeHref ?? fallback.href}
      searchPlaceholder={searchPlaceholder}
      pending={isPending}
      onValueChange={(href) => {
        if (href === activeHref) return;
        startTransition(() => router.push(href as Route));
      }}
    />
  );
}
