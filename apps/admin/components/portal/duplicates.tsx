"use client";

import { Badge } from "@redshirt-sports/ui/components/badge";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  type DuplicateQueue,
  dismissPortalDuplicate,
  type MergeComparison,
  mergePortalPlayers,
  type PortalActionResult,
} from "@/actions/portal";
import { EVENT_LABELS, STATUS_LABELS } from "@/components/portal/labels";

type ListPlayer = DuplicateQueue[number]["a"];
type DetailPlayer = MergeComparison["a"];
type Plan = MergeComparison["keepA"];

const fullName = (player: {
  firstName: string;
  lastName: string;
  suffix: string | null;
}) =>
  `${player.firstName} ${player.lastName}${player.suffix ? ` ${player.suffix}` : ""}`;

const hometown = (player: {
  hometownCity: string | null;
  hometownState: string | null;
}) =>
  [player.hometownCity, player.hometownState].filter(Boolean).join(", ") ||
  null;

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (
    action: () => Promise<PortalActionResult>,
    onOk?: (result: PortalActionResult) => void,
  ) =>
    start(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (onOk) onOk(result);
      else router.refresh();
    });
  return { pending, run, router };
}

function Facts({ player }: { player: ListPlayer | DetailPlayer }) {
  const town = hometown(player);
  return (
    <p className="text-muted-foreground text-sm">
      {[
        town,
        player.highSchoolName,
        player.hsGradYear ? `HS ${player.hsGradYear}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "No bio on file"}
    </p>
  );
}

function QueueSide({ player }: { player: ListPlayer }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <Link
        href={`/portal/players/${player.id}`}
        className="font-medium underline-offset-4 hover:underline"
      >
        {fullName(player)}{" "}
        <span className="text-muted-foreground text-xs">#{player.id}</span>
      </Link>
      <Facts player={player} />
      <div className="flex flex-wrap gap-1">
        {player.latest.length === 0 ? (
          <span className="text-muted-foreground text-xs">No portal entry</span>
        ) : (
          player.latest.map((row) => (
            <Badge key={row.id} variant="secondary">
              {row.sportSlug} {row.cycleYear}: {row.originName}
              {row.destinationName ? ` → ${row.destinationName}` : ""} (
              {STATUS_LABELS[row.status] ?? row.status})
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}

export function DuplicateQueueList({ queue }: { queue: DuplicateQueue }) {
  const { pending, run } = useAction();
  if (queue.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No likely duplicates among players added in the last 90 days.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {queue.map((pair) => (
        <li
          key={`${pair.playerAId}-${pair.playerBId}`}
          className="flex flex-col gap-3 rounded-lg border p-4"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline">
              Name {Math.round(pair.score * 100)}% alike
            </Badge>
            {pair.sameSchool ? <Badge>Same school</Badge> : null}
            {pair.sameHometown ? <Badge>Same hometown</Badge> : null}
            {pair.sameClass ? <Badge>Same HS class</Badge> : null}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <QueueSide player={pair.a} />
            <QueueSide player={pair.b} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link
                href={`/portal/duplicates/compare?a=${pair.playerAId}&b=${pair.playerBId}`}
              >
                Compare and merge
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run(() =>
                  dismissPortalDuplicate({
                    playerIds: [pair.playerAId, pair.playerBId],
                  }),
                )
              }
            >
              Not the same person
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function History({ player }: { player: DetailPlayer }) {
  if (player.sports.length === 0) {
    return <p className="text-muted-foreground text-sm">No sports on file.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {player.sports.map((sport) => (
        <div key={sport.id} className="flex flex-col gap-1">
          <p className="text-sm font-medium">
            {sport.sportName}
            {sport.position ? ` · ${sport.position}` : ""}
          </p>
          {sport.recruitments.map((recruitment) => (
            <div key={recruitment.id} className="text-sm">
              <p>
                {recruitment.cycleYear}: {recruitment.originName}
                {recruitment.destinationName
                  ? ` → ${recruitment.destinationName}`
                  : ""}{" "}
                <span className="text-muted-foreground">
                  ({STATUS_LABELS[recruitment.status] ?? recruitment.status})
                </span>
              </p>
              <ul className="text-muted-foreground pl-3 text-xs">
                {recruitment.events
                  .filter((event) => event.voidedAt === null)
                  .map((event) => (
                    <li key={event.id}>
                      {new Date(event.occurredAt).toLocaleDateString()}{" "}
                      {EVENT_LABELS[event.type] ?? event.type}
                      {event.schoolName ? `: ${event.schoolName}` : ""}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function PlanSummary({ plan, otherId }: { plan: Plan; otherId: number }) {
  const moving = plan.filter((sport) => sport.action === "move");
  const kept = plan.filter((sport) => sport.action === "keep");
  const count = (sport: Plan[number]) =>
    `${sport.recruitments} entr${sport.recruitments === 1 ? "y" : "ies"}, ${sport.events} event${sport.events === 1 ? "" : "s"}`;
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {moving.map((sport) => (
        <li key={sport.sportId}>
          Moves over: <span className="font-medium">{sport.sportName}</span> (
          {count(sport)}).
        </li>
      ))}
      {kept.map((sport) => (
        <li key={sport.sportId}>
          <span className="font-medium">{sport.sportName}</span>: this player's
          history is kept. #{otherId}'s ({count(sport)}) stays on the merged
          record and is no longer shown; re-record anything it has that this one
          is missing.
        </li>
      ))}
      <li>Blank bio fields are filled from #{otherId}.</li>
      <li>After the next push, #{otherId}'s page redirects here.</li>
    </ul>
  );
}

function Side({
  player,
  other,
  plan,
  choosing,
  onChoose,
  onCancel,
  pending,
  onMerge,
}: {
  player: DetailPlayer;
  other: DetailPlayer;
  plan: Plan;
  choosing: boolean;
  onChoose: () => void;
  onCancel: () => void;
  pending: boolean;
  onMerge: () => void;
}) {
  return (
    <Card className={`flex-1 ${choosing ? "border-primary" : ""}`}>
      <CardHeader>
        <CardTitle>
          <Link
            href={`/portal/players/${player.id}`}
            className="underline-offset-4 hover:underline"
          >
            {fullName(player)}
          </Link>{" "}
          <span className="text-muted-foreground text-sm font-normal">
            #{player.id}
          </span>
        </CardTitle>
        <CardDescription>
          <Facts player={player} />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <History player={player} />
        {choosing ? (
          <div className="bg-muted/40 flex flex-col gap-3 rounded-md border p-3">
            <p className="text-sm font-medium">
              Keep #{player.id} and merge #{other.id} into it:
            </p>
            <PlanSummary plan={plan} otherId={other.id} />
            <div className="flex gap-2">
              <Button size="sm" disabled={pending} onClick={onMerge}>
                {pending ? "Merging…" : "Merge"}
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Button size="sm" variant="outline" onClick={onChoose}>
              Keep this one
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MergeDesk({ comparison }: { comparison: MergeComparison }) {
  const { a, b, keepA, keepB } = comparison;
  const { pending, run, router } = useAction();
  const [choice, setChoice] = useState<"a" | "b" | null>(null);

  const merge = (survivorId: number, loserId: number) =>
    run(
      () => mergePortalPlayers({ survivorId, loserId }),
      () => router.push(`/portal/players/${survivorId}`),
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <Side
          player={a}
          other={b}
          plan={keepA}
          choosing={choice === "a"}
          onChoose={() => setChoice("a")}
          onCancel={() => setChoice(null)}
          pending={pending}
          onMerge={() => merge(a.id, b.id)}
        />
        <Side
          player={b}
          other={a}
          plan={keepB}
          choosing={choice === "b"}
          onChoose={() => setChoice("b")}
          onCancel={() => setChoice(null)}
          pending={pending}
          onMerge={() => merge(b.id, a.id)}
        />
      </div>
      <div>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            run(
              () => dismissPortalDuplicate({ playerIds: [a.id, b.id] }),
              () => router.push("/portal/duplicates"),
            )
          }
        >
          Not the same person
        </Button>
      </div>
    </div>
  );
}
