import {
  getFinalRankingsForWeekAndYear,
  getSportIdBySlug,
  getVotesForWeekAndYearByVoter,
  getWeeksThatHaveVotes,
  getYearsThatHaveVotes,
} from "@redshirt-sports/db/queries";
import { buttonVariants } from "@redshirt-sports/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";
import { cn } from "@redshirt-sports/ui/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Graph } from "schema-dts";

import { DivisionBadge } from "@/components/division-badge";
import { JsonLdScript, websiteId } from "@/components/json-ld";
import { RankingsFilters } from "@/components/rankings/filters";
import VoterBallotBreakdown from "@/components/rankings/voter-ballot-breakdown";
import CustomImage from "@/components/sanity-image";
import { FINAL_RANKINGS_WEEK, PRESEASON_WEEK, TOP_25 } from "@/lib/constants";
import { getBaseUrl } from "@/lib/get-base-url";
import { getSEOMetadata } from "@/lib/seo";
import type { SportParam } from "@/utils/espn";
import { processVoterBallots } from "@/utils/process-ballots";

const baseUrl = getBaseUrl();

function getWeekTitle(weekNumber: number): string {
  if (weekNumber === PRESEASON_WEEK) return "Preseason";
  if (weekNumber === FINAL_RANKINGS_WEEK) return "Postseason";
  return `Week ${weekNumber}`;
}

function parseWeekNumber(week: string): number {
  if (week === "final-rankings") return FINAL_RANKINGS_WEEK;
  return parseInt(week, 10);
}

export async function generateMetadata({
  params,
}: PageProps<"/college/[sport]/rankings/[division]/[year]/[week]">): Promise<Metadata> {
  const { division, year, week, sport } = await params;
  const weekNumber = parseWeekNumber(week);
  const titleWeek = getWeekTitle(weekNumber);

  return getSEOMetadata({
    title: `${year} ${titleWeek} ${division.toUpperCase()} Top 25 Rankings`,
    description: `Discover the ${year} ${titleWeek} ${division.toUpperCase()} Top 25 College Football Rankings presented by Redshirt Sports. See how the voters ranked the top teams.`,
    slug: `/college/${sport}/rankings/${division}/${year}/${week}`,
  });
}

export default async function CollegeFootballRankingsPage({
  params,
}: PageProps<"/college/[sport]/rankings/[division]/[year]/[week]">) {
  const { division, year, week, sport } = await params;

  const weekNumber = parseWeekNumber(week);
  const titleWeek = getWeekTitle(weekNumber);

  const [
    yearsWithVotesResult,
    weeksWithVotesResult,
    finalRankingsResult,
    sportIdResult,
  ] = await Promise.allSettled([
    getYearsThatHaveVotes({ division }),
    getWeeksThatHaveVotes({ year: parseInt(year, 10), division }),
    getFinalRankingsForWeekAndYear({
      year: parseInt(year, 10),
      week: weekNumber,
      division,
    }),
    getSportIdBySlug(sport as SportParam),
  ]);

  const yearsWithVotes =
    yearsWithVotesResult.status === "fulfilled"
      ? yearsWithVotesResult.value
      : [];
  const weeksWithVotes =
    weeksWithVotesResult.status === "fulfilled"
      ? weeksWithVotesResult.value
      : [];
  const sportId =
    sportIdResult.status === "fulfilled" ? sportIdResult.value : null;

  if (
    !yearsWithVotes.length ||
    !weeksWithVotes.length ||
    finalRankingsResult.status === "rejected" ||
    !sportId
  ) {
    notFound();
  }

  const finalRankings = finalRankingsResult.value;
  const { rankings } = finalRankings;

  const votesForWeekAndYearByVoter = await getVotesForWeekAndYearByVoter({
    year: parseInt(year, 10),
    week: weekNumber,
    division,
    sportId,
  });

  const voterBreakdown = await processVoterBallots(votesForWeekAndYearByVoter);

  const top25 = rankings.filter((team) => team.rank && team.rank <= TOP_25);
  const outsideTop25 = rankings.filter(
    (team) => !team.rank || team.rank > TOP_25,
  );

  const jsonLd: Graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${baseUrl}/college/${sport}/rankings/${division}/${year}/${week}#webpage`,
        url: `${baseUrl}/college/${sport}/rankings/${division}/${year}/${week}`,
        name: `${year} ${titleWeek} ${division.toUpperCase()} Top 25 Rankings | ${process.env.NEXT_PUBLIC_APP_NAME}`,
        description: `Discover the ${year} ${titleWeek} ${division.toUpperCase()} Top 25 College Football Rankings presented by Redshirt Sports. See how the voters ranked the top teams.`,
        isPartOf: {
          "@type": "WebSite",
          "@id": websiteId,
        },
        inLanguage: "en-US",
        mainEntity: {
          "@id": `${baseUrl}/college/${sport}/rankings/${division}/${year}/${week}#rankings`,
        },
      },
      {
        "@type": "ItemList",
        "@id": `${baseUrl}/college/${sport}/rankings/${division}/${year}/${week}#rankings`,
        url: `${baseUrl}/college/${sport}/rankings/${division}/${year}/${week}`,
        numberOfItems: top25.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: top25.map((team) => ({
          "@type": "ListItem",
          position: team.rank,
          item: {
            "@type": "SportsTeam",
            name: team.shortName,
            sport: sport,
          },
        })),
      },
    ],
  };

  return (
    <>
      <JsonLdScript
        data={jsonLd}
        id={`json-ld-${sport}-${division}-${year}-${week}`}
      />
      
      {/* Dark Masthead */}
      <section className="bg-black border-b-2 border-primary py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <DivisionBadge division={division} size="md" />
              <div>
                <h1 className="text-2xl font-extrabold text-white md:text-3xl lg:text-4xl">
                  TOP 25
                </h1>
                <p className="text-white/70 text-sm md:text-base">
                  {titleWeek} {year} College Football Rankings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <RankingsFilters years={yearsWithVotes} weeks={weeksWithVotes} />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {top25.length > 0 ? (
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border">
              <p className="text-muted-foreground text-sm">
                Our {division.toUpperCase()} Top 25 uses a point system: 25 points
                for a first-place vote down to 1 point for a 25th-place vote.
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-16 font-bold">Rank</TableHead>
                  <TableHead className="font-bold">School (1st Place Votes)</TableHead>
                  <TableHead className="w-24 text-right font-bold">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top25.map((team, index) => {
                  const isTop3 = team.rank && team.rank <= 3;
                  return (
                    <TableRow 
                      key={team._id}
                      className={cn(
                        isTop3 && "bg-primary/5"
                      )}
                    >
                      <TableCell className="font-bold">
                        <span className={cn(
                          "text-lg",
                          isTop3 && "text-primary"
                        )}>
                          {team.isTie ? `T-${team.rank}` : team.rank}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <CustomImage
                            image={team.image}
                            width={40}
                            height={40}
                            className="size-10 shrink-0 object-contain"
                            mode="contain"
                          />
                          <span className="font-semibold">
                            {team.shortName ?? team.abbreviation ?? team.name}
                          </span>
                          {team.firstPlaceVotes ? (
                            <span className="text-muted-foreground text-sm">
                              ({team.firstPlaceVotes})
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {team._points}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {outsideTop25.length > 0 && (
              <div className="p-4 border-t border-border bg-muted/30">
                <p className="text-sm">
                  <strong>Others receiving votes:</strong>{" "}
                  <span className="text-muted-foreground">
                    {outsideTop25
                      .map((team) => `${team.shortName} ${team._points}`)
                      .join(", ")}
                  </span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-md text-center py-16">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              Top 25 Poll Not Found
            </h2>
            <p className="text-muted-foreground mt-4">
              We&apos;re sorry, but the selected Top 25 poll could not be
              found. Please try again or check back later.
            </p>
            <div className="mt-6">
              <Link href="/" className={buttonVariants()} prefetch={false}>
                Go back Home
              </Link>
            </div>
          </div>
        )}
        
        {top25.length > 0 && voterBreakdown.length > 0 && (
          <div className="mt-8">
            <VoterBallotBreakdown voterBreakdown={voterBreakdown} />
          </div>
        )}
      </div>
    </>
  );
}
