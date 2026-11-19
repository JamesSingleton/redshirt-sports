"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { whenSelected } from "@redshirt-sports/ui/lib/utils";
import { useRouter } from "next/navigation";

export interface WireScopeProps {
  sport: string;
  sports: Array<{ slug: string; label: string }>;
  year: number;
  /** Seasons with a wire, newest first. */
  years: number[];
  /** The season the bare URL shows. */
  currentYear: number;
}

/**
 * Season and sport. Each is its own URL, so picking one navigates; a
 * dropdown scales to any number of seasons where tabs don't.
 */
export function WireScope({
  sport,
  sports,
  year,
  years,
  currentYear,
  triggerClassName,
}: WireScopeProps & { triggerClassName?: string }) {
  const router = useRouter();
  const path = (nextSport: string, nextYear?: number) =>
    nextYear === undefined || nextYear === currentYear
      ? `/college/${nextSport}/transfer-portal`
      : `/college/${nextSport}/transfer-portal/${nextYear}`;

  return (
    <>
      <Select
        value={String(year)}
        onValueChange={whenSelected((value: string) =>
          router.push(path(sport, Number(value))),
        )}
      >
        <SelectTrigger aria-label="Season" className={triggerClassName}>
          <SelectValue>{year}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {years.map((item) => (
            <SelectItem key={item} value={String(item)}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={sport}
        // Another sport opens on its own newest season.
        onValueChange={whenSelected((value: string) =>
          router.push(path(value)),
        )}
      >
        <SelectTrigger aria-label="Sport" className={triggerClassName}>
          <SelectValue>
            {sports.find((item) => item.slug === sport)?.label ?? sport}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sports.map((item) => (
            <SelectItem key={item.slug} value={item.slug}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
