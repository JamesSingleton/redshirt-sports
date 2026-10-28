import type { SchoolRankingHistory } from "@redshirt-sports/db/utils/school-ranking-history";
import type { SchoolBySlugQueryResult } from "@redshirt-sports/sanity/types";
import { Badge } from "@redshirt-sports/ui/components/badge";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { AdSlot } from "@/components/ad-slot";
import { MostReadCard } from "@/components/most-read-card";
import CustomImage from "@/components/sanity-image";
import { TeamInfoLinks } from "@/components/teams/team-info-links";
import { TeamPollRankInline } from "@/components/teams/team-poll-rank-inline";
import {
  TeamFeaturedArticle,
  TeamNewsItem,
  type TeamPost,
} from "@/components/teams/team-post-card";
import { TeamHubLogoTransition } from "@/components/view-transitions/team-hub-logo-transition";
import type { AdvertisementCreative } from "@/lib/advertisement";
import type { MostReadItem } from "@/lib/most-read-data";
import {
  footballAffiliationDivisionSlug,
  groupTeamPostsBySport,
  pickFootballRankingPoll,
  TEAM_HUB_SPORT_SECTIONS,
} from "@/lib/team-hub";
import {
  buildTeamHubKicker,
  type TeamConferenceAffiliationInput,
} from "@/lib/team-school-affiliations";

export function TeamPageContent({
  school,
  posts,
  rankingHistory,
  mostRead,
  advertisement,
}: {
  school: NonNullable<SchoolBySlugQueryResult>;
  posts: TeamPost[];
  rankingHistory: SchoolRankingHistory;
  mostRead: MostReadItem[];
  advertisement: AdvertisementCreative | null;
}) {
  const teamShortName = school.shortName ?? school.name ?? "Team";
  const displayName = [
    school.shortName ?? school.name ?? "Team",
    school.nickname,
  ]
    .filter(Boolean)
    .join(" ");

  const affiliations = (school.conferenceAffiliations ?? null) as
    | TeamConferenceAffiliationInput[]
    | null;
  const hubKicker = buildTeamHubKicker(affiliations);
  const postsBySport = groupTeamPostsBySport(posts);
  const latestLead = posts[0] ?? null;
  const latestRest = posts.slice(1, 5);
  const latestPostIds = new Set(
    [latestLead, ...latestRest]
      .filter((post): post is TeamPost => post != null)
      .map((post) => post._id),
  );

  const footballDivisionSlug = footballAffiliationDivisionSlug(affiliations);
  const footballPoll = pickFootballRankingPoll(
    rankingHistory.polls,
    footballDivisionSlug,
  );

  const jumpLinks = [
    { id: "latest", label: "Latest" },
    ...TEAM_HUB_SPORT_SECTIONS.filter((section) => {
      const sectionPosts = (postsBySport.get(section.sportSlug) ?? []).filter(
        (post) => !latestPostIds.has(post._id),
      );
      if (section.sportSlug === "football") {
        return sectionPosts.length > 0 || footballPoll != null;
      }
      return sectionPosts.length > 0;
    }).map((section) => ({
      id: section.id,
      label: section.title,
    })),
    { id: "info", label: "Info & links" },
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
            school.slug ? (
              <TeamHubLogoTransition slug={school.slug}>
                <CustomImage
                  image={school.image}
                  width={80}
                  height={80}
                  className="size-20 shrink-0 object-contain"
                  mode="contain"
                />
              </TeamHubLogoTransition>
            ) : (
              <CustomImage
                image={school.image}
                width={80}
                height={80}
                className="size-20 shrink-0 object-contain"
                mode="contain"
              />
            )
          ) : (
            <div
              className="size-20 shrink-0 rounded-full bg-muted"
              aria-hidden
            />
          )}
          <div className="min-w-0 flex-1">
            {hubKicker ? (
              <div className="kicker text-primary">{hubKicker}</div>
            ) : (
              <div className="kicker text-primary">Team hub</div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-[2.2rem] font-extrabold uppercase leading-none lg:text-headline-lg">
                {displayName}
              </h1>
              {footballPoll ? (
                <Badge variant="secondary" className="text-sm">
                  {footballPoll.pollName} rankings
                </Badge>
              ) : null}
            </div>
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
            {latestLead ? (
              <div className="mt-4 space-y-5">
                <TeamFeaturedArticle post={latestLead} />
                {latestRest.length > 0 ? (
                  <ul className="flex flex-col gap-5">
                    {latestRest.map((post) => (
                      <li key={post._id}>
                        <TeamNewsItem post={post} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No recent stories yet.
              </p>
            )}
          </section>

          {TEAM_HUB_SPORT_SECTIONS.map((section) => {
            const sectionPosts = (
              postsBySport.get(section.sportSlug) ?? []
            ).filter((post) => !latestPostIds.has(post._id));
            if (sectionPosts.length === 0 && section.sportSlug !== "football") {
              return null;
            }
            if (
              section.sportSlug === "football" &&
              sectionPosts.length === 0 &&
              !footballPoll
            ) {
              return null;
            }

            return (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 border-t pt-6"
              >
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 className="font-display text-2xl font-extrabold uppercase">
                    {section.title}
                  </h2>
                  <Link
                    href={section.newsHref}
                    prefetch={false}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    All {section.title.toLowerCase()} news
                  </Link>
                </div>
                {section.sportSlug === "football" && footballPoll ? (
                  <div className="mt-4">
                    <TeamPollRankInline
                      poll={footballPoll}
                      teamName={teamShortName}
                    />
                  </div>
                ) : null}
                {sectionPosts.length > 0 ? (
                  <ul className="mt-5 flex flex-col gap-5">
                    {sectionPosts.slice(0, 6).map((post) => (
                      <li key={post._id}>
                        <TeamNewsItem post={post} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No {section.title.toLowerCase()} stories yet.
                  </p>
                )}
              </section>
            );
          })}

          <section id="info" className="scroll-mt-24 border-t pt-6">
            <h2 className="font-display text-2xl font-extrabold uppercase">
              Info &amp; links
            </h2>
            <TeamInfoLinks school={school} />
          </section>
        </div>

        <aside className="grid content-start gap-6 lg:sticky lg:top-20 lg:self-start">
          <MostReadCard items={mostRead} />
          <AdSlot
            placement="team-sidebar"
            creative={advertisement}
            className="w-full max-w-[300px]"
          />
        </aside>
      </div>
    </main>
  );
}
