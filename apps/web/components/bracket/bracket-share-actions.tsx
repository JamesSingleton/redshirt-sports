"use client";

import { analytics } from "@redshirt-sports/analytics";
import type { BracketView } from "@redshirt-sports/db/playoff-bracket";
import { Button } from "@redshirt-sports/ui/components/button";
import { toast } from "@redshirt-sports/ui/components/toast";
import { Download, Loader2, Printer, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";

import { BracketExportFrame } from "@/components/bracket/builder/bracket-export-frame";
import { bracketExportFilename } from "@/lib/bracket-builder";
import { captureBracketImage, captureBracketPdf } from "@/lib/bracket-capture";
import { downloadBlob } from "@/lib/download-blob";

type ExportKind = "image" | "pdf";

/**
 * Print, save and share for a published bracket. The files come from the same
 * light-theme export frame the builder uses, so they match what readers make.
 * The frame mounts only while a file is being made, so the page doesn't carry
 * a second copy of the bracket and its logos.
 */
export function BracketShareActions({
  view,
  title,
  subtitle,
  division,
  year,
  logo,
}: {
  view: BracketView;
  title: string;
  subtitle: string;
  division: string;
  year: number;
  logo: React.ComponentProps<typeof BracketExportFrame>["logo"];
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<ExportKind | null>(null);

  async function exportBracket(kind: ExportKind) {
    if (exporting) return;
    flushSync(() => setExporting(kind));
    const frame = frameRef.current;
    try {
      if (!frame) throw new Error("No export frame");
      const file =
        kind === "image"
          ? await captureBracketImage(frame)
          : await captureBracketPdf(frame);
      downloadBlob(file, bracketExportFilename(division, year, kind));
      analytics?.capture("bracket_page_exported", { division, year, kind });
    } catch {
      toast.error("Couldn't make the file. Please try again.");
    } finally {
      setExporting(null);
    }
  }

  async function share() {
    const url = window.location.href.split("?")[0] ?? window.location.href;
    // The phone's share sheet where there is one, else the link on the clipboard.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        analytics?.capture("bracket_page_shared", {
          division,
          year,
          method: "native",
        });
      } catch {
        // Closing the share sheet rejects; nothing to report.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
      analytics?.capture("bracket_page_shared", {
        division,
        year,
        method: "copy",
      });
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            // Short enough that all three fit one row on a phone.
            { kind: "pdf", label: "Print", Icon: Printer },
            { kind: "image", label: "Save image", Icon: Download },
          ] as const
        ).map(({ kind, label, Icon }) => (
          <Button
            key={kind}
            type="button"
            variant="outline"
            size="sm"
            disabled={exporting !== null}
            onClick={() => void exportBracket(kind)}
            title={
              kind === "pdf"
                ? "Download a one-page PDF to print"
                : "Download the bracket as an image"
            }
          >
            {exporting === kind ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Icon aria-hidden />
            )}
            {label}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void share()}
        >
          <Share2 aria-hidden />
          Share
        </Button>
      </div>
      {exporting ? (
        <BracketExportFrame
          ref={frameRef}
          view={view}
          title={title}
          subtitle={subtitle}
          blank={false}
          logo={logo}
        />
      ) : null}
    </>
  );
}
