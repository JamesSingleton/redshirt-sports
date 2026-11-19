"use client";

import { Button, buttonVariants } from "@redshirt-sports/ui/components/button";
import { Calendar } from "@redshirt-sports/ui/components/calendar";
import { Input } from "@redshirt-sports/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@redshirt-sports/ui/components/popover";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { format } from "date-fns";
import { ChevronDownIcon, XIcon } from "lucide-react";
import { useState } from "react";

/*
 * shadcn's date-and-time picker composition: a Calendar in a Popover for the
 * day and a time Input beside it. The value is a zone-free wall-clock string
 * ("2026-11-28T14:00", the `datetime-local` format), so the caller decides
 * which time zone it means.
 */

function parseDay(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;
}

function dayLabel(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return format(new Date(year!, month! - 1, date!), "EEE, MMM d");
}

type DateTimePickerProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  /** Used when a day is picked before a time. */
  defaultTime?: string;
  dateLabel?: string;
  timeLabel?: string;
  disabled?: boolean;
  className?: string;
};

export function DateTimePicker({
  value,
  onChange,
  defaultTime = "12:00",
  dateLabel = "Date",
  timeLabel = "Time",
  disabled,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const day = parseDay(value);
  const time = value?.slice(11, 16) || "";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label={dateLabel}
          disabled={disabled}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-36 justify-between font-normal",
            !day && "text-muted-foreground",
          )}
        >
          {day ? dayLabel(day) : "Pick a date"}
          <ChevronDownIcon aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            value={day}
            onValueChange={(next) => {
              setOpen(false);
              onChange(
                typeof next === "string"
                  ? `${next}T${time || defaultTime}`
                  : null,
              );
            }}
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        aria-label={timeLabel}
        disabled={disabled || !day}
        value={time}
        onChange={(event) => {
          if (day && event.target.value) {
            onChange(`${day}T${event.target.value}`);
          }
        }}
        className="w-28 appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
      />
      {day ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Clear ${dateLabel.toLowerCase()}`}
          disabled={disabled}
          onClick={() => onChange(null)}
        >
          <XIcon aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
