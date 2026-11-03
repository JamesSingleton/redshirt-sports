import {
  type BracketGameView,
  type BracketSideView,
  buildBracketView,
} from "@redshirt-sports/db/playoff-bracket";
import {
  getBracketEdition,
  listBracketSchoolOptions,
} from "@redshirt-sports/db/queries";
import { Bracket } from "@redshirt-sports/ui/components/bracket";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  BracketEditor,
  type EditorGame,
  type EditorSlot,
} from "@/components/bracket-editor";
import {
  bracketEditionName,
  bracketFormatLabel,
  dateToEasternInput,
} from "@/lib/bracket-season";
import { requireAdmin } from "@/lib/require-admin";
import { resolvePublicSiteUrl } from "@/lib/site";

type Params = Promise<{ editionId: string }>;

function sideLabel(side: BracketSideView) {
  const name = side.team
    ? (side.team.shortName ?? side.team.name ?? "Team")
    : side.placeholder;
  return side.team && side.showSeed ? `${side.seed}. ${name}` : name;
}

function EditionFallback() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="bg-muted h-9 w-64 max-w-full animate-pulse rounded" />
      <div className="bg-muted h-80 w-full animate-pulse rounded-xl" />
    </div>
  );
}

async function EditionContent({ params }: { params: Params }) {
  await requireAdmin();
  const { editionId } = await params;
  const detail = await getBracketEdition(editionId);
  if (!detail) notFound();
  const { edition, spec } = detail;

  const schools = await listBracketSchoolOptions({
    seasonId: edition.seasonId,
    sportId: edition.sportId,
    divisionSlug: edition.divisionSlug,
  });
  const view = buildBracketView(spec, detail.slots, detail.games);

  const filled = new Map(detail.slots.map((slot) => [slot.slotKey, slot]));
  const slots: EditorSlot[] = spec.slots.map((slot) => {
    const entry = filled.get(slot.key);
    return {
      key: slot.key,
      seed: slot.seed,
      showSeed: slot.showSeed,
      schoolId: entry?.team.schoolId ?? null,
      bidType: (entry?.bidType ?? null) as EditorSlot["bidType"],
      bidLabel: entry?.bidLabel ?? null,
    };
  });

  const views = new Map<string, BracketGameView>(
    [
      ...view.left.columns.flatMap((column) => column.games),
      ...view.right.columns.flatMap((column) => column.games),
      view.final,
    ].map((game) => [game.key, game]),
  );
  const states = new Map(detail.games.map((game) => [game.gameKey, game]));
  const roundOrder = new Map(
    spec.rounds.map((round, index) => [round.key, index]),
  );
  const games: EditorGame[] = [...spec.games]
    .sort(
      (a, b) =>
        (roundOrder.get(a.roundKey) ?? 0) - (roundOrder.get(b.roundKey) ?? 0),
    )
    .map((game) => {
      const gameView = views.get(game.key)!;
      const state = states.get(game.key);
      return {
        key: game.key,
        roundLabel: game.roundLabel,
        sideALabel: sideLabel(gameView.sideA),
        sideBLabel: sideLabel(gameView.sideB),
        homeSide: (state?.homeSide ?? null) as EditorGame["homeSide"],
        siteLabel: state?.siteLabel ?? null,
        kickoffAt: state?.kickoffAt
          ? dateToEasternInput(state.kickoffAt)
          : null,
        sideAScore: state?.sideAScore ?? null,
        sideBScore: state?.sideBScore ?? null,
      };
    });

  const base = `/college/${edition.sportSlug}/playoffs/${edition.divisionSlug}/${edition.year}`;
  const publicUrl = `${resolvePublicSiteUrl()}${
    edition.kind === "projection"
      ? `${base}/projections/week-${edition.weekNumber}`
      : base
  }`;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/brackets"
          className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase hover:underline"
        >
          Playoff brackets
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          {edition.year} {bracketFormatLabel(edition)}:{" "}
          {bracketEditionName(edition)}
        </h1>
        <p className="text-muted-foreground font-mono text-xs">
          Embed ID {edition.id}
        </p>
      </div>

      <BracketEditor
        edition={{
          id: edition.id,
          status: edition.status,
          articleUrl: edition.articleUrl,
          publicNote: edition.publicNote,
        }}
        publicUrl={publicUrl}
        slots={slots}
        games={games}
        schools={schools}
        leagues={(spec.leagues ?? []).map((league) => league.label)}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Preview</h2>
        <Bracket
          view={view}
          renderTeam={(team) => (
            <span className="truncate">{team.shortName ?? team.name}</span>
          )}
        />
      </section>
    </div>
  );
}

export default function BracketEditionPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<EditionFallback />}>
      <EditionContent params={params} />
    </Suspense>
  );
}
