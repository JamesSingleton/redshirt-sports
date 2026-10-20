"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { Check, LinkIcon } from "lucide-react";
import { useState } from "react";

import { Facebook, Twitter } from "@/components/icons";
import { getBaseUrl } from "@/lib/get-base-url";

function openShareWindow(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Compact icon-button share row for the article byline. */
export function ArticleShareButtons({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const articleUrl = `${getBaseUrl()}/${slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(articleUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex gap-1" role="group" aria-label="Share this article">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8"
        onClick={() =>
          openShareWindow(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(title)}`,
          )
        }
        aria-label="Share on X"
      >
        <Twitter className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8"
        onClick={() =>
          openShareWindow(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
          )
        }
        aria-label="Share on Facebook"
      >
        <Facebook className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8"
        onClick={copyLink}
        aria-label={copied ? "Link copied" : "Copy link"}
      >
        {copied ? (
          <Check className="size-4" />
        ) : (
          <LinkIcon className="size-4" />
        )}
      </Button>
    </div>
  );
}
