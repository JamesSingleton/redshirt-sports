import { getStoryPath, type StoryLike } from "@/components/news/story";
import { StoryImage } from "@/components/news/story-image";
import { StoryTitleLink } from "@/components/news/story-title-link";

/** Static "Up next" teaser for the first related story (no infinite scroll). */
export function UpNext({
  story,
  kicker,
}: {
  story: StoryLike;
  kicker?: string | null;
}) {
  const href = getStoryPath(story);

  return (
    <section
      className="border-primary mt-12 border-t-4 pt-4"
      aria-label="Up next"
    >
      <div className="kicker text-muted-foreground">Up next</div>
      <div className="group relative mt-3 grid grid-cols-[1fr_8rem] gap-4 sm:grid-cols-[1fr_12rem]">
        <div>
          {kicker ? <div className="kicker text-primary">{kicker}</div> : null}
          <h2 className="font-display text-headline-sm sm:text-headline font-bold decoration-2 underline-offset-2 group-hover:underline">
            <StoryTitleLink
              href={href}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {story.title}
            </StoryTitleLink>
          </h2>
        </div>
        <StoryImage
          image={story.image}
          className="aspect-[4/3] rounded-lg"
          width={384}
          height={288}
          sizes="(max-width: 640px) 128px, 192px"
          quality={62}
        />
      </div>
    </section>
  );
}
