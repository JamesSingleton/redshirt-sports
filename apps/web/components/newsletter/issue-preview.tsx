import type { QueryNewsletterPreviewResult } from "@redshirt-sports/sanity/types";
import Link from "next/link";

import FormatDate from "@/components/format-date";

const ROWS = 5;
/** Every row is the same height, so the placeholder matches the real list. */
const ROW = "flex h-[5.5rem] flex-col justify-center border-t px-5";

/**
 * A look at what lands in the inbox: the newest headlines, laid out like the
 * email. `posts` is null while a draft-mode render streams in.
 */
export function IssuePreview({
  posts,
}: {
  posts: QueryNewsletterPreviewResult | null;
}) {
  return (
    <figure
      aria-label="Sample issue"
      className="overflow-hidden rounded-xl border bg-card shadow-sm"
    >
      <div className="bg-ink px-5 py-5 text-ink-foreground">
        <div className="kicker text-ink-foreground/60">Redshirt Sports</div>
        <div className="mt-1 font-display text-xl font-extrabold">
          The Week in College Sports
        </div>
        <div className="mt-1 text-sm text-ink-foreground/70">
          A sample issue, from our latest stories
        </div>
      </div>
      <ol>
        {posts
          ? posts.slice(0, ROWS).map((post) => (
              <li key={post._id} className={ROW}>
                <div className="kicker text-primary">
                  {post.sport ? `${post.sport} · ` : null}
                  <FormatDate dateString={post.publishedAt} />
                </div>
                <Link
                  href={`/${post.slug}`}
                  className="mt-1 line-clamp-2 font-semibold leading-snug hover:underline"
                >
                  {post.title}
                </Link>
              </li>
            ))
          : Array.from({ length: ROWS }, (_, index) => (
              <li key={index} className={ROW} aria-hidden>
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-muted" />
              </li>
            ))}
      </ol>
      <figcaption className="border-t bg-muted/40 px-5 py-3 text-sm text-muted-foreground">
        …and every other story we publish that week.
      </figcaption>
    </figure>
  );
}
