"use client";

import { analytics } from "@redshirt-sports/analytics";
import { Button } from "@redshirt-sports/ui/components/button";
import { Download, Share2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Twitter } from "@/components/icons";
import {
  ballotShareFilename,
  ballotShareTweetText,
} from "@/lib/ballot-share-labels";

type BallotShareActionsProps = {
  sport: string;
  division: string;
  week: number;
};

async function fetchShareImageBlob(
  sport: string,
  division: string,
): Promise<Blob> {
  const response = await fetch(
    `/api/vote/college/${sport}/rankings/${division}/share-image`,
  );
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : "Failed to generate share image",
    );
  }
  return response.blob();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function BallotShareActions({
  sport,
  division,
  week,
}: BallotShareActionsProps) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const canShareFiles =
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function";

    if (!canShareFiles) return;

    const probe = new File([new Blob(["x"], { type: "image/png" })], "x.png", {
      type: "image/png",
    });
    try {
      setCanNativeShare(navigator.canShare({ files: [probe] }));
    } catch {
      setCanNativeShare(false);
    }
  }, []);

  const filename = ballotShareFilename({ division, week });
  const tweetText = ballotShareTweetText({ division, week });

  const track = (platform: "download" | "native_share" | "x_intent") => {
    analytics?.capture("ballot_image_shared", {
      platform,
      sport,
      division,
      week,
    });
  };

  const handleDownload = () => {
    startTransition(async () => {
      try {
        const blob = await fetchShareImageBlob(sport, division);
        downloadBlob(blob, filename);
        track("download");
        toast.success("Ballot image downloaded");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to download ballot image",
        );
      }
    });
  };

  const handleNativeShare = () => {
    startTransition(async () => {
      try {
        const blob = await fetchShareImageBlob(sport, division);
        const file = new File([blob], filename, { type: "image/png" });
        await navigator.share({
          files: [file],
          title: tweetText,
          text: tweetText,
        });
        track("native_share");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to share ballot image",
        );
      }
    });
  };

  const handleXIntent = () => {
    track("x_intent");
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(intentUrl, "_blank", "noopener,noreferrer");
    toast.message("Download your ballot image, then attach it to your post");
  };

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-3">
      <p className="text-muted-foreground text-center text-sm">
        Share your ballot on social media — download a branded image instead of
        taking a screenshot.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          onClick={handleDownload}
          disabled={isPending}
          aria-busy={isPending}
        >
          <Download className="mr-2 size-4" />
          {isPending ? "Preparing…" : "Download image"}
        </Button>
        {canNativeShare ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleNativeShare}
            disabled={isPending}
          >
            <Share2 className="mr-2 size-4" />
            Share
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleXIntent}
          disabled={isPending}
          aria-label="Post on X"
        >
          <Twitter className="size-5" />
        </Button>
      </div>
    </div>
  );
}
