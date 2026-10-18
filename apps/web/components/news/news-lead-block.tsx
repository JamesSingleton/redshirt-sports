import type { StoryLike } from "./story";
import { StoryCompact } from "./story-compact";
import { StoryLead } from "./story-lead";

/** First-page hero for list pages: one lead story beside up to three more. */
export function NewsLeadBlock({
  stories,
  kicker,
}: {
  stories: StoryLike[];
  kicker?: string | null;
}) {
  const [lead, ...rest] = stories;
  if (!lead) return null;

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <StoryLead
        story={lead}
        kicker={kicker}
        priority
        sizes="(max-width: 1024px) 100vw, 60vw"
      />
      {rest.length > 0 ? (
        <div className="grid content-start gap-4">
          {rest.slice(0, 3).map((story) => (
            <StoryCompact
              key={story._id}
              story={story}
              kicker={kicker}
              thumbClassName="grid-cols-[7rem_1fr]"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
