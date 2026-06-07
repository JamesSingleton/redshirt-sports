import { Button } from "@redshirt-sports/ui/components/button";
import { Separator } from "@redshirt-sports/ui/components/separator";
import Link from "next/link";

import CustomImage from "@/components/sanity-image";

import { TeamSportCategory, type TeamPost } from "./team-post-card";

function formatFeedDate(iso: string) {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

function TeamArticleFeedItem({ post }: { post: TeamPost }) {
  const href = post.slug ? `/${post.slug}` : null;
  const author = post.authors[0];
  const authorHref = author?.slug ? `/authors/${author.slug}` : null;

  return (
    <article className="flex gap-4 py-5" data-ui="feed-article">
      {href ? (
        <Link
          href={href}
          className="relative block h-[100px] w-40 shrink-0 overflow-hidden rounded-md bg-muted"
          prefetch={false}
        >
          <FeedPostImage image={post.mainImage} />
        </Link>
      ) : (
        <div className="relative block h-[100px] w-40 shrink-0 overflow-hidden rounded-md bg-muted">
          <FeedPostImage image={post.mainImage} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <TeamSportCategory post={post} className="w-fit" />
        {href ? (
          <Link href={href} prefetch={false} className="hover:underline">
            <h3 className="text-base leading-snug font-bold">{post.title}</h3>
          </Link>
        ) : (
          <h3 className="text-base leading-snug font-bold">{post.title}</h3>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {author?.name ? (
            authorHref ? (
              <Link href={authorHref} className="hover:underline">
                <span>{author.name}</span>
              </Link>
            ) : (
              <span>{author.name}</span>
            )
          ) : null}
          {post.publishedAt ? (
            <time dateTime={post.publishedAt}>
              {formatFeedDate(post.publishedAt)}
            </time>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function FeedPostImage({ image }: { image: TeamPost["mainImage"] }) {
  if (!image?.asset) {
    return <div className="size-full bg-muted" aria-hidden />;
  }

  return (
    <CustomImage
      image={image}
      width={160}
      height={100}
      className="size-full object-cover"
      mode="cover"
    />
  );
}

export type TeamFeedFooterLink = {
  label: string;
  href: string;
};

export function TeamFeedList({
  title,
  posts,
  footerLinks,
}: {
  title: string;
  posts: TeamPost[];
  footerLinks?: TeamFeedFooterLink[];
}) {
  if (posts.length === 0 && !footerLinks?.length) return null;

  return (
    <section className="mb-10">
      <header className="mb-5 border-b border-border pb-3">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      </header>
      {posts.length > 0 ? (
        <ul className="flex flex-col" data-feed-list>
          {posts.map((post, index) => (
            <li key={post._id}>
              <TeamArticleFeedItem post={post} />
              {index < posts.length - 1 ? <Separator /> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {footerLinks && footerLinks.length > 0 ? (
        <footer className="mt-5 flex flex-wrap gap-6 border-t border-border pt-4">
          {footerLinks.map((link) => (
            <Button
              key={link.href}
              variant="link"
              asChild
              className="h-auto p-0"
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </footer>
      ) : null}
    </section>
  );
}
