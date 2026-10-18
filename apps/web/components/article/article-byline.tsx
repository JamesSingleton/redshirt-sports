import Link from "next/link";

import FormatDate from "@/components/format-date";
import { AuthorAvatar } from "@/components/news/author-avatar";
import type { StoryAuthor } from "@/components/news/story";
import { ArticleShareButtons } from "./article-share-buttons";

function AuthorName({ author }: { author: StoryAuthor }) {
  if (!author.slug || author.archived) {
    return <span>{author.name}</span>;
  }
  return (
    <Link
      href={`/authors/${author.slug}`}
      prefetch={false}
      className="hover:underline"
    >
      {author.name}
    </Link>
  );
}

/** Byline strip: avatars, "By …", date, read time and share buttons. */
export function ArticleByline({
  authors,
  publishedAt,
  readingMinutes,
  slug,
  title,
}: {
  authors: ReadonlyArray<StoryAuthor>;
  publishedAt?: string | null;
  readingMinutes: number;
  slug: string;
  title: string;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3 border-y py-3">
      {authors.length > 0 ? (
        <div className="flex -space-x-2">
          {authors.map((author, index) => (
            <AuthorAvatar
              key={`${author.slug ?? author.name}-${index}`}
              name={author.name}
              image={author.image}
              size="lg"
              className="ring-background ring-2"
            />
          ))}
        </div>
      ) : null}
      <div className="text-sm">
        {authors.length > 0 ? (
          <div className="font-semibold">
            By{" "}
            {authors.map((author, index) => (
              <span key={`${author.slug ?? author.name}-name-${index}`}>
                {index > 0
                  ? index === authors.length - 1
                    ? " and "
                    : ", "
                  : null}
                <AuthorName author={author} />
              </span>
            ))}
          </div>
        ) : null}
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-1.5">
          {publishedAt ? <FormatDate dateString={publishedAt} /> : null}
          {publishedAt ? <span aria-hidden>·</span> : null}
          <span>{readingMinutes} min read</span>
        </div>
      </div>
      <div className="ml-auto">
        <ArticleShareButtons slug={slug} title={title} />
      </div>
    </div>
  );
}
