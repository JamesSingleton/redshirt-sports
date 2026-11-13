"use client";

import { Badge } from "@redshirt-sports/ui/components/badge";
import { Button } from "@redshirt-sports/ui/components/button";
import { Checkbox } from "@redshirt-sports/ui/components/checkbox";
import { Label } from "@redshirt-sports/ui/components/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createPortalPlayerAction,
  findPortalDuplicates,
  type PortalDesk,
} from "@/actions/portal";
import {
  EntryFields,
  type EntryValue,
  emptyEntry,
  entryPayload,
} from "@/components/portal/entry-fields";
import { TextField } from "@/components/portal/fields";

type Similar = Awaited<ReturnType<typeof findPortalDuplicates>>;

export interface BioValue {
  firstName: string;
  lastName: string;
  suffix: string;
  hometownCity: string;
  hometownState: string;
  highSchoolName: string;
  hsGradYear: string;
}

export const EMPTY_BIO: BioValue = {
  firstName: "",
  lastName: "",
  suffix: "",
  hometownCity: "",
  hometownState: "",
  highSchoolName: "",
  hsGradYear: "",
};

export function BioFields({
  value,
  onChange,
}: {
  value: BioValue;
  onChange: (value: BioValue) => void;
}) {
  const set = (patch: Partial<BioValue>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <TextField
          label="First name"
          required
          value={value.firstName}
          onChange={(firstName) => set({ firstName })}
        />
        <TextField
          label="Last name"
          required
          value={value.lastName}
          onChange={(lastName) => set({ lastName })}
        />
        <TextField
          label="Suffix"
          className="w-20"
          placeholder="Jr."
          value={value.suffix}
          onChange={(suffix) => set({ suffix })}
        />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <TextField
          label="Hometown"
          value={value.hometownCity}
          onChange={(hometownCity) => set({ hometownCity })}
        />
        <TextField
          label="State"
          className="w-20"
          value={value.hometownState}
          onChange={(hometownState) => set({ hometownState })}
        />
        <TextField
          label="High school"
          className="w-64"
          value={value.highSchoolName}
          onChange={(highSchoolName) => set({ highSchoolName })}
        />
        <TextField
          label="HS class"
          inputMode="numeric"
          className="w-24"
          value={value.hsGradYear}
          onChange={(hsGradYear) => set({ hsGradYear })}
        />
      </div>
    </div>
  );
}

/** Similar names already on file, so a duplicate is caught before it's made. */
function useSimilarPlayers(name: string) {
  const [similar, setSimilar] = useState<Similar>([]);
  useEffect(() => {
    if (name.trim().length < 3) {
      setSimilar([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const found = await findPortalDuplicates(name);
      if (!cancelled) setSimilar(found);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name]);
  return similar;
}

export function NewPlayerForm({ sports }: { sports: PortalDesk["sports"] }) {
  const router = useRouter();
  const confirmId = useId();
  const withEntryId = useId();
  const [bio, setBio] = useState<BioValue>(EMPTY_BIO);
  const [withEntry, setWithEntry] = useState(true);
  const [entry, setEntry] = useState<EntryValue>(() =>
    emptyEntry(sports[0]?.id ?? ""),
  );
  const [confirmedNew, setConfirmedNew] = useState(false);
  const [saving, startSave] = useTransition();

  const similar = useSimilarPlayers(`${bio.firstName} ${bio.lastName}`);
  const needsConfirm = similar.length > 0 && !confirmedNew;

  useEffect(() => setConfirmedNew(false), [similar]);

  const save = () =>
    startSave(async () => {
      const result = await createPortalPlayerAction({
        bio,
        entry: withEntry ? entryPayload(entry) : null,
        // Remembered so the duplicate queue doesn't flag these pairs again.
        notDuplicateOf: confirmedNew ? similar.map((player) => player.id) : [],
      });
      if (!result.ok || !result.playerId) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push(`/portal/players/${result.playerId}`);
    });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Player</h2>
        <BioFields value={bio} onChange={setBio} />
      </section>

      {similar.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
          <p className="text-sm font-medium">
            Already on file? Open the existing player instead of adding a new
            one.
          </p>
          <ul className="flex flex-col gap-1">
            {similar.map((player) => (
              <li
                key={player.id}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                <Link
                  href={`/portal/players/${player.id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {player.firstName} {player.lastName}
                  {player.suffix ? ` ${player.suffix}` : ""}
                </Link>
                <span className="text-muted-foreground">#{player.id}</span>
                {player.currentSchools.map((school) => (
                  <Badge key={school} variant="secondary">
                    {school}
                  </Badge>
                ))}
                {player.hometownCity || player.hometownState ? (
                  <span className="text-muted-foreground">
                    {[player.hometownCity, player.hometownState]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                ) : null}
                {player.hsGradYear ? (
                  <span className="text-muted-foreground">
                    HS {player.hsGradYear}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id={confirmId}
              checked={confirmedNew}
              onCheckedChange={(checked) => setConfirmedNew(checked === true)}
            />
            <Label htmlFor={confirmId}>
              None of these: this is a different person
            </Label>
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id={withEntryId}
            checked={withEntry}
            onCheckedChange={(checked) => setWithEntry(checked === true)}
          />
          <Label htmlFor={withEntryId} className="text-lg font-semibold">
            Entering the portal
          </Label>
        </div>
        {withEntry ? (
          <EntryFields value={entry} onChange={setEntry} sports={sports} />
        ) : null}
      </section>

      <div>
        <Button type="submit" disabled={saving || needsConfirm}>
          {saving ? "Saving…" : "Save player"}
        </Button>
        {needsConfirm ? (
          <p className="text-muted-foreground mt-2 text-sm">
            Check the similar players above first.
          </p>
        ) : null}
      </div>
    </form>
  );
}
