import type {
  PostsBySchoolAndStoryTypeQueryResult,
  PostsBySchoolQueryResult,
} from "@redshirt-sports/sanity/types";
import { cn } from "@redshirt-sports/ui/lib/utils";
import Link from "next/link";
import type { StegaBranded } from "next-sanity";

import CustomImage, { IMAGE_SIZES } from "@/components/sanity-image";
import { TeamRelativeDate } from "@/components/teams/team-relative-date";

export { TeamRelativeDate };

import { ArticleHeroTransition } from "@/components/view-transitions/article-hero-transition";
import { NAV_FORWARD_TRANSITION } from "@/lib/view-transition-nav";

export type TeamPost = StegaBranded<
  | PostsBySchoolQueryResult["posts"][number]
  | PostsBySchoolAndStoryTypeQueryResult[number]
>;

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
  post: StegaBranded<TeamPost>;
  className?: string;
}) {
  const { label, href } = getPostSportCategory(post);

  return (
    <Link
      href={href}
      className={cn(
        "mb-1.5 block text-sm font-semibold tracking-wide text-destructive uppercase hover:underline",
        className,
      )}
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
  quality = 62,
  sizes,
}: {
  image: StegaBranded<TeamPost>["image"];
  width: number;
  height: number;
  className?: string;
  quality?: number;
  sizes?: string;
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
      quality={quality}
      sizes={sizes}
    />
  );
}

export function TeamFeaturedArticle({
  post,
}: {
  post: StegaBranded<TeamPost>;
}) {
  const href = post.slug ? `/${post.slug}` : null;

  const slug = post.slug ?? "";
  const featuredImage = (
    <TeamPostImage
      image={post.image}
      width={400}
      height={225}
      className="h-full w-full object-cover"
      sizes={IMAGE_SIZES.teamFeatured}
    />
  );
  const image = (
    <div className="relative aspect-video overflow-hidden bg-muted">
      {href ? (
        <ArticleHeroTransition slug={slug}>
          {featuredImage}
        </ArticleHeroTransition>
      ) : (
        featuredImage
      )}
    </div>
  );

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-lg">
      {href ? (
        <Link
          href={href}
          className="block"
          prefetch={true}
          transitionTypes={[...NAV_FORWARD_TRANSITION]}
        >
          {image}
        </Link>
      ) : (
        <div className="block">{image}</div>
      )}
      <div className="flex flex-1 flex-col py-3">
        <TeamSportCategory post={post} />
        <h2 className="mb-2 line-clamp-3 overflow-hidden text-[15px] leading-snug font-bold">
          {href ? (
            <Link
              href={href}
              prefetch={true}
              transitionTypes={[...NAV_FORWARD_TRANSITION]}
            >
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

export function TeamNewsItem({ post }: { post: StegaBranded<TeamPost> }) {
  const href = post.slug ? `/${post.slug}` : null;
  const slug = post.slug ?? "";

  const thumbnail = (
    <TeamPostImage
      image={post.image}
      width={180}
      height={110}
      className="h-full w-full object-cover"
      sizes={IMAGE_SIZES.teamThumbnail}
    />
  );

  return (
    <article className="flex gap-4 border-b border-border pb-5">
      <div className="h-[90px] w-[140px] shrink-0 overflow-hidden rounded bg-muted md:h-[110px] md:w-[180px]">
        {href ? (
          <Link
            href={href}
            className="block h-full"
            prefetch={true}
            transitionTypes={[...NAV_FORWARD_TRANSITION]}
          >
            <ArticleHeroTransition slug={slug}>
              {thumbnail}
            </ArticleHeroTransition>
          </Link>
        ) : (
          thumbnail
        )}
      </div>
      <div className="min-w-0 flex-1">
        <TeamSportCategory post={post} />
        <h3 className="mb-2 text-base leading-snug font-bold text-foreground">
          {href ? (
            <Link
              href={href}
              prefetch={true}
              transitionTypes={[...NAV_FORWARD_TRANSITION]}
            >
              {post.title}
            </Link>
          ) : (
            post.title
          )}
        </h3>
        <TeamPostMeta post={post} className="text-sm" />
      </div>
    </article>
  );
}

function TeamPostMeta({
  post,
  className,
}: {
  post: StegaBranded<TeamPost>;
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
