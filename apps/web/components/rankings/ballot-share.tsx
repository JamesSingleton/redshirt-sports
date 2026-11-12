"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  type BallotShareInput,
  ballotShareFilename,
  ballotShareTitle,
  buildPostText,
  xIntentUrl,
} from "@/lib/ballot-share";
import { renderBallotShareImage } from "@/lib/ballot-share-canvas";

function XMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function BallotShare({
  input,
  pollUrl,
}: {
  input: BallotShareInput;
  /** Absolute URL linked in the post. */
  pollUrl: string;
}) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Render once up front so the buttons can act inside the click itself:
  // Safari drops share/clipboard/popups that wait on an async render.
  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    renderBallotShareImage(input).then(
      (b) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(b);
        setBlob(b);
        setPreviewUrl(objectUrl);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [input]);

  const filename = ballotShareFilename(input);
  const text = buildPostText({
    poll: input.poll,
    week: input.week,
    url: pollUrl,
  });

  const handlePost = async () => {
    if (!blob) return;
    const file = new File([blob], filename, { type: "image/png" });

    // Phones: the share sheet hands the image and text to the X app.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }

    // Desktop: X's web intent can't take an image, so put it on the
    // clipboard to paste into the composer, falling back to a download.
    const copied = navigator.clipboard?.write
      ? navigator.clipboard
          .write([new ClipboardItem({ "image/png": blob })])
          .then(
            () => true,
            () => false,
          )
      : Promise.resolve(false);
    window.open(xIntentUrl(text), "_blank", "noopener,noreferrer");
    if (await copied) {
      toast.success("Image copied", {
        description: "Paste it into your post to attach your ballot.",
      });
    } else {
      downloadBlob(blob, filename);
      toast.success("Image downloaded", {
        description: "Attach it to your post on X.",
      });
    }
  };

  if (failed) return null;

  return (
    <section
      aria-labelledby="ballot-share-heading"
      className="flex w-full max-w-md flex-col items-center gap-4"
    >
      <h2 id="ballot-share-heading" className="text-xl font-bold">
        Share your ballot
      </h2>
      <div className="aspect-[4/5] w-full overflow-hidden rounded-lg border bg-muted shadow-sm">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`${ballotShareTitle(input)} by ${input.voterName || "you"}`}
            className="size-full object-contain"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" aria-hidden />
            <span className="sr-only">Creating your ballot image</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={handlePost} disabled={!blob}>
          <XMark className="size-4" />
          Post to X
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => blob && downloadBlob(blob, filename)}
          disabled={!blob}
        >
          <Download className="size-4" aria-hidden />
          Download image
        </Button>
      </div>
    </section>
  );
}
