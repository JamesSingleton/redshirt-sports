"use client";

import { analytics } from "@redshirt-sports/analytics";
import type { BracketSide } from "@redshirt-sports/db/playoff-bracket";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@redshirt-sports/ui/components/alert-dialog";
import { Button } from "@redshirt-sports/ui/components/button";
import { Input } from "@redshirt-sports/ui/components/input";
import { Label } from "@redshirt-sports/ui/components/label";
import {
  Download,
  Eraser,
  FileText,
  Loader2,
  Printer,
  RotateCcw,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";

import { BracketExportFrame } from "@/components/bracket/builder/bracket-export-frame";
import { SchoolPicker } from "@/components/bracket/builder/school-picker";
import { PlayoffBracket } from "@/components/bracket/playoff-bracket";
import {
  BRACKET_TITLE_MAX,
  type BracketDraft,
  blankDraft,
  bracketBuilderName,
  bracketBuilderSourceLabel,
  bracketDraftStorageKey,
  bracketExportFilename,
  bracketTeamName,
  clearPicks,
  draftAnalytics,
  draftToView,
  isBlankDraft,
  parseStoredDraft,
  pickWinner,
  placeSchool,
  printZoom,
  seedDraft,
  setDraftTitle,
  slotsBySide,
} from "@/lib/bracket-builder";
import { captureBracketImage } from "@/lib/bracket-capture";
import type { BracketBuilderModel } from "@/lib/bracket-data";
import { downloadBlob } from "@/lib/download-blob";

/**
 * A bracket the reader fills in: their teams, their winners. Nothing leaves
 * the browser. The draft is kept in local storage, and it goes out as an
 * image or a printout, both under our logo.
 */
export function BracketBuilder({
  model,
  logo,
}: {
  model: BracketBuilderModel;
  /** The site wordmark that goes on every image and printout. */
  logo: React.ComponentProps<typeof BracketExportFrame>["logo"];
}) {
  const { sport, division, year, formatKey, spec, projection, schools } = model;
  const context = { sport, division, year };
  const titleId = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const storageKey = bracketDraftStorageKey(sport, division, formatKey);
  const schoolsById = useMemo(
    () => new Map(schools.map((school) => [school.schoolId, school])),
    [schools],
  );

  const [draft, setDraft] = useState(() => blankDraft(formatKey));
  // Without a projection there is only one way to start, so nothing to ask.
  const [started, setStarted] = useState(projection === null);
  // Until the saved draft has been looked for, don't ask how to start.
  const [restored, setRestored] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [printBlank, setPrintBlank] = useState(false);

  // Read the saved draft after mount, so the server HTML is the blank bracket.
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(storageKey);
    } catch {
      // Storage is blocked (private mode, site data off): start fresh.
    }
    const stored = parseStoredDraft(raw, formatKey, spec, schoolsById);
    if (stored) {
      setDraft(stored);
      setStarted(true);
    }
    setRestored(true);
  }, [storageKey, formatKey, spec, schoolsById]);

  function update(next: BracketDraft) {
    setDraft(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // The draft still works for this visit.
    }
  }

  function start(from: "blank" | "projection") {
    const base =
      from === "projection" && projection
        ? seedDraft(formatKey, spec, projection.slots)
        : blankDraft(formatKey);
    const next = { ...base, title: draft.title };
    update(next);
    analytics?.capture(
      started ? "bracket_builder_restarted" : "bracket_builder_started",
      { ...draftAnalytics(next, context), from },
    );
    setStarted(true);
    setConfirmRestart(false);
  }

  const slots = useMemo(() => slotsBySide(spec), [spec]);
  const placed = useMemo(
    () => new Set(Object.values(draft.slots)),
    [draft.slots],
  );

  function place(slotKey: string, schoolId: string | null) {
    const next = placeSchool(spec, draft, slotKey, schoolId);
    // With no projection to choose from, the first team is the start.
    if (projection === null && isBlankDraft(draft)) {
      analytics?.capture("bracket_builder_started", {
        ...draftAnalytics(next, context),
        from: "blank",
      });
    }
    // One event per bracket, when its last open spot is filled.
    if (
      Object.keys(next.slots).length === spec.slots.length &&
      Object.keys(draft.slots).length < spec.slots.length
    ) {
      analytics?.capture(
        "bracket_builder_field_completed",
        draftAnalytics(next, context),
      );
    }
    update(next);
  }

  const view = useMemo(
    () => draftToView(spec, draft, schoolsById),
    [spec, draft, schoolsById],
  );
  const blankView = useMemo(
    () => draftToView(spec, blankDraft(formatKey), schoolsById),
    [spec, formatKey, schoolsById],
  );

  function pick(gameKey: string, side: BracketSide) {
    const next = pickWinner(spec, draft, gameKey, side);
    update(next);
    const champion = draftToView(spec, next, schoolsById).champion;
    if (champion && !view.champion) {
      analytics?.capture("bracket_builder_completed", {
        ...draftAnalytics(next, context),
        champion: bracketTeamName(champion),
      });
    }
  }

  // The printed page is the export frame, shrunk to fit one landscape sheet.
  // This also covers the browser's own Print command.
  useEffect(() => {
    const fit = () => {
      const frame = frameRef.current;
      if (!frame) return;
      frame.style.setProperty(
        "--bracket-print-zoom",
        String(printZoom(frame.offsetWidth, frame.offsetHeight)),
      );
    };
    const done = () => setPrintBlank(false);
    window.addEventListener("beforeprint", fit);
    window.addEventListener("afterprint", done);
    return () => {
      window.removeEventListener("beforeprint", fit);
      window.removeEventListener("afterprint", done);
    };
  }, []);

  function print(blank: boolean) {
    // The frame must show the right bracket before the print dialog opens.
    flushSync(() => setPrintBlank(blank));
    analytics?.capture("bracket_builder_exported", {
      ...draftAnalytics(draft, context),
      method: blank ? "print_blank" : "print",
      has_champion: view.champion !== null,
    });
    window.print();
  }

  async function download() {
    const frame = frameRef.current;
    if (!frame) return;
    setCapturing(true);
    try {
      downloadBlob(
        await captureBracketImage(frame),
        bracketExportFilename(division, year),
      );
      analytics?.capture("bracket_builder_exported", {
        ...draftAnalytics(draft, context),
        method: "image",
        has_champion: view.champion !== null,
      });
    } catch {
      analytics?.capture(
        "bracket_builder_export_failed",
        draftAnalytics(draft, context),
      );
      toast.error("Couldn't make the image. Try again, or print instead.");
    } finally {
      setCapturing(false);
    }
  }

  const name = bracketBuilderName(division, year);
  const projectionLabel = projection
    ? bracketBuilderSourceLabel(projection.edition)
    : null;
  const hasPicks = Object.keys(draft.picks).length > 0;

  const picker = (
    at: { gameKey: string; side: BracketSide },
    team: { schoolId: string } | null,
  ) => {
    const slot = slots.get(`${at.gameKey}:${at.side}`);
    const current = team ? schoolsById.get(team.schoolId) : undefined;
    if (!slot || (team && !current)) return null;
    return (
      <SchoolPicker
        slotLabel={slot.label}
        seed={slot.seed}
        current={current ?? null}
        schools={schools}
        placed={placed}
        onPlace={(next) => place(slot.slotKey, next)}
      />
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="mx-auto flex w-full min-w-0 max-w-site flex-col gap-4 px-4 pt-6 lg:px-6 print:hidden">
        <header className="flex flex-col gap-3">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
            Bracket builder
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Build Your {name}
          </h1>
          <p className="max-w-prose text-muted-foreground text-sm">
            Choose the teams, pick every winner, then save your bracket as an
            image or print it. It stays on this device; there is nothing to sign
            up for.
          </p>
        </header>

        {started ? (
          <div className="flex flex-col gap-3">
            <div className="flex max-w-md flex-col gap-1.5">
              <Label htmlFor={titleId}>Bracket name</Label>
              <Input
                id={titleId}
                value={draft.title}
                maxLength={BRACKET_TITLE_MAX}
                placeholder={`My ${name}`}
                onChange={(event) =>
                  update(setDraftTitle(draft, event.target.value))
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!hasPicks}
                onClick={() => {
                  update(clearPicks(draft));
                  analytics?.capture(
                    "bracket_builder_picks_cleared",
                    draftAnalytics(draft, context),
                  );
                }}
              >
                <Eraser aria-hidden />
                Clear picks
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isBlankDraft(draft) && projection === null}
                onClick={() => setConfirmRestart(true)}
              >
                <RotateCcw aria-hidden />
                Start over
              </Button>
            </div>
          </div>
        ) : restored ? (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <p className="font-medium">How do you want to start?</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => start("projection")}>
                Start from our {projectionLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => start("blank")}
              >
                Start from scratch
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={capturing}
            onClick={() => void download()}
          >
            {capturing ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Download aria-hidden />
            )}
            Download image
          </Button>
          <Button type="button" variant="outline" onClick={() => print(false)}>
            <Printer aria-hidden />
            Print or save as PDF
          </Button>
          <Button type="button" variant="outline" onClick={() => print(true)}>
            <FileText aria-hidden />
            Print a blank bracket
          </Button>
          <p className="basis-full text-muted-foreground text-xs">
            Printing fits one page in landscape. To get a PDF, choose "Save as
            PDF" in the print dialog.
          </p>
        </div>
      </div>

      <section
        aria-label="Your bracket"
        className="w-full min-w-0 px-4 print:hidden"
      >
        {started ? (
          <p className="mx-auto mb-3 w-full max-w-site text-muted-foreground text-xs">
            Choose a team for each open spot; the arrows beside a team change
            it. Once a game has both teams, select the one you think wins to
            send it on, and select it again to undo.
          </p>
        ) : null}
        <PlayoffBracket
          view={view}
          plain={!started}
          tightSeeds
          picking={started ? { onPick: pick } : undefined}
          renderEmpty={started ? (_side, at) => picker(at, null) : undefined}
          renderTeamAction={
            started ? (side, at) => picker(at, side.team) : undefined
          }
        />
      </section>

      <AlertDialog open={confirmRestart} onOpenChange={setConfirmRestart}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start over?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces the teams and picks in your bracket. It can't be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my bracket</AlertDialogCancel>
            {projection ? (
              <AlertDialogAction onClick={() => start("projection")}>
                Our {projectionLabel}
              </AlertDialogAction>
            ) : null}
            <AlertDialogAction variant="outline" onClick={() => start("blank")}>
              Blank bracket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BracketExportFrame
        ref={frameRef}
        logo={logo}
        view={printBlank ? blankView : view}
        blank={printBlank}
        title={printBlank ? name : draft.title.trim() || `My ${name}`}
        subtitle={
          printBlank
            ? "Fill in your picks"
            : view.champion
              ? `Champion: ${bracketTeamName(view.champion)}`
              : "Redshirt Sports bracket builder"
        }
      />
    </div>
  );
}
