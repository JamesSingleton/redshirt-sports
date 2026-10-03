"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@redshirt-sports/ui/components/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { SearchIcon } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useTransition } from "react";

import {
  PORTAL_STATUS_LABELS,
  PORTAL_STATUS_OPTIONS,
} from "@/lib/transfer-portal-format";

const ALL = "all";

type Conference = { id: string; name: string | null; shortName: string | null };

export function WireFilters({
  year,
  years,
  positions,
  conferences,
}: {
  year: number;
  years: number[];
  positions: string[];
  conferences: Conference[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== ALL) next.set(key, value);
    else next.delete(key);
    const query = next.toString();
    startTransition(() => {
      router.replace(`${pathname}${query ? `?${query}` : ""}` as Route, {
        scroll: false,
      });
    });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("q");
    setParam("q", typeof value === "string" ? value.trim() : "");
  }

  return (
    <div
      className="flex flex-col gap-3 data-pending:opacity-70 md:flex-row md:flex-wrap md:items-center"
      data-pending={isPending ? "" : undefined}
    >
      <form role="search" onSubmit={handleSearch} className="md:w-64">
        <InputGroup className="bg-background">
          <InputGroupInput
            type="search"
            name="q"
            defaultValue={searchParams.get("q") ?? ""}
            placeholder="Search players"
            aria-label="Search players"
            autoComplete="off"
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </form>

      <div className="grid grid-cols-2 gap-3 md:flex">
        <Select
          value={String(year)}
          onValueChange={(value) => {
            if (value !== null) setParam("year", value);
          }}
        >
          <SelectTrigger aria-label="Portal year" className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("status") ?? ALL}
          onValueChange={(value) => {
            if (value !== null) setParam("status", value);
          }}
          items={{ [ALL]: "All statuses", ...PORTAL_STATUS_LABELS }}
        >
          <SelectTrigger aria-label="Status" className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {PORTAL_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {PORTAL_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("position") ?? ALL}
          onValueChange={(value) => {
            if (value !== null) setParam("position", value);
          }}
          items={{ [ALL]: "All positions" }}
        >
          <SelectTrigger aria-label="Position" className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All positions</SelectItem>
            {positions.map((position) => (
              <SelectItem key={position} value={position}>
                {position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("conference") ?? ALL}
          onValueChange={(value) => {
            if (value !== null) setParam("conference", value);
          }}
          items={[
            { value: ALL, label: "All conferences" },
            ...conferences.map((conference) => ({
              value: conference.id,
              label: conference.shortName ?? conference.name,
            })),
          ]}
        >
          <SelectTrigger aria-label="Conference" className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All conferences</SelectItem>
            {conferences.map((conference) => (
              <SelectItem key={conference.id} value={conference.id}>
                {conference.shortName ?? conference.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
