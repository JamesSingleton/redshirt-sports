import { urlFor } from "@redshirt-sports/sanity/client";
import type { QueryPostSlugDataResult } from "@redshirt-sports/sanity/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@redshirt-sports/ui/components/avatar";
import Link from "next/link";

import FormatDate from "@/components/format-date";
import { ArticleShareToolbar } from "@/components/posts/article-share";
import { RelativeTime } from "@/components/relative-time";

type PostAuthor = NonNullable<QueryPostSlugDataResult>["authors"][0];

function authorInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ArticleByline({
  authors,
  publishedAt,
  updatedAt,
  readingTimeMinutes,
  slug,
  title,
}: {
  authors: PostAuthor[];
  publishedAt?: string | null;
  updatedAt?: string | null;
  readingTimeMinutes: number;
  slug: string;
  title: string;
}) {
  const primary = authors[0];
  const showUpdated =
    publishedAt &&
    updatedAt &&
    new Date(updatedAt).getTime() - new Date(publishedAt).getTime() > 3_600_000;

  const avatarUrl = primary?.image
    ? urlFor(primary.image).width(80).height(80).url()
    : undefined;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3 border-y py-3">
      {primary ? (
        <Avatar className="size-10">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={primary.name ?? "Author"} />
          ) : null}
          <AvatarFallback className="text-xs font-semibold">
            {authorInitials(primary.name)}
          </AvatarFallback>
        </Avatar>
      ) : null}
      <div className="text-sm">
        {primary ? (
          <div className="font-semibold">
            By{" "}
            {primary.archived || !primary.slug ? (
              primary.name
            ) : (
              <Link
                href={`/people/${primary.slug}`}
                className="hover:underline"
                prefetch={false}
              >
                {primary.name}
              </Link>
            )}
          </div>
        ) : null}
        <div className="text-muted-foreground">
          {publishedAt ? <FormatDate dateString={publishedAt} /> : null}
          {readingTimeMinutes > 0 ? (
            <>
              {" · "}
              {readingTimeMinutes} min read
            </>
          ) : null}
          {showUpdated && updatedAt ? (
            <>
              {" · Updated "}
              <RelativeTime dateString={updatedAt} />
            </>
          ) : null}
        </div>
      </div>
      <div className="ml-auto flex gap-1">
        <ArticleShareToolbar slug={slug} title={title} />
      </div>
    </div>
  );
}
