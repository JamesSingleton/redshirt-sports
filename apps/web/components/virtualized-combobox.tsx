"use client";

import type { SchoolsBySportAndSubgroupingStringQueryResult } from "@redshirt-sports/sanity/types";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxSearch,
  ComboboxTrigger,
} from "@redshirt-sports/ui/components/combobox";
import { ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import CustomImage from "@/components/sanity-image";

type SchoolOption = SchoolsBySportAndSubgroupingStringQueryResult[number];

type SchoolItem = {
  value: string;
  label: string;
  keywords: string[];
  school: SchoolOption | null;
};

const CLEAR = "__clear";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

/** Prefix matches on any name rank above matches inside one. */
export function schoolMatchScore(
  item: { value: string; label: string; keywords?: string[] },
  query: string,
) {
  const needle = normalize(query);
  if (!needle) return true;
  if (item.value === CLEAR) return false;
  const names = [item.label, ...(item.keywords ?? [])].map(normalize);
  if (names.some((name) => name.startsWith(needle))) return 2;
  if (names.some((name) => name.includes(needle))) return 1;
  return false;
}

function toItem(school: SchoolOption): SchoolItem {
  return {
    value: school._id,
    label: school.shortName ?? school.name,
    keywords: [school.name, school.abbreviation].filter(
      (name): name is string => Boolean(name),
    ),
    school,
  };
}

function SchoolLabel({ school }: { school: SchoolOption }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {school.image ? (
        <CustomImage
          image={school.image}
          width={32}
          height={32}
          className="size-7 shrink-0 object-contain"
        />
      ) : null}
      <span className="truncate">{school.shortName ?? school.name}</span>
    </span>
  );
}

interface VirtualizedComboboxProps {
  options: SchoolsBySportAndSubgroupingStringQueryResult;
  searchPlaceholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  /** Schools picked elsewhere on the ballot, left out of this list. */
  selectedOptions: string[];
  "aria-label"?: string;
}

/** Pick one school for a ballot slot, searching by name, short name or abbreviation. */
export function VirtualizedCombobox({
  options,
  searchPlaceholder = "Select a school...",
  value = "",
  onChange,
  selectedOptions,
  "aria-label": ariaLabel,
}: VirtualizedComboboxProps) {
  const [button, setButton] = useState<HTMLButtonElement | null>(null);
  const [query, setQuery] = useState("");

  const items = useMemo(
    () =>
      options
        .filter(
          (option) =>
            option._id === value || !selectedOptions.includes(option._id),
        )
        .map(toItem),
    [options, selectedOptions, value],
  );
  const listItems = useMemo(
    () =>
      value
        ? [
            {
              value: CLEAR,
              label: "Clear this pick",
              keywords: [],
              school: null,
            },
            ...items,
          ]
        : items,
    [items, value],
  );
  const selected = options.find((option) => option._id === value);

  return (
    <Combobox
      items={listItems}
      filter={schoolMatchScore}
      value={value || null}
      onValueChange={(next) => onChange?.(next === CLEAR || !next ? "" : next)}
      query={query}
      onQueryChange={setQuery}
      onOpenChange={(open) => open && setQuery("")}
      onOpenChangeComplete={(open) => !open && button?.focus()}
      autoHighlight
      presentation="auto"
    >
      <ComboboxTrigger
        ref={setButton}
        aria-label={ariaLabel}
        className="h-11 font-normal"
      >
        {selected ? (
          <SchoolLabel school={selected} />
        ) : (
          <span className="text-muted-foreground">{searchPlaceholder}</span>
        )}
        <ChevronsUpDown className="opacity-50" aria-hidden />
      </ComboboxTrigger>
      <ComboboxContent anchor={button}>
        <ComboboxSearch
          autoFocus
          aria-label="Search schools"
          placeholder={searchPlaceholder}
        />
        <ComboboxEmpty>No school found.</ComboboxEmpty>
        <ComboboxList>
          {(state) =>
            (state.items as SchoolItem[]).map((item) =>
              item.school ? (
                <ComboboxItem
                  key={item.value}
                  value={item.value}
                  label={item.label}
                >
                  <SchoolLabel school={item.school} />
                </ComboboxItem>
              ) : (
                <ComboboxItem
                  key={item.value}
                  value={item.value}
                  label={item.label}
                  indicator={false}
                  className="text-muted-foreground"
                >
                  {item.label}
                </ComboboxItem>
              ),
            )
          }
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
