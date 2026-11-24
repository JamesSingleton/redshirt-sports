"use client";

import { Badge } from "@redshirt-sports/ui/components/badge";
import { Button } from "@redshirt-sports/ui/components/button";
import { Checkbox } from "@redshirt-sports/ui/components/checkbox";
import { Label } from "@redshirt-sports/ui/components/label";
import { toast } from "@redshirt-sports/ui/components/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";

import {
  createPortalPlayerAction,
  type EspnPrefill,
  findPortalDuplicates,
  type PortalDesk,
  prefillFromEspn,
} from "@/actions/portal";
import {
  EntryFields,
  type EntryValue,
  emptyEntry,
  entryPayload,
} from "@/components/portal/entry-fields";
import { TextField } from "@/components/portal/fields";
import {
  type EntrySubmission,
  prefillFromSubmission,
} from "@/components/portal/submission-prefill";

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

/**
 * Players already on file who may be this one, so a duplicate is caught
 * before it's made. Sport, origin school, and class tell namesakes apart.
 */
function useSimilarPlayers(
  name: string,
  sportId: string,
  schoolId: string | null,
  hsGradYear: string,
) {
  const [similar, setSimilar] = useState<Similar>([]);
  useEffect(() => {
    if (name.trim().length < 3) {
      setSimilar([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const found = await findPortalDuplicates(name, {
        sportId: sportId || null,
        schoolId,
        hsGradYear: hsGradYear || null,
      });
      if (!cancelled) setSimilar(found);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, sportId, schoolId, hsGradYear]);
  return similar;
}

export function NewPlayerForm({
  sports,
  submission,
}: {
  sports: PortalDesk["sports"];
  /** A public submission to start from; marked accepted once the player is saved. */
  submission?: EntrySubmission;
}) {
  const router = useRouter();
  const confirmId = useId();
  const withEntryId = useId();
  const [initial] = useState(() =>
    submission ? prefillFromSubmission(submission, sports, EMPTY_BIO) : null,
  );
  const [bio, setBio] = useState<BioValue>(initial?.bio ?? EMPTY_BIO);
  const [withEntry, setWithEntry] = useState(true);
  const [entry, setEntry] = useState<EntryValue>(
    () => initial?.entry ?? emptyEntry(sports[0]?.id ?? ""),
  );
  const [confirmedNew, setConfirmedNew] = useState(false);
  const [saving, startSave] = useTransition();
  const [espnLink, setEspnLink] = useState("");
  const [espn, setEspn] = useState<Extract<EspnPrefill, { ok: true }> | null>(
    null,
  );
  const [filling, startFill] = useTransition();

  /** Fill what's still empty from the player's ESPN profile. */
  const fillFromEspn = () =>
    startFill(async () => {
      const result = await prefillFromEspn(espnLink);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setEspn(result);
      const { profile } = result;
      const keep = (current: string, next: string) => current || next;
      setBio((current) => ({
        ...current,
        firstName: keep(current.firstName, profile.firstName),
        lastName: keep(current.lastName, profile.lastName),
        suffix: keep(current.suffix, profile.suffix),
        hometownCity: keep(current.hometownCity, profile.hometownCity),
        hometownState: keep(current.hometownState, profile.hometownState),
      }));
      const sport = sports.find((s) => s.slug === result.sportSlug);
      setEntry((current) => ({
        ...current,
        sportId: sport?.id ?? current.sportId,
        position: keep(current.position, profile.position),
        heightIn: keep(
          current.heightIn,
          profile.heightIn ? String(profile.heightIn) : "",
        ),
        weightLb: keep(
          current.weightLb,
          profile.weightLb ? String(profile.weightLb) : "",
        ),
        classAtEntry: keep(current.classAtEntry, profile.classCode),
        origin:
          current.origin.schoolId || current.origin.schoolName || !result.school
            ? current.origin
            : {
                schoolId: result.school.id,
                schoolName: null,
                label: result.school.name ?? profile.teamName,
              },
      }));
      if (!result.school && profile.teamName) {
        toast.warning(
          `Pick ${profile.teamName} in "Leaving" by hand: its ESPN team isn't linked to a school here.`,
        );
      }
    });

  const similar = useSimilarPlayers(
    `${bio.firstName} ${bio.lastName}`,
    withEntry ? entry.sportId : "",
    withEntry ? entry.origin.schoolId : null,
    bio.hsGradYear,
  );
  const likely = similar.filter((player) => player.tier === "likely");
  const needsConfirm = likely.length > 0 && !confirmedNew;
  const likelyIds = likely.map((player) => player.id).join(",");

  // A new likely match needs a fresh look; a reordered list doesn't.
  useEffect(() => setConfirmedNew(false), [likelyIds]);

  const save = () =>
    startSave(async () => {
      const result = await createPortalPlayerAction({
        bio,
        entry: withEntry ? entryPayload(entry) : null,
        // Remembered so the duplicate queue doesn't flag these pairs again.
        notDuplicateOf: confirmedNew ? likely.map((player) => player.id) : [],
        submissionId: submission?.id,
        espnId: espn?.profile.espnId ?? null,
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
        <div className="flex flex-wrap items-end gap-3">
          <TextField
            label="ESPN profile link (optional)"
            type="url"
            placeholder="https://www.espn.com/college-football/player/_/id/…"
            className="w-[28rem] max-w-full"
            value={espnLink}
            onChange={setEspnLink}
          />
          <Button
            type="button"
            variant="outline"
            disabled={filling || !espnLink.trim()}
            onClick={fillFromEspn}
          >
            {filling ? "Filling in…" : "Fill in"}
          </Button>
        </div>
        {espn?.existingPlayer ? (
          <p className="text-sm">
            This ESPN player is already on file:{" "}
            <Link
              href={`/portal/players/${espn.existingPlayer.id}`}
              className="font-medium underline underline-offset-4"
            >
              {espn.existingPlayer.firstName} {espn.existingPlayer.lastName} (#
              {espn.existingPlayer.id})
            </Link>
          </p>
        ) : null}
        <BioFields value={bio} onChange={setBio} />
      </section>

      {similar.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
          <p className="text-sm font-medium">
            {likely.length > 0
              ? "Likely already on file. Open the existing player instead of adding a new one."
              : "Similar names on file. Check them, or carry on if this is someone new."}
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
                {player.tier === "likely" ? (
                  <Badge variant="outline">Likely match</Badge>
                ) : null}
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
          {likely.length > 0 ? (
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
          ) : null}
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
        <Button
          type="submit"
          disabled={saving || needsConfirm || !!espn?.existingPlayer}
        >
          {saving ? "Saving…" : "Save player"}
        </Button>
        {needsConfirm ? (
          <p className="text-muted-foreground mt-2 text-sm">
            Check the likely matches above first.
          </p>
        ) : null}
      </div>
    </form>
  );
}
