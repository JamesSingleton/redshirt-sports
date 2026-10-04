"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { CheckIcon, LinkIcon } from "lucide-react";
import { useState } from "react";

import { Facebook, Twitter } from "@/components/icons";
import { getBaseUrl } from "@/lib/get-base-url";

function openShareWindow(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function ArticleShare({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const articleUrl = `${getBaseUrl()}/${slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(articleUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() =>
          openShareWindow(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(title)}`,
          )
        }
      >
        <Twitter />
        <span className="sr-only">Share on X</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() =>
          openShareWindow(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
          )
        }
      >
        <Facebook />
        <span className="sr-only">Share on Facebook</span>
      </Button>
      <Button variant="ghost" size="icon" onClick={copyLink}>
        {copied ? <CheckIcon /> : <LinkIcon />}
        <span className="sr-only">{copied ? "Link copied" : "Copy link"}</span>
      </Button>
    </div>
  );
}
