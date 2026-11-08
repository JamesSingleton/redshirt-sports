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
import { Input } from "@redshirt-sports/ui/components/input";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { mapTeamToSchool, type RatingsActionResult } from "@/actions/ratings";
import {
  lookUpTeam,
  type SchoolIdReview,
  saveConfidentTeamIds,
} from "@/actions/school-ids";

type School = SchoolIdReview["schools"][number];
type Preview = Awaited<ReturnType<typeof lookUpTeam>>;

const REASONS: Record<School["reason"], string> = {
  confident: "Confident",
  "no-candidates": "No match",
  "mascot-differs": "Mascot differs",
  "no-mascot": "No mascot",
  "loose-name": "Loose name",
  "better-name-elsewhere": "Better name elsewhere",
  contested: "Contested",
  ambiguous: "Ambiguous",
};

const PAGE = 50;

function SchoolRow({
  school,
  pending,
  run,
}: {
  school: School;
  pending: boolean;
  run: (label: string, action: () => Promise<RatingsActionResult>) => void;
}) {
  const [externalId, setExternalId] = useState("");
  const [preview, setPreview] = useState<Preview | undefined>(undefined);
  const [looking, startLookup] = useTransition();
  const map = (externalId: string) =>
    run("Map", () => mapTeamToSchool({ externalId, schoolId: school.id }));

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">{school.name}</p>
        {school.nickname ? (
          <span className="text-muted-foreground text-sm">
            {school.nickname}
          </span>
        ) : null}
        <Badge variant={school.reason === "confident" ? "default" : "outline"}>
          {REASONS[school.reason]}
        </Badge>
        {school.sports.map((sport) => (
          <Badge key={sport} variant="secondary">
            {sport}
          </Badge>
        ))}
      </div>
      {school.fullName && school.fullName !== school.name ? (
        <p className="text-muted-foreground text-xs">{school.fullName}</p>
      ) : null}
      {school.suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {school.suggestions.map((team) => (
            <Button
              key={team.externalId}
              size="sm"
              variant={school.reason === "confident" ? "default" : "outline"}
              disabled={pending}
              onClick={() => map(team.externalId)}
              title={
                team.alternateIds.length > 0
                  ? `The provider also lists ${team.alternateIds.join(", ")} under this name`
                  : undefined
              }
            >
              {team.teamName} · {team.externalId} (
              {Math.round(team.score * 100)}%)
            </Button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="team id"
          inputMode="numeric"
          className="w-40"
          value={externalId}
          onChange={(e) => {
            setExternalId(e.target.value);
            setPreview(undefined);
          }}
        />
        <Button
          size="sm"
          variant="ghost"
          disabled={looking || externalId.trim() === ""}
          onClick={() =>
            startLookup(async () => setPreview(await lookUpTeam(externalId)))
          }
        >
          Look up
        </Button>
        {preview === null ? (
          <span className="text-destructive text-sm">No provider team.</span>
        ) : null}
        {preview ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => map(preview.externalId)}
          >
            Map to {preview.displayName}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function SchoolIdsDesk({ review }: { review: SchoolIdReview }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState<School["reason"] | "all">("all");
  const [shown, setShown] = useState(PAGE);

  const run = (label: string, action: () => Promise<RatingsActionResult>) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(`${label}: ${result.message}`);
      for (const line of result.lines) toast(line);
      router.refresh();
    });

  const counts = useMemo(() => {
    const byReason = new Map<School["reason"], number>();
    for (const school of review.schools) {
      byReason.set(school.reason, (byReason.get(school.reason) ?? 0) + 1);
    }
    return byReason;
  }, [review.schools]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return review.schools.filter(
      (school) =>
        (reason === "all" || school.reason === reason) &&
        (needle === "" ||
          [school.name, school.fullName, school.nickname].some((value) =>
            value?.toLowerCase().includes(needle),
          )),
    );
  }, [review.schools, query, reason]);

  const confident = counts.get("confident") ?? 0;
  const { coverage } = review;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {coverage.mapped} of {coverage.schools} schools have a team id
          </CardTitle>
          <CardDescription>
            The provider uses one id per school across sports in Division I.
            Below it, some schools have one id per sport; the football id is
            preferred.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button
            disabled={pending || confident === 0}
            onClick={() => run("Save", () => saveConfidentTeamIds())}
          >
            Save {confident} confident match{confident === 1 ? "" : "es"}
          </Button>
          <p className="text-muted-foreground text-sm">
            Confident: the same mascot, a close name, and no close runner-up on
            either side.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unmapped schools ({review.schools.length})</CardTitle>
          <CardDescription>
            Hover a suggestion to see other provider ids under the same name.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Filter schools"
              className="w-64"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShown(PAGE);
              }}
            />
            <Button
              size="sm"
              variant={reason === "all" ? "default" : "outline"}
              onClick={() => setReason("all")}
            >
              All
            </Button>
            {[...counts].map(([key, total]) => (
              <Button
                key={key}
                size="sm"
                variant={reason === key ? "default" : "outline"}
                onClick={() => {
                  setReason(key);
                  setShown(PAGE);
                }}
              >
                {REASONS[key]} ({total})
              </Button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm">No schools to show.</p>
          ) : null}
          {filtered.slice(0, shown).map((school) => (
            <SchoolRow
              key={school.id}
              school={school}
              pending={pending}
              run={run}
            />
          ))}
          {filtered.length > shown ? (
            <Button
              variant="ghost"
              className="w-fit"
              onClick={() => setShown((count) => count + PAGE)}
            >
              Show more ({filtered.length - shown} left)
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
