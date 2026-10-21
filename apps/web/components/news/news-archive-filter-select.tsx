"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";

const ALL_VALUE = "__all__";

function toSelectValue(value: string) {
  return value === "" ? ALL_VALUE : value;
}

function fromSelectValue(value: string) {
  return value === ALL_VALUE ? "" : value;
}

export function NewsArchiveFilterSelect({
  id,
  label,
  value,
  defaultValue,
  onValueChange,
  allLabel,
  options,
  includeAllOption = true,
}: {
  id: string;
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange: (value: string) => void;
  allLabel: string;
  options: { value: string; label: string }[];
  includeAllOption?: boolean;
}) {
  const isControlled = value !== undefined;
  const mapIn = (raw: string) => (includeAllOption ? toSelectValue(raw) : raw);
  const mapOut = (raw: string) =>
    includeAllOption ? fromSelectValue(raw) : raw;
  const handleChange = (next: string) => onValueChange(mapOut(next));

  return (
    <div className="grid gap-1">
      <label
        htmlFor={id}
        className="text-xs font-semibold text-muted-foreground"
      >
        {label}
      </label>
      <Select
        {...(isControlled
          ? { value: mapIn(value), onValueChange: handleChange }
          : {
              defaultValue: mapIn(defaultValue ?? ""),
              onValueChange: handleChange,
            })}
      >
        <SelectTrigger
          id={id}
          className="h-9 w-full min-w-[9.5rem] bg-background"
        >
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          {includeAllOption ? (
            <SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>
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
