import type { SchoolRankingHistory } from "@redshirt-sports/db/utils/school-ranking-history";
import type { SchoolBySlugQueryResult } from "@redshirt-sports/sanity/types";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { AdSlot } from "@/components/ad-slot";
import { MostReadCard } from "@/components/most-read-card";
import CustomImage from "@/components/sanity-image";
import { TeamConnectWidget } from "@/components/teams/team-connect-widget";
import { TeamFeedList } from "@/components/teams/team-feed-list";
import {
  TeamFeaturedArticle,
  TeamNewsItem,
  type TeamPost,
} from "@/components/teams/team-post-card";
import { TeamRankingHistory } from "@/components/teams/team-ranking-history";
import type { fetchGlobalSeoSettings } from "@/lib/global-seo-settings";
import type { MostReadItem } from "@/lib/most-read-data";

export function TeamPageContent({
  school,
  featuredPosts,
  sportsPosts,
  recruitingPosts,
  rankingHistory,
  mostRead,
  globalSettings,
}: {
  school: NonNullable<SchoolBySlugQueryResult>;
  featuredPosts: TeamPost[];
  sportsPosts: TeamPost[];
  recruitingPosts: TeamPost[];
  rankingHistory: SchoolRankingHistory;
  mostRead: MostReadItem[];
  globalSettings: Awaited<ReturnType<typeof fetchGlobalSeoSettings>> | null;
}) {
  const teamShortName = school.shortName ?? school.name ?? "Team";
  const displayName = [
    school.shortName ?? school.name ?? "Team",
    school.nickname,
  ]
    .filter(Boolean)
    .join(" ");

  const jumpLinks = [
    { id: "latest", label: "Latest" },
    { id: "sports", label: `${teamShortName} Sports` },
    ...(rankingHistory.polls.length > 0
      ? [{ id: "rankings", label: "Rankings" }]
      : []),
    ...(recruitingPosts.length > 0
      ? [{ id: "recruiting", label: "Recruiting" }]
      : []),
    { id: "info", label: "Info & links" },
  ];

  const sportsFooterLinks = [
    { label: "View All Football", href: "/college/football/news" },
    { label: "View All Basketball", href: "/college/mens-basketball/news" },
  ];

  return (
    <main className="mx-auto max-w-site px-4 pb-12 lg:px-6">
      <nav
        className="flex flex-wrap items-center gap-1 pt-5 text-xs text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-foreground" prefetch={false}>
          Home
        </Link>
        <ChevronRight className="size-3 shrink-0" aria-hidden />
        <Link
          href="/college/teams"
          className="hover:text-foreground"
          prefetch={false}
        >
          Teams
        </Link>
        <ChevronRight className="size-3 shrink-0" aria-hidden />
        <span className="text-foreground">{teamShortName}</span>
      </nav>

      <header className="mt-4 border-b pb-6">
        <div className="flex flex-wrap items-start gap-5">
          {school.image ? (
            <CustomImage
              image={school.image}
              width={80}
              height={80}
              className="size-20 shrink-0 object-contain"
              mode="contain"
            />
          ) : (
            <div
              className="size-20 shrink-0 rounded-full bg-muted"
              aria-hidden
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="kicker text-primary">Team hub</div>
            <h1 className="font-display text-[2.2rem] font-extrabold uppercase leading-none lg:text-headline-lg">
              {displayName}
            </h1>
            {school.overview ? (
              <p className="mt-2 max-w-2xl text-muted-foreground">
                {school.overview}
              </p>
            ) : null}
          </div>
        </div>
        <nav className="mt-5 flex flex-wrap gap-2" aria-label="Jump to section">
          {jumpLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="inline-flex h-8 items-center rounded-full border px-3 text-sm font-medium hover:bg-accent"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      <div className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-10">
          <section id="latest" className="scroll-mt-24 border-t pt-6">
            <h2 className="font-display text-2xl font-extrabold uppercase">
              Latest
            </h2>
            {featuredPosts.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                {featuredPosts.map((post) => (
                  <TeamFeaturedArticle key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No recent stories yet.
              </p>
            )}
          </section>

          <section id="sports" className="scroll-mt-24 border-t pt-6">
            <TeamFeedList
              title={`${teamShortName} Sports`}
              posts={sportsPosts}
              footerLinks={sportsFooterLinks}
            />
          </section>

          {rankingHistory.polls.length > 0 ? (
            <section id="rankings" className="scroll-mt-24 border-t pt-6">
              <TeamRankingHistory
                history={rankingHistory}
                teamName={teamShortName}
              />
            </section>
          ) : null}

          {recruitingPosts.length > 0 ? (
            <section id="recruiting" className="scroll-mt-24 border-t pt-6">
              <h2 className="mb-5 font-display text-2xl font-extrabold uppercase">
                {teamShortName} Recruiting
              </h2>
              <ul className="flex flex-col gap-5">
                {recruitingPosts.map((post) => (
                  <li key={post._id}>
                    <TeamNewsItem post={post} />
                  </li>
                ))}
              </ul>
              <footer className="mt-5 flex flex-wrap gap-6 text-sm font-semibold">
                <Link
                  href="/recruiting"
                  className="text-primary hover:underline"
                >
                  View All Recruiting
                </Link>
                <Link
                  href="/transfer-portal"
                  className="text-primary hover:underline"
                >
                  View All Transfers
                </Link>
              </footer>
            </section>
          ) : null}

          <section id="info" className="scroll-mt-24 border-t pt-6">
            <h2 className="font-display text-2xl font-extrabold uppercase">
              Info &amp; links
            </h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="font-semibold">School</dt>
                <dd className="text-muted-foreground">{school.name}</dd>
              </div>
              {school.websiteUrl ? (
                <div>
                  <dt className="font-semibold">Website</dt>
                  <dd>
                    <a
                      href={school.websiteUrl}
                      className="text-primary hover:underline"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {school.websiteUrl.replace(/^https?:\/\//, "")}
                      <span className="sr-only"> (opens school site)</span>
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>

        <aside className="grid content-start gap-6 lg:sticky lg:top-20 lg:self-start">
          <MostReadCard items={mostRead} />
          <TeamConnectWidget
            schoolName={teamShortName}
            schoolSocialLinks={school.socialLinks}
            globalSocialLinks={globalSettings?.socialLinks}
          />
          <AdSlot
            width={300}
            height={250}
            className="mx-auto w-full max-w-[300px]"
          />
        </aside>
      </div>
    </main>
  );
}
