import { cn } from "@redshirt-sports/ui/lib/utils";

import FormatDate from "@/components/format-date";
import { getPrimaryAuthor, getStoryPath, type StoryLike } from "./story";
import { StoryImage } from "./story-image";
import { StoryTitleLink } from "./story-title-link";

/**
 * Compact story: small thumbnail on the left, headline on the right
 * (top-stories sidebar and secondary stories beside a lead).
 */
export function StoryCompact({
  story,
  kicker,
  thumbClassName = "grid-cols-[6.5rem_1fr]",
  headingLevel = "h3",
  priority = false,
}: {
  story: StoryLike;
  kicker?: string | null;
  thumbClassName?: string;
  headingLevel?: "h2" | "h3";
  priority?: boolean;
}) {
  const Heading = headingLevel;
  const href = getStoryPath(story);
  const author = getPrimaryAuthor(story);

  return (
    <article
      className={cn(
        "group relative grid gap-3 border-b pb-4 last:border-0",
        thumbClassName,
      )}
    >
      <StoryImage
        image={story.image}
        className="aspect-[4/3] rounded-lg"
        width={224}
        height={168}
        sizes="112px"
        priority={priority}
        quality={62}
      />
      <div className="min-w-0">
        {kicker ? <div className="kicker text-primary">{kicker}</div> : null}
        <Heading className="font-display mt-1 text-lg leading-tight font-bold group-hover:underline">
          <StoryTitleLink
            href={href}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {story.title}
          </StoryTitleLink>
        </Heading>
        <div className="text-muted-foreground mt-1 text-xs">
          {author?.name}
          {author?.name && story.publishedAt ? " · " : null}
          {story.publishedAt ? (
            <FormatDate dateString={story.publishedAt} />
          ) : null}
        </div>
      </div>
    </article>
  );
}
