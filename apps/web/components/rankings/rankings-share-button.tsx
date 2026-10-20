"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { Share2 } from "lucide-react";

export function RankingsShareButton({ title }: { title: string }) {
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User dismissed or share failed — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard unavailable.
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="size-9"
      aria-label="Share"
      onClick={() => void handleShare()}
    >
      <Share2 className="size-4" aria-hidden />
    </Button>
  );
}
