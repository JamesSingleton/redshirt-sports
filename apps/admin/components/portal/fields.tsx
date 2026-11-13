"use client";

import {
  EVENT_SOURCE_TYPES,
  POSITIONS_BY_SPORT,
} from "@redshirt-sports/db/portal";
import { Input } from "@redshirt-sports/ui/components/input";
import { Label } from "@redshirt-sports/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { useEffect, useId, useState } from "react";

import { findPortalSchools } from "@/actions/portal";
import { SOURCE_LABELS } from "@/components/portal/labels";

export {
  EVENT_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
} from "@/components/portal/labels";

/** The cycle a move belongs to: the season the player would next play. */
export function defaultCycleYear(now = new Date()) {
  return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
}

/** `datetime-local` value for now, in the browser's time zone. */
export function localNow(now = new Date()) {
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

/** A `datetime-local` value (browser time) as an ISO instant for the server. */
export function localToIso(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

const NONE = "__none";

export function OptionSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Not set",
  allowNone = true,
  className = "w-44",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
  allowNone?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value || (allowNone ? NONE : undefined)}
        onValueChange={(next) => onChange(next === NONE ? "" : next)}
      >
        <SelectTrigger id={id} className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowNone ? (
            <SelectItem value={NONE}>{placeholder}</SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  className = "w-44",
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className={className}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </div>
  );
}

export interface SchoolValue {
  schoolId: string | null;
  schoolName: string | null;
  /** What the field shows. */
  label: string;
}

export const EMPTY_SCHOOL: SchoolValue = {
  schoolId: null,
  schoolName: null,
  label: "",
};

/**
 * Pick a school from the database (so the site shows its logo), or keep the
 * typed name for a school we don't have (NAIA, JUCO).
 */
export function SchoolPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SchoolValue;
  onChange: (value: SchoolValue) => void;
}) {
  const id = useId();
  const [query, setQuery] = useState(value.label);
  const [results, setResults] = useState<
    Awaited<ReturnType<typeof findPortalSchools>>
  >([]);
  const [open, setOpen] = useState(false);

  useEffect(() => setQuery(value.label), [value.label]);

  useEffect(() => {
    const needle = query.trim();
    if (!open || needle.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const found = await findPortalSchools(needle);
      if (!cancelled) setResults(found);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  const typed = query.trim();
  return (
    <div className="relative flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className="w-64"
        autoComplete="off"
        value={query}
        placeholder="Search schools"
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange(EMPTY_SCHOOL);
        }}
      />
      {value.schoolId === null && value.schoolName ? (
        <p className="text-muted-foreground text-xs">
          Not in our schools; shows with a generic crest.
        </p>
      ) : null}
      {open && typed.length >= 2 ? (
        <ul className="bg-popover absolute top-full z-20 mt-1 w-72 overflow-hidden rounded-md border shadow-md">
          {results.map((school) => (
            <li key={school.id}>
              <button
                type="button"
                className="hover:bg-accent w-full px-3 py-2 text-left text-sm"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  const name = school.name ?? school.shortName ?? school.id;
                  onChange({
                    schoolId: school.id,
                    schoolName: null,
                    label: name,
                  });
                  setOpen(false);
                }}
              >
                {school.name}
                {school.shortName && school.shortName !== school.name ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {school.shortName}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="hover:bg-accent text-muted-foreground w-full border-t px-3 py-2 text-left text-sm"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange({ schoolId: null, schoolName: typed, label: typed });
                setOpen(false);
              }}
            >
              Use “{typed}” (not in our schools)
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

export interface SourceValue {
  sourceType: string;
  sourceUrl: string;
  sourceNote: string;
}

export const EMPTY_SOURCE: SourceValue = {
  sourceType: "",
  sourceUrl: "",
  sourceNote: "",
};

export function sourcePayload(source: SourceValue) {
  return {
    sourceType: source.sourceType || null,
    sourceUrl: source.sourceUrl || null,
    sourceNote: source.sourceNote || null,
  };
}

/** Where we heard it. Private: never published. */
export function SourceFields({
  value,
  onChange,
}: {
  value: SourceValue;
  onChange: (value: SourceValue) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <OptionSelect
        label="Source (private)"
        value={value.sourceType}
        onChange={(sourceType) => onChange({ ...value, sourceType })}
        options={EVENT_SOURCE_TYPES.map((type) => ({
          value: type,
          label: SOURCE_LABELS[type],
        }))}
      />
      <TextField
        label="Link (optional)"
        type="url"
        placeholder="https://"
        className="w-64"
        value={value.sourceUrl}
        onChange={(sourceUrl) => onChange({ ...value, sourceUrl })}
      />
      <TextField
        label="Note (optional)"
        className="w-64"
        value={value.sourceNote}
        onChange={(sourceNote) => onChange({ ...value, sourceNote })}
      />
    </div>
  );
}

export function positionOptions(sportSlug: string | undefined) {
  return (POSITIONS_BY_SPORT[sportSlug ?? ""] ?? []).map((position) => ({
    value: position.code,
    label: `${position.code} · ${position.label}`,
  }));
}
