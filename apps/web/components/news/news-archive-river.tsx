import Link from "next/link";

import type { HomePost } from "@/components/home/home-page-content";
import { ArchivePublishedTime } from "@/components/news/archive-published-time";
import CustomImage, { IMAGE_SIZES } from "@/components/sanity-image";
import { RelativeTime } from "@/components/relative-time";
import { postArchiveKicker } from "@/lib/news-archive";

function sportBadgeClass(sportSlug?: string | null): string {
  switch (sportSlug) {
    case "football":
      return "bg-primary/10 text-primary";
    case "mens-basketball":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-muted text-foreground";
  }
}

function LeadStory({
  post,
  showSportLabel,
}: {
  post: HomePost;
  showSportLabel?: boolean;
}) {
  const author = post.authors?.[0]?.name;

  return (
    <article className="group grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-[14rem_1fr]">
      <Link
        href={`/${post.slug}`}
        prefetch={false}
        className="relative aspect-[16/9] overflow-hidden rounded-lg"
      >
        <CustomImage
          image={post.image as Parameters<typeof CustomImage>[0]["image"]}
          width={448}
          height={252}
          className="h-full w-full object-cover"
          mode="cover"
          sizes={IMAGE_SIZES.articleCard}
        />
      </Link>
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          {showSportLabel && post.sportTitle ? (
            <span
              className={`rounded px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${sportBadgeClass(post.sportSlug)}`}
            >
              {post.sportTitle}
            </span>
          ) : null}
          <div className="kicker text-primary">Latest · {postArchiveKicker(post)}</div>
        </div>
        <h2 className="mt-1 font-display text-2xl font-extrabold uppercase leading-tight group-hover:underline">
          <Link href={`/${post.slug}`} prefetch={false}>{post.title}</Link>
        </h2>
        {post.excerpt ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {post.excerpt}
          </p>
        ) : null}
        <div className="mt-2 text-xs text-muted-foreground">
          {author}
          {post.publishedAt ? (
            <>
              {" · "}
              <RelativeTime dateString={post.publishedAt} />
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function RiverRow({
  post,
  showSportLabel,
}: {
  post: HomePost;
  showSportLabel?: boolean;
}) {
  const author = post.authors?.[0]?.name;

  return (
    <li>
      <article className="group relative grid grid-cols-[5.5rem_1fr_5.5rem] items-start gap-3 py-3 sm:grid-cols-[6.5rem_1fr_7rem] sm:gap-4">
        {post.publishedAt ? (
          <ArchivePublishedTime
            dateString={post.publishedAt}
            className="pt-0.5 text-xs font-medium text-muted-foreground tabular-nums"
          />
        ) : (
          <span />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {showSportLabel && post.sportTitle ? (
              <span
                className={`rounded px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${sportBadgeClass(post.sportSlug)}`}
              >
                {post.sportTitle}
              </span>
            ) : null}
            <div className="kicker text-primary">{postArchiveKicker(post)}</div>
          </div>
          <h3 className="mt-0.5 font-semibold leading-snug group-hover:underline">
            <Link
              href={`/${post.slug}`}
              prefetch={false}
              className="relative after:absolute after:inset-0"
            >
              {post.title}
            </Link>
          </h3>
          {author ? (
            <div className="mt-1 text-xs text-muted-foreground">{author}</div>
          ) : null}
        </div>
        <Link
          href={`/${post.slug}`}
          prefetch={false}
          className="relative aspect-[4/3] overflow-hidden rounded-md"
        >
          <CustomImage
            image={post.image as Parameters<typeof CustomImage>[0]["image"]}
            width={112}
            height={84}
            className="h-full w-full object-cover"
            mode="cover"
            sizes="56px"
          />
        </Link>
      </article>
    </li>
  );
}

export function NewsArchiveRiver({
  posts,
  pageIndex,
  totalPosts,
  totalPages,
  showSportLabels = false,
}: {
  posts: HomePost[];
  pageIndex: number;
  totalPosts: number;
  totalPages: number;
  showSportLabels?: boolean;
}) {
  const showLead = pageIndex === 1 && posts.length > 0;
  const lead = showLead ? posts[0] : null;
  const riverPosts = showLead ? posts.slice(1) : posts;

  return (
    <div>
      <h2 className="sr-only">Stories</h2>
      {lead ? (
        <LeadStory post={lead} showSportLabel={showSportLabels} />
      ) : null}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {totalPosts.toLocaleString()} stories
        </p>
        {totalPages > 1 ? (
          <span className="text-xs text-muted-foreground">
            Page {pageIndex} of {totalPages}
          </span>
        ) : null}
      </div>
      <ol className="mt-2 divide-y">
        {riverPosts.map((post) => (
          <RiverRow
            key={post._id}
            post={post}
            showSportLabel={showSportLabels}
          />
        ))}
      </ol>
    </div>
  );
}
