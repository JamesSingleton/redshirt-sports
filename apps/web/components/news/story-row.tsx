import FormatDate from "@/components/format-date";
import { AuthorAvatar } from "./author-avatar";
import { getPrimaryAuthor, getStoryPath, type StoryLike } from "./story";
import { StoryImage } from "./story-image";
import { StoryTitleLink } from "./story-title-link";

/**
 * List row: headline copy on the left, thumbnail on the right
 * (news.html / index.html "Latest" rows).
 */
export function StoryRow({
  story,
  kicker,
  priority = false,
}: {
  story: StoryLike;
  kicker?: string | null;
  priority?: boolean;
}) {
  const href = getStoryPath(story);
  const author = getPrimaryAuthor(story);

  return (
    <article className="group relative grid grid-cols-[1fr_7.5rem] gap-4 py-4 sm:grid-cols-[1fr_11rem]">
      <div className="min-w-0">
        {kicker ? <div className="kicker text-primary">{kicker}</div> : null}
        <h3 className="font-display text-headline-sm mt-1 font-bold decoration-2 underline-offset-2 group-hover:underline">
          <StoryTitleLink
            href={href}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {story.title}
          </StoryTitleLink>
        </h3>
        {story.excerpt ? (
          <p className="text-muted-foreground mt-1 line-clamp-2 hidden text-sm sm:block">
            {story.excerpt}
          </p>
        ) : null}
        <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
          {author?.name ? (
            <>
              <AuthorAvatar name={author.name} image={author.image} size="sm" />
              <span>{author.name}</span>
            </>
          ) : null}
          {author?.name && story.publishedAt ? <span>·</span> : null}
          {story.publishedAt ? (
            <FormatDate dateString={story.publishedAt} />
          ) : null}
        </div>
      </div>
      <StoryImage
        image={story.image}
        className="aspect-[4/3] rounded-md"
        width={352}
        height={264}
        sizes="(max-width: 640px) 120px, 176px"
        priority={priority}
        quality={62}
      />
    </article>
  );
}
