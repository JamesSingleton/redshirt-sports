import type {
  PostsBySchoolAndStoryTypeQueryResult,
  PostsBySchoolQueryResult,
} from "@redshirt-sports/sanity/types";
import { formatDistanceToNow, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { cn } from "@redshirt-sports/ui/lib/utils";
import Link from "next/link";

import CustomImage from "@/components/sanity-image";

export type TeamPost =
  | PostsBySchoolQueryResult["posts"][number]
  | PostsBySchoolAndStoryTypeQueryResult[number];

const TIME_ZONE = "America/Phoenix";

const DEFAULT_SPORT_CATEGORY = {
  label: "College News",
  href: "/college/news",
} as const;

export function getPostSportCategory(post: TeamPost) {
  const sport = "sport" in post ? post.sport : null;

  if (sport?.slug && sport.title) {
    return {
      label: sport.title,
      href: `/college/${sport.slug}/news`,
    };
  }

  return DEFAULT_SPORT_CATEGORY;
}

export function TeamSportCategory({
  post,
  className,
}: {
  post: TeamPost;
  className?: string;
}) {
  const { label, href } = getPostSportCategory(post);

  return (
    <Link
      href={href}
      className={cn("team-sport-category hover:underline", className)}
      prefetch={false}
    >
      <span>{label}</span>
    </Link>
  );
}

function TeamPostImage({
  image,
  width,
  height,
  className,
}: {
  image: TeamPost["mainImage"];
  width: number;
  height: number;
  className?: string;
}) {
  if (!image?.asset) {
    return <div className={className} aria-hidden />;
  }

  return (
    <CustomImage
      image={image}
      width={width}
      height={height}
      className={className}
      mode="cover"
    />
  );
}

function TeamRelativeDate({ dateString }: { dateString: string }) {
  const date = toZonedTime(parseISO(dateString), TIME_ZONE);

  return (
    <time dateTime={dateString} suppressHydrationWarning>
      {formatDistanceToNow(date, { addSuffix: true })}
    </time>
  );
}

export function TeamFeaturedArticle({ post }: { post: TeamPost }) {
  const href = post.slug ? `/${post.slug}` : null;

  const image = (
    <div className="team-featured-image">
      <TeamPostImage
        image={post.mainImage}
        width={400}
        height={225}
        className="h-full w-full object-cover"
      />
    </div>
  );

  return (
    <article className="team-featured-card">
      {href ? (
        <Link href={href} className="team-featured-link" prefetch={false}>
          {image}
        </Link>
      ) : (
        <div className="team-featured-link">{image}</div>
      )}
      <div className="team-featured-content">
        <TeamSportCategory post={post} />
        <h2 className="team-featured-title">
          {href ? (
            <Link href={href} prefetch={false}>
              {post.title}
            </Link>
          ) : (
            post.title
          )}
        </h2>
        <TeamPostMeta post={post} className="mt-auto" />
      </div>
    </article>
  );
}

export function TeamNewsItem({ post }: { post: TeamPost }) {
  const href = post.slug ? `/${post.slug}` : null;

  return (
    <article className="team-news-item">
      <div className="team-news-image">
        <TeamPostImage
          image={post.mainImage}
          width={180}
          height={110}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="team-news-content">
        <TeamSportCategory post={post} />
        <h3 className="team-news-title">
          {href ? (
            <Link href={href} prefetch={false}>
              {post.title}
            </Link>
          ) : (
            post.title
          )}
        </h3>
        <TeamPostMeta post={post} />
      </div>
    </article>
  );
}

function TeamPostMeta({
  post,
  className,
}: {
  post: TeamPost;
  className?: string;
}) {
  const author = post.authors[0]?.name ?? "Redshirt Sports";

  return (
    <div className={cn("text-muted-foreground text-sm", className)}>
      <span>{author}</span>
      {post.publishedAt ? (
        <>
          <span className="mx-1">·</span>
          <TeamRelativeDate dateString={post.publishedAt} />
        </>
      ) : null}
    </div>
  );
}
