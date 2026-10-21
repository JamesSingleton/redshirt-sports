import type { Slug } from "@redshirt-sports/sanity/types";
import { Separator } from "@redshirt-sports/ui/components/separator";
import Link from "next/link";

import FormatDate from "@/components/format-date";
import { ArticleHeroTransition } from "@/components/view-transitions/article-hero-transition";
import { NAV_FORWARD_TRANSITION } from "@/lib/view-transition-nav";
import CustomImage, { IMAGE_SIZES } from "./sanity-image";

export default function ArticleCard({
  title,
  image,
  imagePriority = false,
  slug,
  author,
  date,
  headingLevel = "h3",
}: {
  title: string;
  image: any;
  imagePriority?: boolean;
  slug: Slug | string | null;
  author: string;
  date?: string | null;
  headingLevel?: "h2" | "h3" | "h4";
}) {
  const Heading = headingLevel;
  const slugPath =
    slug == null ? null : typeof slug === "string" ? slug : slug.current;

  const heroImage = (
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
  );

  const heroWithTransition = slugPath ? (
    <ArticleHeroTransition slug={slugPath}>{heroImage}</ArticleHeroTransition>
  ) : (
    heroImage
  );

  return (
    <div className="border-border overflow-hidden rounded-lg border shadow-lg">
      {slugPath ? (
        <Link
          href={`/${slugPath}`}
          className="block"
          prefetch={true}
          transitionTypes={[...NAV_FORWARD_TRANSITION]}
        >
          {heroWithTransition}
        </Link>
      ) : (
        heroWithTransition
      )}
      <div className="bg-background p-4">
        <Heading className="mb-2 text-lg font-semibold">
          {slugPath ? (
            <Link
              href={`/${slugPath}`}
              className="hover:underline hover:decoration-2 hover:underline-offset-1"
              prefetch={true}
              transitionTypes={[...NAV_FORWARD_TRANSITION]}
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </Heading>
        <div className="text-muted-foreground flex items-center space-x-2 text-sm">
          <div>{author}</div>
          <Separator orientation="vertical" className="h-4" />
          {date && <FormatDate dateString={date} />}
        </div>
      </div>
    </div>
  );
}
