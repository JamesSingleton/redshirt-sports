"use client";

import {
  playerClassLabel,
  SCHOOL_EVENT_TYPES,
} from "@redshirt-sports/db/portal";
import { Badge } from "@redshirt-sports/ui/components/badge";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import { Input } from "@redshirt-sports/ui/components/input";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  enterPortal,
  type PortalActionResult,
  type PortalPlayerPage,
  recordPortalMove,
  savePlayerBio,
  savePlayerSport,
  voidPortalMove,
} from "@/actions/portal";
import {
  EntryFields,
  type EntryValue,
  emptyEntry,
  entryPayload,
} from "@/components/portal/entry-fields";
import {
  EMPTY_SCHOOL,
  EMPTY_SOURCE,
  EVENT_LABELS,
  localNow,
  localToIso,
  OptionSelect,
  positionOptions,
  SchoolPicker,
  type SchoolValue,
  SOURCE_LABELS,
  SourceFields,
  type SourceValue,
  STATUS_LABELS,
  sourcePayload,
  TextField,
} from "@/components/portal/fields";
import { BioFields, type BioValue } from "@/components/portal/new-player-form";

type Player = PortalPlayerPage["player"];
type PlayerSport = Player["sports"][number];
type Recruitment = PlayerSport["recruitments"][number];
type Event = Recruitment["events"][number];

const MOVE_TYPES = [
  "offered",
  "committed",
  "decommitted",
  "signed",
  "enrolled",
  "withdrew",
] as const;
type MoveType = (typeof MOVE_TYPES)[number];

const needsSchool = (type: string) =>
  (SCHOOL_EVENT_TYPES as readonly string[]).includes(type);

const asText = (value: string | number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/** Run an action, toast its result, and reload the page's data. */
function useRunner() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (action: () => Promise<PortalActionResult>, onOk?: () => void) =>
    start(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message);
        onOk?.();
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  return { pending, run };
}

function BioCard({ player }: { player: Player }) {
  const { pending, run } = useRunner();
  const [bio, setBio] = useState<BioValue>({
    firstName: player.firstName,
    lastName: player.lastName,
    suffix: asText(player.suffix),
    hometownCity: asText(player.hometownCity),
    hometownState: asText(player.hometownState),
    highSchoolName: asText(player.highSchoolName),
    hsGradYear: asText(player.hsGradYear),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bio</CardTitle>
        <CardDescription>
          Renaming changes the URL slug; the old link still works by id.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <BioFields value={bio} onChange={setBio} />
        <div>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              run(() => savePlayerBio({ playerId: player.id, bio }))
            }
          >
            Save bio
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EventRow({ playerId, event }: { playerId: number; event: Event }) {
  const { pending, run } = useRunner();
  const [undoing, setUndoing] = useState(false);
  const [reason, setReason] = useState("");
  const voided = event.voidedAt !== null;
  return (
    <li className="flex flex-col gap-1 border-l-2 py-1 pl-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span
          className={
            voided ? "text-muted-foreground line-through" : "font-medium"
          }
        >
          {EVENT_LABELS[event.type] ?? event.type}
          {event.schoolName ? `: ${event.schoolName}` : ""}
        </span>
        <span className="text-muted-foreground text-xs">
          {formatDate(event.occurredAt)}
        </span>
        {voided ? (
          <Badge variant="outline">
            Undone{event.voidReason ? `: ${event.voidReason}` : ""}
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={() => setUndoing((open) => !open)}
          >
            Undo
          </Button>
        )}
      </div>
      {event.sourceType || event.sourceUrl || event.sourceNote ? (
        <p className="text-muted-foreground text-xs">
          Source:{" "}
          {[
            event.sourceType
              ? SOURCE_LABELS[event.sourceType as keyof typeof SOURCE_LABELS]
              : null,
            event.sourceNote,
          ]
            .filter(Boolean)
            .join(" · ")}
          {event.sourceUrl ? (
            <>
              {" "}
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="underline"
              >
                source link
              </a>
            </>
          ) : null}
        </p>
      ) : null}
      {undoing && !voided ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="h-8 w-64"
            placeholder="Why (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() =>
              run(
                () => voidPortalMove({ playerId, eventId: event.id, reason }),
                () => setUndoing(false),
              )
            }
          >
            Undo this
          </Button>
        </div>
      ) : null}
    </li>
  );
}

function MoveForm({
  playerId,
  recruitment,
}: {
  playerId: number;
  recruitment: Recruitment;
}) {
  const { pending, run } = useRunner();
  const destination: SchoolValue = recruitment.destinationName
    ? {
        schoolId: recruitment.destinationSchoolId,
        schoolName: recruitment.destinationSchoolId
          ? null
          : recruitment.destinationName,
        label: recruitment.destinationName,
      }
    : EMPTY_SCHOOL;
  const [type, setType] = useState<MoveType>(
    recruitment.status === "entered" ? "committed" : "signed",
  );
  const [school, setSchool] = useState<SchoolValue>(
    recruitment.status === "entered" ? EMPTY_SCHOOL : destination,
  );
  const [occurredAt, setOccurredAt] = useState(localNow());
  const [source, setSource] = useState<SourceValue>(EMPTY_SOURCE);

  const reset = () => {
    setSchool(EMPTY_SCHOOL);
    setOccurredAt(localNow());
    setSource(EMPTY_SOURCE);
  };

  return (
    <div className="bg-muted/30 flex flex-col gap-3 rounded-md border p-3">
      <p className="text-sm font-medium">Record what happened next</p>
      <div className="flex flex-wrap items-end gap-3">
        <OptionSelect
          label="What"
          value={type}
          allowNone={false}
          className="w-64"
          onChange={(next) => {
            const nextType = next as MoveType;
            setType(nextType);
            // The school they're backing out of, signing with, or enrolling at
            // is almost always the current destination.
            if (
              ["decommitted", "signed", "enrolled"].includes(nextType) &&
              destination.label
            ) {
              setSchool(destination);
            } else if (nextType === "offered" || nextType === "committed") {
              setSchool(EMPTY_SCHOOL);
            }
          }}
          options={MOVE_TYPES.map((value) => ({
            value,
            label: EVENT_LABELS[value] ?? value,
          }))}
        />
        {needsSchool(type) ? (
          <SchoolPicker label="School" value={school} onChange={setSchool} />
        ) : null}
        <TextField
          label="When"
          type="datetime-local"
          className="w-56"
          value={occurredAt}
          onChange={setOccurredAt}
        />
      </div>
      <SourceFields value={source} onChange={setSource} />
      <div>
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            run(
              () =>
                recordPortalMove({
                  playerId,
                  move: {
                    recruitmentId: recruitment.id,
                    type,
                    occurredAt: localToIso(occurredAt),
                    school: needsSchool(type)
                      ? {
                          schoolId: school.schoolId,
                          schoolName: school.schoolName,
                        }
                      : null,
                    ...sourcePayload(source),
                  },
                }),
              reset,
            )
          }
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function RecruitmentBlock({
  playerId,
  recruitment,
}: {
  playerId: number;
  recruitment: Recruitment;
}) {
  const open = recruitment.closedAt === null;
  const offers = recruitment.events.filter(
    (event) => event.type === "offered" && event.voidedAt === null,
  );
  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">
          {recruitment.cycleYear}: {recruitment.originName}
          {recruitment.destinationName
            ? ` → ${recruitment.destinationName}`
            : ""}
        </p>
        <Badge variant={open ? "default" : "secondary"}>
          {STATUS_LABELS[recruitment.status] ?? recruitment.status}
        </Badge>
        {recruitment.classAtEntry ? (
          <Badge
            variant="outline"
            title={playerClassLabel(recruitment.classAtEntry) ?? ""}
          >
            {recruitment.classAtEntry}
          </Badge>
        ) : null}
        {recruitment.isGradTransfer ? (
          <Badge variant="outline">Grad transfer</Badge>
        ) : null}
        {offers.length > 0 ? (
          <span className="text-muted-foreground text-xs">
            {offers.length} offer{offers.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
      <ol className="flex flex-col gap-1">
        {recruitment.events.map((event) => (
          <EventRow key={event.id} playerId={playerId} event={event} />
        ))}
      </ol>
      {open ? <MoveForm playerId={playerId} recruitment={recruitment} /> : null}
    </div>
  );
}

function EnterPortalForm({
  playerId,
  sports,
  sportId,
  lockSport,
  origin,
  onDone,
}: {
  playerId: number;
  sports: PortalPlayerPage["sports"];
  sportId: string;
  lockSport: boolean;
  origin: SchoolValue | null;
  onDone: () => void;
}) {
  const { pending, run } = useRunner();
  const [entry, setEntry] = useState<EntryValue>(() =>
    emptyEntry(sportId, origin ?? EMPTY_SCHOOL),
  );
  return (
    <div className="bg-muted/30 flex flex-col gap-3 rounded-md border p-3">
      <EntryFields
        value={entry}
        onChange={setEntry}
        sports={sports}
        lockedSport={lockSport}
        lockedOrigin={origin !== null}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            run(
              () => enterPortal({ playerId, entry: entryPayload(entry) }),
              onDone,
            )
          }
        >
          Save entry
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function SportCard({
  player,
  sport,
  sports,
}: {
  player: Player;
  sport: PlayerSport;
  sports: PortalPlayerPage["sports"];
}) {
  const { pending, run } = useRunner();
  const [entering, setEntering] = useState(false);
  const [position, setPosition] = useState(asText(sport.position));
  const [heightIn, setHeightIn] = useState(asText(sport.heightIn));
  const [weightLb, setWeightLb] = useState(asText(sport.weightLb));
  const current = sport.enrollments.find((row) => row.endYear === null);
  const hasOpen = sport.recruitments.some((row) => row.closedAt === null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{sport.sportName}</CardTitle>
        <CardDescription>
          {current
            ? `At ${current.schoolName} since ${current.startYear}`
            : "No current school on file"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end gap-3">
          <OptionSelect
            label="Position"
            value={position}
            onChange={setPosition}
            options={positionOptions(sport.sportSlug)}
            className="w-56"
          />
          <TextField
            label="Height (in)"
            inputMode="numeric"
            className="w-24"
            value={heightIn}
            onChange={setHeightIn}
          />
          <TextField
            label="Weight (lb)"
            inputMode="numeric"
            className="w-24"
            value={weightLb}
            onChange={setWeightLb}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(() =>
                savePlayerSport({
                  playerId: player.id,
                  sportId: sport.sportId,
                  attributes: {
                    position: position || null,
                    heightIn,
                    weightLb,
                  },
                }),
              )
            }
          >
            Save
          </Button>
        </div>

        {sport.recruitments.map((recruitment) => (
          <RecruitmentBlock
            key={recruitment.id}
            playerId={player.id}
            recruitment={recruitment}
          />
        ))}

        {hasOpen ? null : entering ? (
          <EnterPortalForm
            playerId={player.id}
            sports={sports}
            sportId={sport.sportId}
            lockSport
            origin={
              current
                ? {
                    schoolId: current.schoolId,
                    schoolName: current.schoolId ? null : current.schoolName,
                    label: current.schoolName,
                  }
                : null
            }
            onDone={() => setEntering(false)}
          />
        ) : (
          <div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEntering(true)}
            >
              Entered the portal again
            </Button>
          </div>
        )}

        {sport.enrollments.length > 0 ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Career</p>
            <ul className="text-muted-foreground text-sm">
              {sport.enrollments.map((row) => (
                <li key={row.id}>
                  {row.schoolName}, {row.startYear}–{row.endYear ?? "now"}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PlayerDesk({ page }: { page: PortalPlayerPage }) {
  const { player, sports } = page;
  const [addingSport, setAddingSport] = useState(false);
  const otherSports = sports.filter(
    (sport) => !player.sports.some((row) => row.sportId === sport.id),
  );

  return (
    <div className="flex flex-col gap-6">
      <BioCard player={player} />
      {player.sports.map((sport) => (
        <SportCard
          key={sport.id}
          player={player}
          sport={sport}
          sports={sports}
        />
      ))}
      {otherSports.length > 0 ? (
        addingSport ? (
          <Card>
            <CardHeader>
              <CardTitle>Portal entry in another sport</CardTitle>
            </CardHeader>
            <CardContent>
              <EnterPortalForm
                playerId={player.id}
                sports={otherSports}
                sportId={otherSports[0]?.id ?? ""}
                lockSport={false}
                origin={null}
                onDone={() => setAddingSport(false)}
              />
            </CardContent>
          </Card>
        ) : (
          <div>
            <Button variant="outline" onClick={() => setAddingSport(true)}>
              {player.sports.length === 0
                ? "Enter the portal"
                : "Add a portal entry in another sport"}
            </Button>
          </div>
        )
      ) : null}
    </div>
  );
}
