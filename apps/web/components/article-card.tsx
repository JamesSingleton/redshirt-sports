import type { Slug } from "@redshirt-sports/sanity/types";
import { cn } from "@redshirt-sports/ui/lib/utils";
import Link from "next/link";
import { ViewTransition } from "react";

import FormatDate from "@/components/format-date";
import { IMAGE_SIZES } from "@/lib/image-sizes";
import CustomImage from "./sanity-image";

type CardImage = Parameters<typeof CustomImage>[0]["image"];

export function toSlugPath(slug: Slug | string | null | undefined) {
  if (slug == null) return null;
  return typeof slug === "string" ? slug : (slug.current ?? null);
}

export function ArticleMeta({
  author,
  date,
  className,
}: {
  author?: string | null;
  date?: string | null;
  className?: string;
}) {
  if (!author && !date) return null;
  return (
    <p
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs",
        className,
      )}
    >
      {author ? (
        <span className="text-foreground font-semibold">{author}</span>
      ) : null}
      {date ? <FormatDate dateString={date} /> : null}
    </p>
  );
}

export function ArticleImage({
  id,
  image,
  priority = false,
  sizes = IMAGE_SIZES.articleCard,
  width = 640,
  height = 360,
  className,
}: {
  id?: string;
  image: CardImage;
  priority?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const img = (
    <CustomImage
      image={image}
      width={width}
      height={height}
      className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
      priority={priority}
      mode="cover"
      quality={65}
      sizes={sizes}
    />
  );

  return (
    <div
      className={cn(
        "bg-muted relative aspect-video overflow-hidden rounded-md",
        className,
      )}
    >
      {id ? (
        <ViewTransition name={`post-image-${id}`} share="morph" default="none">
          {img}
        </ViewTransition>
      ) : (
        img
      )}
    </div>
  );
}

/** Image-over-headline card used in grids and rails. */
export default function ArticleCard({
  id,
  title,
  image,
  imagePriority = false,
  slug,
  author,
  date,
  headingLevel = "h3",
  kicker,
  className,
}: {
  id?: string;
  title: string;
  image: CardImage;
  imagePriority?: boolean;
  slug: Slug | string | null;
  author?: string | null;
  date?: string | null;
  headingLevel?: "h2" | "h3" | "h4";
  kicker?: string | null;
  className?: string;
}) {
  const Heading = headingLevel;
  const slugPath = toSlugPath(slug);

  const body = (
    <>
      <ArticleImage id={id} image={image} priority={imagePriority} />
      {kicker ? (
        <span className="text-primary -mb-1.5 text-xs font-semibold">
          {kicker}
        </span>
      ) : null}
      <Heading className="group-hover:text-primary text-base leading-snug font-bold text-balance transition-colors">
        {title}
      </Heading>
    </>
  );

  return (
    <article className={cn("flex flex-col gap-3", className)}>
      {slugPath ? (
        <Link
          href={`/${slugPath}`}
          transitionTypes={["nav-forward"]}
          className="group flex flex-col gap-3"
        >
          {body}
        </Link>
      ) : (
        <div className="flex flex-col gap-3">{body}</div>
      )}
      <ArticleMeta author={author} date={date} />
    </article>
  );
}

/** Compact thumbnail-left row used in sidebars and dense lists. */
export function ArticleRow({
  id,
  title,
  image,
  slug,
  author,
  date,
  headingLevel = "h3",
}: {
  id?: string;
  title: string;
  image: CardImage;
  slug: Slug | string | null;
  author?: string | null;
  date?: string | null;
  headingLevel?: "h2" | "h3" | "h4";
}) {
  const Heading = headingLevel;
  const slugPath = toSlugPath(slug);

  return (
    <article className="grid grid-cols-[7rem_1fr] items-start gap-3">
      <ArticleImage
        id={id}
        image={image}
        width={224}
        height={126}
        sizes="112px"
      />
      <div className="flex flex-col gap-1.5">
        <Heading className="text-sm leading-snug font-bold text-balance">
          {slugPath ? (
            <Link
              href={`/${slugPath}`}
              transitionTypes={["nav-forward"]}
              className="hover:text-primary transition-colors"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </Heading>
        <ArticleMeta author={author} date={date} />
      </div>
    </article>
  );
}

/** Full-bleed image with the headline set over a bottom gradient. */
export function ArticleOverlayCard({
  id,
  title,
  excerpt,
  image,
  imagePriority = false,
  slug,
  author,
  date,
  kicker,
  headingLevel = "h2",
  sizes = IMAGE_SIZES.homeHero,
  className,
  imageClassName = "aspect-4/3 sm:aspect-video",
}: {
  id?: string;
  title: string;
  excerpt?: string | null;
  image: CardImage;
  imagePriority?: boolean;
  slug: Slug | string | null;
  author?: string | null;
  date?: string | null;
  kicker?: string | null;
  headingLevel?: "h1" | "h2" | "h3";
  sizes?: string;
  className?: string;
  imageClassName?: string;
}) {
  const Heading = headingLevel;
  const slugPath = toSlugPath(slug);

  const body = (
    <>
      <ArticleImage
        id={id}
        image={image}
        priority={imagePriority}
        sizes={sizes}
        width={1280}
        height={720}
        className={imageClassName}
      />
      <div className="pointer-events-none absolute inset-0 rounded-md bg-linear-to-t from-black/85 via-black/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 md:p-6">
        {kicker ? (
          <span className="bg-brand text-brand-foreground w-fit rounded-sm px-2 py-0.5 text-xs font-semibold">
            {kicker}
          </span>
        ) : null}
        <Heading className="headline text-2xl text-balance text-white group-hover:underline group-hover:underline-offset-4 md:text-4xl">
          {title}
        </Heading>
        {excerpt ? (
          <p className="hidden max-w-2xl text-sm text-pretty text-white/80 md:line-clamp-2">
            {excerpt}
          </p>
        ) : null}
        {author || date ? (
          <p className="flex flex-wrap gap-x-3 text-xs text-white/75">
            {author ? (
              <span className="font-semibold text-white">{author}</span>
            ) : null}
            {date ? <FormatDate dateString={date} /> : null}
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    <article className={cn("relative", className)}>
      {slugPath ? (
        <Link
          href={`/${slugPath}`}
          transitionTypes={["nav-forward"]}
          className="group relative block"
        >
          {body}
        </Link>
      ) : (
        <div className="relative">{body}</div>
      )}
    </article>
  );
}
