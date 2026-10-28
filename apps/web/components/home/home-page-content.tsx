import { Avatar, AvatarFallback } from "@redshirt-sports/ui/components/avatar";
import { Button } from "@redshirt-sports/ui/components/button";
import { cn } from "@redshirt-sports/ui/lib/utils";
import Link from "next/link";

import { AdSlot } from "@/components/ad-slot";
import { MostReadCard } from "@/components/most-read-card";
import { RankingsWidget } from "@/components/rankings-widget";
import { RelativeTime } from "@/components/relative-time";
import CustomImage, { IMAGE_SIZES } from "@/components/sanity-image";
import type { AdvertisementCreative } from "@/lib/advertisement";
import type { MostReadItem } from "@/lib/most-read-data";
import type { RankingsWidgetPoll } from "@/lib/rankings-widget-data";

export type HomePost = {
  _id: string;
  title: string;
  excerpt?: string | null;
  slug: string;
  publishedAt?: string | null;
  image?: unknown;
  authors?: Array<{
    name?: string | null;
    slug?: string | null;
    image?: unknown;
  }> | null;
  divisionLabel?: string | null;
  tagNames?: string[] | null;
  sportTitle?: string | null;
  sportSlug?: string | null;
};

function postKicker(post: HomePost): string {
  if (post.divisionLabel) {
    return post.divisionLabel;
  }
  const tag = post.tagNames?.[0];
  return tag ?? "News";
}

function authorInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function HomePageContent({
  posts,
  mostRead,
  rankingsPolls,
  leaderboardAd,
  sidebarAd,
}: {
  posts: HomePost[];
  mostRead: MostReadItem[];
  rankingsPolls: RankingsWidgetPoll[];
  leaderboardAd: AdvertisementCreative | null;
  sidebarAd: AdvertisementCreative | null;
}) {
  const lead = posts[0];
  const topStories = posts.slice(1, 6);
  const riverPosts = posts.slice(6);

  if (!lead) {
    return null;
  }

  const leadAuthor = lead.authors?.[0];

  return (
    <div className="mx-auto max-w-site px-4 lg:px-6">
      <section className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-8">
        <article className="group min-w-0">
          <Link href={`/${lead.slug}`} prefetch={false} className="block">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl lg:aspect-[2/1]">
              <CustomImage
                image={lead.image as Parameters<typeof CustomImage>[0]["image"]}
                width={1200}
                height={600}
                className="h-full w-full object-cover object-top"
                priority
                mode="cover"
                sizes={IMAGE_SIZES.homeHero}
              />
            </div>
          </Link>
          <div className="kicker mt-4 text-primary">{postKicker(lead)}</div>
          <h1 className="mt-1 font-display text-headline font-extrabold uppercase decoration-4 underline-offset-4 group-hover:underline lg:text-headline-lg">
            <Link href={`/${lead.slug}`} prefetch={false}>
              {lead.title}
            </Link>
          </h1>
          {lead.excerpt ? (
            <p className="mt-3 max-w-2xl text-base text-muted-foreground lg:text-lg">
              {lead.excerpt}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {leadAuthor?.slug ? (
              <Link
                href={`/people/${leadAuthor.slug}`}
                className="flex items-center gap-2"
                prefetch={false}
              >
                <Avatar className="size-6">
                  <AvatarFallback className="text-[0.7em] font-semibold">
                    {authorInitials(leadAuthor.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {leadAuthor.name}
                </span>
              </Link>
            ) : null}
            {lead.publishedAt ? (
              <>
                <span aria-hidden>·</span>
                <RelativeTime dateString={lead.publishedAt} />
              </>
            ) : null}
          </div>
        </article>
        <div className="grid min-w-0 content-start gap-4 lg:border-l lg:pl-8">
          <div className="kicker text-muted-foreground">Top stories</div>
          {topStories.map((post) => (
            <article
              key={post._id}
              className="group grid grid-cols-[6.5rem_1fr] gap-3 border-b pb-4 last:border-0"
            >
              <Link
                href={`/${post.slug}`}
                prefetch={false}
                className="relative aspect-[4/3] overflow-hidden rounded-lg"
              >
                <CustomImage
                  image={
                    post.image as Parameters<typeof CustomImage>[0]["image"]
                  }
                  width={208}
                  height={156}
                  className="h-full w-full object-cover"
                  mode="cover"
                  sizes="104px"
                />
              </Link>
              <div>
                <div className="kicker text-primary">{postKicker(post)}</div>
                <h2 className="mt-1 font-display text-lg font-bold leading-tight group-hover:underline">
                  <Link href={`/${post.slug}`} prefetch={false}>
                    {post.title}
                  </Link>
                </h2>
                <div className="mt-1 text-xs text-muted-foreground">
                  {post.authors?.[0]?.name}
                  {post.publishedAt ? (
                    <>
                      {" · "}
                      <RelativeTime dateString={post.publishedAt} />
                    </>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {leaderboardAd ? (
        <AdSlot
          placement="home-leaderboard"
          creative={leaderboardAd}
          className="my-8 max-w-full"
        />
      ) : null}

      <section
        className={cn(
          "grid gap-8 pb-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
          leaderboardAd ? undefined : "mt-10",
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-display text-2xl font-extrabold uppercase">
              Latest
            </h2>
          </div>
          <div className="divide-y">
            {riverPosts.map((post) => (
              <article
                key={post._id}
                className="group grid min-w-0 grid-cols-[minmax(0,1fr)_7.5rem] gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_11rem]"
              >
                <div className="min-w-0">
                  <div className="kicker text-primary">{postKicker(post)}</div>
                  <h3 className="mt-1 font-display text-headline-sm font-bold decoration-2 underline-offset-2 group-hover:underline">
                    <Link href={`/${post.slug}`} prefetch={false}>
                      {post.title}
                    </Link>
                  </h3>
                  {post.excerpt ? (
                    <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
                      {post.excerpt}
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{post.authors?.[0]?.name}</span>
                    {post.publishedAt ? (
                      <>
                        <span aria-hidden>·</span>
                        <RelativeTime dateString={post.publishedAt} />
                      </>
                    ) : null}
                  </div>
                </div>
                <Link
                  href={`/${post.slug}`}
                  prefetch={false}
                  className="relative block aspect-[4/3] w-full overflow-hidden rounded-md"
                >
                  <CustomImage
                    image={
                      post.image as Parameters<typeof CustomImage>[0]["image"]
                    }
                    width={176}
                    height={132}
                    className="absolute inset-0 h-full w-full object-cover"
                    mode="cover"
                  />
                </Link>
              </article>
            ))}
          </div>
          <div className="pt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/college/news" prefetch={false}>
                Load more stories
              </Link>
            </Button>
          </div>
        </div>
        <aside
          className="grid min-w-0 content-start gap-6"
          aria-label="Sidebar"
        >
          <RankingsWidget polls={rankingsPolls} />
          <MostReadCard items={mostRead} />
          <AdSlot placement="home-sidebar" creative={sidebarAd} />
        </aside>
      </section>
    </div>
  );
}
