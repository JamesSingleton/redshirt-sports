import type { QueryPostSlugDataResult } from "@redshirt-sports/sanity/types";
import { Button } from "@redshirt-sports/ui/components/button";
import { Mail } from "lucide-react";
import Link from "next/link";

import FormatDate from "@/components/format-date";
import { Facebook, Twitter } from "@/components/icons";
import { ArticleCopyLinkButton } from "@/components/posts/article-copy-link-button";
import CustomImage from "@/components/sanity-image";
import { getBaseUrl } from "@/lib/get-base-url";

type PostAuthor = NonNullable<QueryPostSlugDataResult>["authors"][0];

function getAuthorTwitterHandle(author: PostAuthor): string | null {
  const twitterUrl = author.socialLinks?.twitter;
  if (!twitterUrl) return null;

  const handle = twitterUrl.split("/").pop()?.replace(/^@/, "");
  return handle ? `@${handle}` : null;
}

function buildShareUrl(
  platform: "facebook" | "twitter" | "email",
  articleUrl: string,
  title: string,
) {
  switch (platform) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(title)}`;
    case "email":
      return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(articleUrl)}`;
  }
}

interface ArticleBylineProps {
  authors: PostAuthor[];
  publishedAt?: string | null;
  slug: string;
  title: string;
}

function ArticleShareActions({
  articleUrl,
  title,
}: {
  articleUrl: string;
  title: string;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-0 self-center"
      role="group"
      aria-label="Share article"
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-8 hover:text-primary sm:size-9"
        asChild
      >
        <a
          href={buildShareUrl("facebook", articleUrl, title)}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on Facebook"
        >
          <Facebook className="size-4 text-muted-foreground" />
          <span className="sr-only">Share on Facebook</span>
        </a>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 hover:text-primary sm:size-9"
        asChild
      >
        <a
          href={buildShareUrl("twitter", articleUrl, title)}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on X"
        >
          <Twitter className="size-4 text-muted-foreground" />
          <span className="sr-only">Share on X</span>
        </a>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 hover:text-primary sm:size-9"
        asChild
      >
        <a
          href={buildShareUrl("email", articleUrl, title)}
          title="Share via Email"
        >
          <Mail className="size-4 text-muted-foreground" />
          <span className="sr-only">Share via Email</span>
        </a>
      </Button>
      <ArticleCopyLinkButton url={articleUrl} />
    </div>
  );
}

export function ArticleByline({
  authors,
  publishedAt,
  slug,
  title,
}: ArticleBylineProps) {
  const primaryAuthor = authors[0];
  if (!primaryAuthor) return null;

  const articleUrl = `${getBaseUrl()}/${slug}`;
  const twitterHandle = getAuthorTwitterHandle(primaryAuthor);

  return (
    <div className="mb-7 flex items-start gap-2 border-border border-y py-4 sm:items-center sm:gap-3 sm:py-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="size-10 shrink-0 overflow-hidden rounded-full bg-muted">
          <CustomImage
            image={primaryAuthor.image}
            width={40}
            height={40}
            className="size-10 object-cover"
            mode="cover"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="min-w-0">
            {primaryAuthor.archived ? (
              <span className="block truncate text-primary text-sm font-bold">
                {primaryAuthor.name}
              </span>
            ) : (
              <Link
                href={`/authors/${primaryAuthor.slug}`}
                prefetch={false}
                className="block truncate text-foreground text-sm font-bold hover:underline"
              >
                {primaryAuthor.name}
              </Link>
            )}
          </div>
          <div className="flex min-w-0 items-center gap-2 text-muted-foreground text-xs">
            {publishedAt ? (
              <span className="shrink-0">
                <FormatDate dateString={publishedAt} />
              </span>
            ) : null}
            {twitterHandle ? (
              <>
                <span aria-hidden="true" className="shrink-0">
                  •
                </span>
                {primaryAuthor.socialLinks?.twitter ? (
                  <a
                    href={primaryAuthor.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate transition-colors hover:text-primary"
                  >
                    {twitterHandle}
                  </a>
                ) : (
                  <span className="truncate">{twitterHandle}</span>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>

      <ArticleShareActions articleUrl={articleUrl} title={title} />
    </div>
  );
}
