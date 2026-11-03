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

export type BracketEditionOption = { href: string; label: string };

/**
 * Season and bracket dropdowns. Picking a season opens that season's current
 * bracket (official once published, else its newest projection).
 */
export function BracketEditionPicker({
  seasons,
  year,
  editions,
  currentHref,
}: {
  /** Newest first, each linking to that season's current bracket. */
  seasons: { year: number; href: string }[];
  year: number;
  /** The shown season's brackets: official first, then newest week. */
  editions: BracketEditionOption[];
  currentHref: string;
}) {
  const router = useRouter();
  const id = useId();
  const go = (href: string) =>
    router.push(href, { transitionTypes: [...NAV_LATERAL_TRANSITION] });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="grid gap-1">
        <Label htmlFor={`${id}-season`}>Season</Label>
        <Select
          value={String(year)}
          onValueChange={(value) => {
            const season = seasons.find(
              (option) => String(option.year) === value,
            );
            if (season && season.year !== year) go(season.href);
          }}
        >
          <SelectTrigger id={`${id}-season`} className="w-28">
            <SelectValue>{String(year)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {seasons.map((season) => (
              <SelectItem key={season.year} value={String(season.year)}>
                {season.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`${id}-bracket`}>Bracket</Label>
        <Select
          value={currentHref}
          onValueChange={(value) => {
            if (value !== currentHref) go(value);
          }}
        >
          <SelectTrigger id={`${id}-bracket`} className="w-44">
            <SelectValue>
              {editions.find((option) => option.href === currentHref)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {editions.map((option) => (
              <SelectItem key={option.href} value={option.href}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
