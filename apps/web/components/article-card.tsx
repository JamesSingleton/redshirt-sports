import type { Slug } from "@redshirt-sports/sanity/types";
import { Separator } from "@redshirt-sports/ui/components/separator";
import { cn } from "@redshirt-sports/ui/lib/utils";
import Link from "next/link";

import FormatDate from "@/components/format-date";
import RelativePublishDate from "@/components/relative-publish-date";
import { getStoryTypeLabel } from "@/lib/story-type-labels";
import CustomImage, { IMAGE_SIZES } from "./sanity-image";

type ArticleCardVariant =
  | "classic"
  | "medium"
  | "horizontal"
  | "small"
  | "large";

interface ArticleCardProps {
  title: string;
  image: any;
  imagePriority?: boolean;
  slug: Slug | string | null;
  author: string;
  date?: string | null;
  headingLevel?: "h2" | "h3" | "h4";
  variant?: ArticleCardVariant;
  category?: string | null;
  relativeDate?: boolean;
}

function resolveSlugPath(slug: Slug | string | null) {
  if (slug == null) return null;
  return typeof slug === "string" ? slug : slug.current;
}

function resolveCategoryLabel(
  category: string | null | undefined,
): string | null {
  if (!category) return null;
  return getStoryTypeLabel(category) ?? category;
}

function ArticleTitle({
  title,
  slugPath,
  className,
  headingLevel = "h3",
}: {
  title: string;
  slugPath: string | null;
  className?: string;
  headingLevel?: "h2" | "h3" | "h4";
}) {
  const Heading = headingLevel;

  if (!slugPath) {
    return <Heading className={className}>{title}</Heading>;
  }

  return (
    <Heading className={className}>
      <Link
        href={`/${slugPath}`}
        prefetch={false}
        className="hover:underline hover:decoration-2 hover:underline-offset-1"
      >
        {title}
      </Link>
    </Heading>
  );
}

export default function ArticleCard({
  title,
  image,
  imagePriority = false,
  slug,
  author,
  date,
  headingLevel = "h3",
  variant = "classic",
  category,
  relativeDate = false,
}: ArticleCardProps) {
  const slugPath = resolveSlugPath(slug);
  const categoryLabel = resolveCategoryLabel(category);
  const DateDisplay = relativeDate ? RelativePublishDate : FormatDate;

  if (variant === "large") {
    return (
      <Link
        href={slugPath ? `/${slugPath}` : "#"}
        prefetch={false}
        className={cn("group block", !slugPath && "pointer-events-none")}
      >
        <div className="relative mb-3 aspect-video overflow-hidden rounded-lg">
          <CustomImage
            image={image}
            width={720}
            height={405}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            priority={imagePriority}
            mode="cover"
            quality={70}
            sizes={IMAGE_SIZES.articleInline}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
          <div className="absolute right-0 bottom-0 left-0 p-4">
            {categoryLabel ? (
              <span className="mb-2 inline-block rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                {categoryLabel}
              </span>
            ) : null}
            <h3 className="text-xl leading-tight font-bold text-white group-hover:underline">
              {title}
            </h3>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "horizontal") {
    return (
      <Link
        href={slugPath ? `/${slugPath}` : "#"}
        prefetch={false}
        className={cn(
          "group flex gap-4 py-1",
          !slugPath && "pointer-events-none",
        )}
      >
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md sm:h-28 sm:w-40">
          <CustomImage
            image={image}
            width={160}
            height={112}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            priority={imagePriority}
            mode="cover"
            quality={65}
            sizes="(max-width: 768px) 128px, 160px"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h4 className="line-clamp-3 text-base leading-snug font-semibold text-foreground transition-colors group-hover:text-primary sm:text-lg">
            {title}
          </h4>
          {date ? (
            <p className="mt-2 text-sm text-muted-foreground">
              <DateDisplay dateString={date} />
            </p>
          ) : null}
        </div>
      </Link>
    );
  }

  if (variant === "small") {
    return (
      <Link
        href={slugPath ? `/${slugPath}` : "#"}
        prefetch={false}
        className={cn("group block", !slugPath && "pointer-events-none")}
      >
        <div className="flex gap-3">
          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded">
            <CustomImage
              image={image}
              width={80}
              height={56}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              priority={imagePriority}
              mode="cover"
              quality={60}
              sizes="80px"
            />
          </div>
          <div className="flex-1">
            <h4 className="line-clamp-2 text-sm leading-tight font-medium text-foreground transition-colors group-hover:text-primary">
              {title}
            </h4>
            {date ? (
              <p className="mt-1 text-xs text-muted-foreground">
                <DateDisplay dateString={date} />
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "medium") {
    return (
      <Link
        href={slugPath ? `/${slugPath}` : "#"}
        prefetch={false}
        className={cn("group block", !slugPath && "pointer-events-none")}
      >
        <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-lg sm:aspect-video">
          <CustomImage
            image={image}
            width={480}
            height={270}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            priority={imagePriority}
            mode="cover"
            quality={65}
            sizes={IMAGE_SIZES.articleCard}
          />
        </div>
        {categoryLabel ? (
          <span className="mb-1.5 inline-block text-sm font-medium text-primary">
            {categoryLabel}
          </span>
        ) : null}
        <h3 className="line-clamp-3 text-base leading-snug font-semibold text-foreground transition-colors group-hover:text-primary sm:text-lg">
          {title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {author}
          {date ? (
            <>
              {" · "}
              <DateDisplay dateString={date} />
            </>
          ) : null}
        </p>
      </Link>
    );
  }

  return (
    <div className="border-border overflow-hidden rounded-lg border shadow-lg">
      <CustomImage
        image={image}
        width={400}
        height={267}
        className="h-48 w-full object-cover object-top"
        priority={imagePriority}
        mode="cover"
        quality={62}
        sizes={IMAGE_SIZES.articleCard}
      />
      <div className="bg-background p-4">
        <ArticleTitle
          title={title}
          slugPath={slugPath}
          className="mb-2 text-lg font-semibold"
          headingLevel={headingLevel}
        />
        <div className="text-muted-foreground flex items-center space-x-2 text-sm">
          <div>{author}</div>
          <Separator orientation="vertical" className="h-4" />
          {date ? <DateDisplay dateString={date} /> : null}
        </div>
      </div>
    </div>
  );
}
