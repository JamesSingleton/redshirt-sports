"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { Check, Share2Icon } from "lucide-react";
import { useState } from "react";

interface ArticleCopyLinkButtonProps {
  url: string;
}

export function ArticleCopyLinkButton({ url }: ArticleCopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable.
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 hover:text-primary sm:size-9"
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy URL"}
      aria-label={copied ? "URL copied" : "Copy article URL"}
    >
      {copied ? (
        <Check className="size-4 text-green-600" />
      ) : (
        <Share2Icon className="size-4 text-muted-foreground" />
      )}
      <span className="sr-only">{copied ? "URL copied" : "Copy URL"}</span>
    </Button>
  );
}
