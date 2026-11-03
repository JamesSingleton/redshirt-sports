"use client";

import { Badge } from "@redshirt-sports/ui/components/badge";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@redshirt-sports/ui/components/command";
import { DateTimePicker } from "@redshirt-sports/ui/components/date-time-picker";
import { Input } from "@redshirt-sports/ui/components/input";
import { Label } from "@redshirt-sports/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@redshirt-sports/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { cn } from "@redshirt-sports/ui/lib/utils";
import {
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconSelector,
  IconTrash,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  type BracketActionResult,
  deleteBracketEditionAction,
  saveBracketDetailsAction,
  saveBracketGameAction,
  saveBracketSlotAction,
  setBracketStatusAction,
} from "@/actions/brackets";

export type EditorSlot = {
  key: string;
  seed: number | null;
  showSeed: boolean;
  schoolId: string | null;
  bidType: "auto" | "at-large" | null;
  bidLabel: string | null;
};

export type EditorGame = {
  key: string;
  roundLabel: string;
  sideALabel: string;
  sideBLabel: string;
  homeSide: "a" | "b" | null;
  siteLabel: string | null;
  kickoffAt: string | null;
  sideAScore: number | null;
  sideBScore: number | null;
};

export type EditorSchool = {
  id: string;
  name: string | null;
  shortName: string | null;
  conference: string | null;
};

/** Rating-pool conference names that differ from the bid labels we print. */
const CONFERENCE_LABELS: Record<string, string> = { Southern: "SoCon" };

function conferenceLabel(conference: string | null) {
  return conference ? (CONFERENCE_LABELS[conference] ?? conference) : null;
}

type ComboboxOption = { value: string; label: string; hint?: string | null };

/**
 * Searchable picker (shadcn Popover + Command). With `allowCustom`, typed text
 * that matches no option can be used as the value.
 */
function Combobox({
  label,
  value,
  options,
  placeholder,
  emptyLabel,
  allowCustom = false,
  disabled,
  className,
  onChange,
}: {
  label: string;
  value: string | null;
  options: ComboboxOption[];
  placeholder: string;
  /** Adds a first item that clears the value. */
  emptyLabel?: string;
  allowCustom?: boolean;
  disabled?: boolean;
  className?: string;
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((option) => option.value === value);
  const typed = search.trim();
  const canUseTyped =
    allowCustom &&
    typed !== "" &&
    !options.some(
      (option) => option.label.toLowerCase() === typed.toLowerCase(),
    );

  function pick(next: string | null) {
    setOpen(false);
    setSearch("");
    if (next !== value) onChange(next);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          disabled={disabled}
          className={cn("justify-between font-normal", className)}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {selected?.label ?? value ?? placeholder}
          </span>
          <IconSelector className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No match.</CommandEmpty>
            <CommandGroup>
              {emptyLabel && value ? (
                <CommandItem value="__clear__" onSelect={() => pick(null)}>
                  <span className="text-muted-foreground">{emptyLabel}</span>
                </CommandItem>
              ) : null}
              {canUseTyped ? (
                <CommandItem
                  value={`__custom__ ${typed}`}
                  onSelect={() => pick(typed)}
                >
                  Use “{typed}”
                </CommandItem>
              ) : null}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.hint ?? ""}`}
                  onSelect={() => pick(option.value)}
                >
                  <IconCheck
                    className={cn(
                      option.value === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                  {option.hint ? (
                    <span className="text-muted-foreground ml-auto text-xs">
                      {option.hint}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function useAction() {
  const router = useRouter();
  const [pending, startPending] = useTransition();
  function run(action: () => Promise<BracketActionResult>, quiet = false) {
    startPending(async () => {
      const result = await action();
      if (!result.ok) toast.error(result.message);
      else if (!quiet || result.message !== "Saved")
        toast.success(result.message);
      router.refresh();
    });
  }
  return { pending, run };
}

function SlotRow({
  editionId,
  slot,
  schools,
  leagues,
}: {
  editionId: string;
  slot: EditorSlot;
  schools: EditorSchool[];
  leagues: string[];
}) {
  const { pending, run } = useAction();
  const schoolOptions = schools.map((school) => ({
    value: school.id,
    label: school.shortName ?? school.name ?? "School",
    hint: school.conference,
  }));
  const labelOptions = [
    ...new Set([...leagues, ...(slot.bidLabel ? [slot.bidLabel] : [])]),
  ].map((league) => ({ value: league, label: league }));

  function save(next: Partial<EditorSlot>) {
    const merged = { ...slot, ...next };
    run(
      () =>
        saveBracketSlotAction({
          editionId,
          slotKey: slot.key,
          schoolId: merged.schoolId,
          bidType: merged.bidType,
          bidLabel: merged.bidLabel,
        }),
      true,
    );
  }

  return (
    <tr className="border-b last:border-0" aria-busy={pending}>
      <td className="py-1.5 pr-3 text-sm whitespace-nowrap">
        {slot.showSeed ? `No. ${slot.seed}` : `Unseeded (${slot.seed})`}
      </td>
      <td className="py-1.5 pr-3">
        <Combobox
          label={`School for ${slot.key}`}
          className="w-64"
          value={slot.schoolId}
          options={schoolOptions}
          placeholder="Pick a school"
          emptyLabel="Empty this slot"
          disabled={pending}
          onChange={(schoolId) => {
            // A new school brings its conference as the label.
            const school = schools.find((item) => item.id === schoolId);
            save({
              schoolId,
              bidLabel: schoolId
                ? (conferenceLabel(school?.conference ?? null) ?? slot.bidLabel)
                : null,
              bidType: schoolId ? slot.bidType : null,
            });
          }}
        />
      </td>
      <td className="py-1.5 pr-3">
        <Select
          value={slot.bidType ?? ""}
          disabled={pending || !slot.schoolId}
          onValueChange={(value) =>
            save({ bidType: value as EditorSlot["bidType"] })
          }
        >
          <SelectTrigger aria-label={`Bid for ${slot.key}`} className="w-32">
            <SelectValue placeholder="Bid" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto bid</SelectItem>
            <SelectItem value="at-large">At-large</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="py-1.5">
        <Combobox
          label={`Bid label for ${slot.key}`}
          className="w-44"
          value={slot.bidLabel}
          options={labelOptions}
          placeholder="Conference"
          emptyLabel="No label"
          allowCustom
          disabled={pending || !slot.schoolId}
          onChange={(bidLabel) => save({ bidLabel })}
        />
      </td>
    </tr>
  );
}

function scoreValue(value: string) {
  return value === "" ? null : Number(value);
}

function GameRow({ editionId, game }: { editionId: string; game: EditorGame }) {
  const { pending, run } = useAction();
  const [homeSide, setHomeSide] = useState(game.homeSide ?? "");
  const [site, setSite] = useState(game.siteLabel ?? "");
  const [kickoff, setKickoff] = useState(game.kickoffAt ?? "");
  const [a, setA] = useState(game.sideAScore?.toString() ?? "");
  const [b, setB] = useState(game.sideBScore?.toString() ?? "");

  return (
    <tr className="border-b align-top last:border-0">
      <td className="py-2 pr-3 text-sm">
        <span className="text-muted-foreground block text-xs">
          {game.roundLabel} · {game.key}
        </span>
        <span className="block">{game.sideALabel}</span>
        <span className="block">{game.sideBLabel}</span>
      </td>
      <td className="py-2 pr-3">
        <div className="flex flex-col gap-1">
          <Input
            aria-label={`${game.key} ${game.sideALabel} score`}
            className="h-8 w-16"
            inputMode="numeric"
            value={a}
            onChange={(event) => setA(event.target.value.replace(/\D/g, ""))}
          />
          <Input
            aria-label={`${game.key} ${game.sideBLabel} score`}
            className="h-8 w-16"
            inputMode="numeric"
            value={b}
            onChange={(event) => setB(event.target.value.replace(/\D/g, ""))}
          />
        </div>
      </td>
      <td className="py-2 pr-3">
        <Select
          value={homeSide || "default"}
          onValueChange={(value) =>
            setHomeSide(value === "default" ? "" : value)
          }
        >
          <SelectTrigger aria-label={`${game.key} host`} className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Format default</SelectItem>
            <SelectItem value="a">{game.sideALabel}</SelectItem>
            <SelectItem value="b">{game.sideBLabel}</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="py-2 pr-3">
        <Input
          aria-label={`${game.key} site`}
          className="h-9 w-44"
          placeholder="Site (optional)"
          value={site}
          onChange={(event) => setSite(event.target.value)}
        />
      </td>
      <td className="py-2 pr-3">
        <DateTimePicker
          value={kickoff || null}
          onChange={(next) => setKickoff(next ?? "")}
          defaultTime="14:00"
          dateLabel={`${game.key} kickoff date`}
          timeLabel={`${game.key} kickoff time`}
        />
      </td>
      <td className="py-2">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            run(() =>
              saveBracketGameAction({
                editionId,
                gameKey: game.key,
                homeSide: (homeSide || null) as EditorGame["homeSide"],
                siteLabel: site || null,
                kickoffAt: kickoff || null,
                sideAScore: scoreValue(a),
                sideBScore: scoreValue(b),
              }),
            )
          }
        >
          {pending ? "Saving…" : "Save"}
        </Button>
      </td>
    </tr>
  );
}

export function BracketEditor({
  edition,
  publicUrl,
  slots,
  games,
  schools,
  leagues,
}: {
  edition: {
    id: string;
    status: "draft" | "published";
    articleUrl: string | null;
    publicNote: string | null;
  };
  publicUrl: string;
  slots: EditorSlot[];
  games: EditorGame[];
  schools: EditorSchool[];
  leagues: string[];
}) {
  const id = useId();
  const router = useRouter();
  const { pending, run } = useAction();
  const [articleUrl, setArticleUrl] = useState(edition.articleUrl ?? "");
  const [publicNote, setPublicNote] = useState(edition.publicNote ?? "");
  const filled = slots.filter((slot) => slot.schoolId).length;
  const published = edition.status === "published";

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={published ? "default" : "secondary"}>
            {edition.status}
          </Badge>
          <Button
            disabled={pending}
            variant={published ? "outline" : "default"}
            onClick={() =>
              run(() =>
                setBracketStatusAction({
                  editionId: edition.id,
                  status: published ? "draft" : "published",
                }),
              )
            }
          >
            {published ? "Unpublish" : "Publish"}
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(edition.id);
              toast.success("Embed ID copied");
            }}
          >
            <IconCopy />
            Copy embed ID
          </Button>
          {published ? (
            <Button variant="ghost" asChild>
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <IconExternalLink />
                View on site
              </a>
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="text-destructive"
              disabled={pending}
              onClick={() => {
                if (!window.confirm("Delete this draft bracket?")) return;
                run(async () => {
                  const result = await deleteBracketEditionAction(edition.id);
                  if (result.ok) router.push("/brackets");
                  return result;
                });
              }}
            >
              <IconTrash />
              Delete draft
            </Button>
          )}
          <span className="text-muted-foreground text-sm">
            {filled} of {slots.length} teams placed
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto] md:items-end">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-article`}>Article link</Label>
            <Input
              id={`${id}-article`}
              placeholder="https://www.redshirtsports.com/…"
              value={articleUrl}
              onChange={(event) => setArticleUrl(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-note`}>Public note</Label>
            <Input
              id={`${id}-note`}
              placeholder="Shown under the title"
              value={publicNote}
              onChange={(event) => setPublicNote(event.target.value)}
            />
          </div>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(() =>
                saveBracketDetailsAction({
                  editionId: edition.id,
                  articleUrl,
                  publicNote,
                }),
              )
            }
          >
            Save details
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Field</h2>
        <p className="text-muted-foreground text-sm">
          Changes save as you pick, and a school brings its conference as the
          bid label. Placing a school that is already in the bracket swaps the
          two slots.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-muted-foreground text-xs">
              <tr>
                <th className="py-1 pr-3 font-medium">Slot</th>
                <th className="py-1 pr-3 font-medium">School</th>
                <th className="py-1 pr-3 font-medium">Bid</th>
                <th className="py-1 font-medium">Bid label</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <SlotRow
                  key={`${slot.key}:${slot.schoolId}:${slot.bidType}:${slot.bidLabel}`}
                  editionId={edition.id}
                  slot={slot}
                  schools={schools}
                  leagues={leagues}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Games</h2>
        <p className="text-muted-foreground text-sm">
          Both scores make a game final and move the winner on. Clear every
          field and save to reset a game.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-muted-foreground text-xs">
              <tr>
                <th className="py-1 pr-3 font-medium">Matchup</th>
                <th className="py-1 pr-3 font-medium">Score</th>
                <th className="py-1 pr-3 font-medium">Host</th>
                <th className="py-1 pr-3 font-medium">Site</th>
                <th className="py-1 pr-3 font-medium">Kickoff (ET)</th>
                <th className="py-1 font-medium" />
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <GameRow
                  key={`${game.key}:${game.sideALabel}:${game.sideBLabel}`}
                  editionId={edition.id}
                  game={game}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
