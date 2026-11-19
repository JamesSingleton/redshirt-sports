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
import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronsUpDown } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import CustomImage from "@/components/sanity-image";

type SchoolOption = SchoolsBySportAndSubgroupingStringQueryResult[number];

type SchoolItem = {
  value: string;
  label: string;
  keywords: string[];
  school: SchoolOption | null;
  /** Its rank elsewhere on the ballot, when it's already on it. */
  rank?: number;
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

const ordinalRules = new Intl.PluralRules("en-US", { type: "ordinal" });
const suffixes: Record<Intl.LDMLPluralRule, string> = {
  zero: "th",
  one: "st",
  two: "nd",
  few: "rd",
  many: "th",
  other: "th",
};

/** 1 → "1st", 22 → "22nd". */
export function ordinal(rank: number) {
  return `${rank}${suffixes[ordinalRules.select(rank)]}`;
}

function toItem(school: SchoolOption, rank?: number): SchoolItem {
  return {
    rank,
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
          className="size-6 shrink-0 object-contain"
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
  /**
   * The whole ballot, one school id per rank with `""` for an empty one, so
   * schools already on it show where they are. Picking one moves it.
   */
  ballot: readonly string[];
  "aria-label"?: string;
  /** The trigger's id, so a form can focus it. */
  id?: string;
  /** What the trigger shows for a picked school, in place of its logo and name. */
  children?: ReactNode;
  triggerClassName?: string;
}

/** Pick one school for a ballot slot, searching by name, short name or abbreviation. */
export function VirtualizedCombobox({
  options,
  searchPlaceholder = "Select a school...",
  value = "",
  onChange,
  ballot,
  "aria-label": ariaLabel,
  id,
  children,
  triggerClassName,
}: VirtualizedComboboxProps) {
  const [button, setButton] = useState<HTMLButtonElement | null>(null);
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");

  const items = useMemo(
    () =>
      options.map((option) => {
        const index = option._id === value ? -1 : ballot.indexOf(option._id);
        return toItem(option, index === -1 ? undefined : index + 1);
      }),
    [options, ballot, value],
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
      onOpenChangeComplete={(open) => {
        if (open) return;
        // Return focus here unless the pick already moved it, like the
        // ballot focusing the rank a school went to.
        const active = document.activeElement;
        const moved =
          active && active !== document.body && !content?.contains(active);
        if (!moved) button?.focus();
      }}
      autoHighlight
      presentation="auto"
    >
      <ComboboxTrigger
        ref={setButton}
        id={id}
        aria-label={ariaLabel}
        className={cn("h-11 font-normal", triggerClassName)}
      >
        {selected ? (
          (children ?? <SchoolLabel school={selected} />)
        ) : (
          <span className="text-muted-foreground">{searchPlaceholder}</span>
        )}
        <ChevronsUpDown className="opacity-50" aria-hidden />
      </ComboboxTrigger>
      <ComboboxContent
        ref={setContent}
        anchor={button}
        className="max-h-[min(22rem,var(--available-height))]"
      >
        <ComboboxSearch
          autoFocus
          aria-label="Search schools"
          placeholder="Search by name or abbreviation"
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
                  {item.rank ? (
                    <span className="shrink-0 text-muted-foreground">
                      · currently {ordinal(item.rank)}
                    </span>
                  ) : null}
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
