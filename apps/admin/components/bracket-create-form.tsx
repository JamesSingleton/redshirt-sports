"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { Label } from "@redshirt-sports/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

import { createBracketEditionAction } from "@/actions/brackets";
import { bracketEditionName } from "@/lib/bracket-season";

type FormatOption = {
  id: string;
  label: string;
  seasonId: string | null;
  weeks: { id: string; number: number }[];
};

type EditionOption = {
  id: string;
  formatId: string;
  kind: "projection" | "official";
  weekNumber: number | null;
};

const NO_COPY = "none";

/** Opens a projection for a week, or the season's official bracket. */
export function BracketCreateForm({
  year,
  formats,
  editions,
}: {
  year: number;
  formats: FormatOption[];
  editions: EditionOption[];
}) {
  const router = useRouter();
  const id = useId();
  const [pending, startPending] = useTransition();
  const [formatId, setFormatId] = useState(formats[0]?.id ?? "");
  const [kind, setKind] = useState<"projection" | "official">("projection");
  const format = formats.find((item) => item.id === formatId);
  const sameFormat = editions.filter(
    (edition) => edition.formatId === formatId,
  );
  const taken = new Set(
    sameFormat.flatMap((edition) =>
      edition.weekNumber === null ? [] : [edition.weekNumber],
    ),
  );
  const openWeeks =
    format?.weeks.filter((week) => !taken.has(week.number)) ?? [];
  const [weekId, setWeekId] = useState("");
  // Newest field first: the latest projection is the usual starting point.
  const copyChoices = [...sameFormat].sort(
    (a, b) => (b.weekNumber ?? 99) - (a.weekNumber ?? 99),
  );
  const [copyFrom, setCopyFrom] = useState<string | null>(null);
  const copyValue =
    copyFrom ?? copyChoices.find((e) => e.kind === "projection")?.id ?? NO_COPY;

  if (formats.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No football bracket format covers {year}.
      </p>
    );
  }

  const chosenWeek = weekId || openWeeks.at(-1)?.id || "";
  const hasOfficial = sameFormat.some((edition) => edition.kind === "official");
  const canCreate =
    !!format?.seasonId &&
    (kind === "official" ? !hasOfficial : chosenWeek !== "");

  function create() {
    if (!format?.seasonId) return;
    startPending(async () => {
      const result = await createBracketEditionAction({
        formatId,
        seasonId: format.seasonId!,
        kind,
        weekId: kind === "projection" ? chosenWeek : null,
        copySlotsFrom: copyValue === NO_COPY ? null : copyValue,
      });
      if (!result.ok || !result.editionId) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push(`/brackets/${result.editionId}`);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-format`}>Format</Label>
        <Select value={formatId} onValueChange={setFormatId}>
          <SelectTrigger id={`${id}-format`} className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {formats.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label} {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-kind`}>Bracket</Label>
        <Select
          value={kind}
          onValueChange={(value) => setKind(value as typeof kind)}
        >
          <SelectTrigger id={`${id}-kind`} className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="projection">Weekly projection</SelectItem>
            <SelectItem value="official" disabled={hasOfficial}>
              {hasOfficial
                ? "Official bracket (already started below)"
                : "Official bracket"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {kind === "projection" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-week`}>After week</Label>
          <Select value={chosenWeek} onValueChange={setWeekId}>
            <SelectTrigger id={`${id}-week`} className="w-32">
              <SelectValue placeholder="No open week" />
            </SelectTrigger>
            <SelectContent>
              {openWeeks.map((week) => (
                <SelectItem key={week.id} value={week.id}>
                  Week {week.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-copy`}>Start from</Label>
        <Select value={copyValue} onValueChange={setCopyFrom}>
          <SelectTrigger id={`${id}-copy`} className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_COPY}>An empty field</SelectItem>
            {copyChoices.map((edition) => (
              <SelectItem key={edition.id} value={edition.id}>
                {bracketEditionName(edition)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={create} disabled={pending || !canCreate}>
        <IconPlus />
        {pending ? "Creating…" : "Create bracket"}
      </Button>
      {!format?.seasonId ? (
        <p className="text-destructive w-full text-sm">
          There is no {year} season for this sport yet.
        </p>
      ) : null}
    </div>
  );
}
