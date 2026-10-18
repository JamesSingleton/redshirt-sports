import { cn } from "@redshirt-sports/ui/lib/utils";
import Link from "next/link";

import FormatDate from "@/components/format-date";
import { IMAGE_SIZES } from "@/components/sanity-image";
import { AuthorAvatar } from "./author-avatar";
import {
  getPrimaryAuthor,
  getStoryPath,
  type StoryAuthor,
  type StoryLike,
} from "./story";
import { StoryImage } from "./story-image";
import { StoryTitleLink } from "./story-title-link";

/** Large lead story: wide photo, kicker, display headline, dek, byline. */
export function StoryLead({
  story,
  kicker,
  as: Heading = "h2",
  imageClassName = "aspect-[16/9]",
  headingClassName,
  priority = false,
  sizes = IMAGE_SIZES.homeHero,
  showAvatar = false,
}: {
  story: StoryLike;
  kicker?: string | null;
  as?: "h1" | "h2" | "h3";
  imageClassName?: string;
  headingClassName?: string;
  priority?: boolean;
  sizes?: string;
  showAvatar?: boolean;
}) {
  const href = getStoryPath(story);
  const author = getPrimaryAuthor(story);

  return (
    <article className="group relative">
      <StoryImage
        image={story.image}
        className={cn("rounded-xl", imageClassName)}
        width={1200}
        height={600}
        sizes={sizes}
        priority={priority}
        quality={75}
      />
      {kicker ? <div className="kicker text-primary mt-4">{kicker}</div> : null}
      <Heading
        className={cn(
          "font-display text-headline mt-1 font-extrabold uppercase decoration-4 underline-offset-4 group-hover:underline",
          headingClassName,
        )}
      >
        <StoryTitleLink
          href={href}
          className="after:absolute after:inset-0 after:content-['']"
        >
          {story.title}
        </StoryTitleLink>
      </Heading>
      {story.excerpt ? (
        <p className="text-muted-foreground mt-3 line-clamp-3 max-w-2xl text-base lg:text-lg">
          {story.excerpt}
        </p>
      ) : null}
      <div className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
        {author?.name ? (
          <BylineAuthor author={author} showAvatar={showAvatar} />
        ) : null}
        {author?.name && story.publishedAt ? <span>·</span> : null}
        {story.publishedAt ? (
          <FormatDate dateString={story.publishedAt} />
        ) : null}
      </div>
    </article>
  );
}

function BylineAuthor({
  author,
  showAvatar,
}: {
  author: StoryAuthor;
  showAvatar: boolean;
}) {
  const content = (
    <>
      {showAvatar ? (
        <AuthorAvatar name={author.name} image={author.image} size="md" />
      ) : null}
      <span className="text-foreground font-medium">{author.name}</span>
    </>
  );

  if (!author.slug || author.archived) {
    return <span className="flex items-center gap-2">{content}</span>;
  }

  return (
    <Link
      href={`/authors/${author.slug}`}
      prefetch={false}
      className="relative z-10 flex items-center gap-2 hover:underline"
    >
      {content}
    </Link>
  );
}
