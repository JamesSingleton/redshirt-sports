"use client";

import { Button } from "@redshirt-sports/ui/components/button";
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
import * as React from "react";

/*
 * shadcn's date-and-time picker composition: a Calendar in a Popover for the
 * day and a time Input beside it. The value is a zone-free wall-clock string
 * ("2026-11-28T14:00", the `datetime-local` format), so the caller decides
 * which time zone it means.
 */

function parseDay(value: string | null) {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null;
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : undefined;
}

function dayString(day: Date) {
  return format(day, "yyyy-MM-dd");
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
  const [open, setOpen] = React.useState(false);
  const day = parseDay(value);
  const time = value?.slice(11, 16) || "";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            aria-label={dateLabel}
            disabled={disabled}
            className={cn(
              "w-36 justify-between font-normal",
              !day && "text-muted-foreground",
            )}
          >
            {day ? format(day, "EEE, MMM d") : "Pick a date"}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={day}
            defaultMonth={day}
            captionLayout="dropdown"
            onSelect={(next) => {
              setOpen(false);
              onChange(
                next ? `${dayString(next)}T${time || defaultTime}` : null,
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
            onChange(`${dayString(day)}T${event.target.value}`);
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
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}
