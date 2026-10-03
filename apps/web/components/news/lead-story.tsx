import { cn } from "@redshirt-sports/ui/lib/utils";
import type { Route } from "next";
import Link from "next/link";

import { ArticleImage } from "@/components/article-card";
import FormatDate from "@/components/format-date";
import CustomImage from "@/components/sanity-image";
import { IMAGE_SIZES } from "@/lib/image-sizes";

type Image = Parameters<typeof CustomImage>[0]["image"];

export type LeadStoryPost = {
  _id: string;
  title: string;
  excerpt?: string | null;
  slug: string | null;
  image: Image;
  publishedAt?: string | null;
  authors?: Array<{
    name?: string | null;
    slug?: string | null;
    image?: Image | null;
  } | null> | null;
};

/** Big image, big headline, excerpt and byline. Used for the top story of a page or section. */
export function LeadStory({
  post,
  headingLevel = "h2",
  priority = false,
  sizes = IMAGE_SIZES.homeHero,
  headingClassName,
}: {
  post: LeadStoryPost;
  headingLevel?: "h1" | "h2" | "h3";
  priority?: boolean;
  sizes?: string;
  headingClassName?: string;
}) {
  const Heading = headingLevel;
  const author = post.authors?.[0];
  const href = post.slug ? (`/${post.slug}` as Route) : null;

  const media = (
    <ArticleImage
      id={post._id}
      image={post.image}
      priority={priority}
      sizes={sizes}
      width={1280}
      height={720}
    />
  );
  const heading = (
    <Heading
      className={cn(
        "headline group-hover:text-primary text-3xl transition-colors md:text-4xl",
        headingClassName,
      )}
    >
      {post.title}
    </Heading>
  );

  return (
    <article className="flex flex-col gap-4">
      {href ? (
        <Link
          href={href}
          transitionTypes={["nav-forward"]}
          className="group flex flex-col gap-4"
        >
          {media}
          {heading}
        </Link>
      ) : (
        <div className="flex flex-col gap-4">
          {media}
          {heading}
        </div>
      )}
      {post.excerpt ? (
        <p className="text-muted-foreground line-clamp-3 max-w-prose text-pretty">
          {post.excerpt}
        </p>
      ) : null}
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {author?.name ? (
          <Link
            href={`/authors/${author.slug}` as Route}
            className="text-foreground hover:text-primary flex items-center gap-2 font-semibold"
          >
            {author.image ? (
              <CustomImage
                image={author.image}
                width={28}
                height={28}
                className="size-7 rounded-full object-cover"
              />
            ) : null}
            {author.name}
          </Link>
        ) : null}
        {post.publishedAt ? <FormatDate dateString={post.publishedAt} /> : null}
      </div>
    </article>
  );
}
