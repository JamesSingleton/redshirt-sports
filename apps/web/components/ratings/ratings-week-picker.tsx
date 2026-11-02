"use client";
import { Label } from "@redshirt-sports/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { useRouter } from "next/navigation";
import { useId } from "react";

import { NAV_LATERAL_TRANSITION } from "@/lib/view-transition-nav";

export type PickerWeek = { year: number; segment: string; label: string };

/**
 * Season and week dropdowns that scale to any number of seasons. Picking a
 * season goes straight to that season's latest published week.
 * `basePath` is the pool's ratings path; `suffix` keeps you on the same view
 * (e.g. "/team-sheets").
 */
export function RatingsWeekPicker({
  weeks,
  year,
  segment,
  basePath,
  suffix = "",
}: {
  /** Every published week, newest first. */
  weeks: PickerWeek[];
  year: number;
  segment: string;
  basePath: string;
  suffix?: string;
}) {
  const router = useRouter();
  const id = useId();
  const years = [...new Set(weeks.map((week) => week.year))];
  const seasonWeeks = weeks.filter((week) => week.year === year).reverse();
  const go = (nextYear: number, nextSegment: string) =>
    router.push(`${basePath}/${nextYear}/${nextSegment}${suffix}`, {
      transitionTypes: [...NAV_LATERAL_TRANSITION],
    });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="grid gap-1">
        <Label htmlFor={`${id}-season`}>Season</Label>
        <Select
          value={String(year)}
          onValueChange={(value) => {
            const latest = weeks.find((week) => String(week.year) === value);
            if (latest && value !== String(year))
              go(latest.year, latest.segment);
          }}
        >
          <SelectTrigger id={`${id}-season`} className="w-28">
            <SelectValue>{String(year)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {years.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`${id}-week`}>Week</Label>
        <Select
          value={segment}
          onValueChange={(value) => {
            if (value !== segment) go(year, value);
          }}
        >
          <SelectTrigger id={`${id}-week`} className="w-36">
            <SelectValue>
              {seasonWeeks.find((week) => week.segment === segment)?.label ??
                segment}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {seasonWeeks.map((week) => (
              <SelectItem key={week.segment} value={week.segment}>
                {week.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
