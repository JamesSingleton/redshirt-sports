import { Separator } from "@redshirt-sports/ui/components/separator";
import Link from "next/link";

import CustomImage, { IMAGE_SIZES } from "@/components/sanity-image";
import {
  type TeamPost,
  TeamRelativeDate,
  TeamSportCategory,
} from "./team-post-card";

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
            <>
              <span className="mx-1">·</span>
              <TeamRelativeDate dateString={post.publishedAt} />
            </>
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
      quality={62}
      sizes={IMAGE_SIZES.teamThumbnail}
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
    <section className="mb-8">
      <h2 className="mb-5 text-[22px] font-bold text-foreground">{title}</h2>
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
        <footer className="mt-5 flex flex-wrap gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-bold tracking-wide text-destructive-foreground uppercase hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </footer>
      ) : null}
    </section>
  );
}
