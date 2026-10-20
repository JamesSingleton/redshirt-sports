import type { QueryHomePageDataResult } from "@redshirt-sports/sanity/types";
import type { StegaBranded } from "next-sanity";

import { StoryCompact } from "@/components/news/story-compact";
import { StoryLead } from "@/components/news/story-lead";

const Hero = ({
  heroPosts,
}: {
  heroPosts: StegaBranded<QueryHomePageDataResult>;
}) => {
  const heroArticle = heroPosts[0];
  if (!heroArticle) return null;
  const topStories = heroPosts.slice(1);

  return (
    <section className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-8">
      <StoryLead
        story={heroArticle}
        kicker="Top story"
        as="h1"
        imageClassName="aspect-[16/9] lg:aspect-[2/1]"
        headingClassName="lg:text-headline-lg"
        priority
        showAvatar
      />
      {topStories.length > 0 ? (
        <div className="grid content-start gap-4 lg:border-l lg:pl-8">
          <div className="kicker text-muted-foreground">Top stories</div>
          {topStories.map((article, index) => (
            <StoryCompact
              key={article._id}
              story={article}
              headingLevel="h2"
              priority={index === 0}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default Hero;
