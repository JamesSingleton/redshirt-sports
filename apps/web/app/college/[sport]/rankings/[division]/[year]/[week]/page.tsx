import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buttonVariants } from '@workspace/ui/components/button'
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
  CardFooter,
} from '@workspace/ui/components/card'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@workspace/ui/components/table'
import {
  getFinalRankingsForWeekAndYear,
  getWeeksThatHaveVotes,
  getVotesForWeekAndYearByVoter,
  getYearsThatHaveVotes,
} from '@/server/queries'
import { processVoterBallots } from '@/utils/process-ballots'
import { RankingsFilters } from '@/components/rankings/filters'
import CustomImage from '@/components/sanity-image'
import { getSEOMetadata } from '@/lib/seo'
import { JsonLdScript, websiteId } from '@/components/json-ld'
import { getBaseUrl } from '@/lib/get-base-url'
import VoterBreakdown from '@/components/rankings/voter-breakdown'
import VoterBreakdown2 from '@/components/rankings/voter-ballot-breakdown'

import type { Metadata } from 'next'
import type { Graph } from 'schema-dts'

type Props = {
  params: Promise<{ division: string; week: string; year: string; sport: string }>
}

const FINAL_RANKINGS_WEEK = 999
const PRESEASON_WEEK = 0
const baseUrl = getBaseUrl()

function getWeekTitle(weekNumber: number): string {
  if (weekNumber === PRESEASON_WEEK) return 'Preseason'
  if (weekNumber === FINAL_RANKINGS_WEEK) return 'Postseason'
  return `Week ${weekNumber}`
}

function parseWeekNumber(week: string): number {
  if (week === 'final-rankings') return FINAL_RANKINGS_WEEK
  return parseInt(week, 10)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { division, year, week, sport } = await params
  const weekNumber = parseWeekNumber(week)
  const titleWeek = getWeekTitle(weekNumber)

  return getSEOMetadata({
    title: `${year} ${division.toUpperCase()} Top 25 Rankings, ${titleWeek}`,
    description: `Discover the ${division.toUpperCase()} Top 25 College Football Rankings for ${year}, ${titleWeek}. See how the voters ranked the top teams.`,
    slug: `/college/${sport}/rankings/${division}/${year}/${week}`,
  })
}

export default async function CollegeFootballRankingsPage({ params }: Props) {
  const { division, year, week, sport } = await params

  const weekNumber = parseWeekNumber(week)
  const titleWeek = getWeekTitle(weekNumber)

  const [yearsWithVotesResult, weeksWithVotesResult] = await Promise.allSettled([
    getYearsThatHaveVotes({ division }),
    getWeeksThatHaveVotes({ year: parseInt(year, 10), division }),
  ])

  const yearsWithVotes =
    yearsWithVotesResult.status === 'fulfilled' ? yearsWithVotesResult.value : []
  const weeksWithVotes =
    weeksWithVotesResult.status === 'fulfilled' ? weeksWithVotesResult.value : []

  if (!yearsWithVotes.length || !weeksWithVotes.length) {
    notFound()
  }

  const finalRankings = await getFinalRankingsForWeekAndYear({
    year: parseInt(year, 10),
    week: weekNumber,
  })

  const { rankings } = finalRankings

  const votesForWeekAndYearByVoter = await getVotesForWeekAndYearByVoter({
    year: parseInt(year, 10),
    week: weekNumber,
    division,
  })

  const voterBreakdown = await processVoterBallots(votesForWeekAndYearByVoter)

  const top25 = []
  const outsideTop25 = []
  for (const team of rankings) {
    if (team.rank && team.rank <= 25) {
      top25.push(team)
    } else {
      outsideTop25.push(team)
    }
  }

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/college/${sport}/rankings/${division}/${year}/${week}#webpage`,
        url: `${baseUrl}/college/${sport}/rankings/${division}/${year}/${week}`,
        name: `${year} ${division.toUpperCase()} ${sport} Top 25 Rankings, ${titleWeek} | ${process.env.NEXT_PUBLIC_APP_NAME}`,
        description: `Discover the ${division.toUpperCase()} Top 25 College Football Rankings for ${year}, ${titleWeek}. See how the voters ranked the top teams.`,
        isPartOf: {
          '@type': 'WebSite',
          '@id': websiteId,
        },
        inLanguage: 'en-US',
        mainEntity: {
          '@id': `${baseUrl}/college/${sport}/rankings/${division}/${year}/${week}#rankings`,
        },
      },
      {
        '@type': 'ItemList',
        '@id': `${baseUrl}/college/${sport}/rankings/${division}/${year}/${week}#rankings`,
        url: `${baseUrl}/college/${sport}/rankings/${division}/${year}/${week}`,
        numberOfItems: top25.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: top25.map((team) => ({
          '@type': 'ListItem',
          position: team.rank,
          item: {
            '@type': 'SportsTeam',
            name: team.shortName,
            sport: sport,
          },
        })),
      },
    ],
  }

  return (
    <>
      <JsonLdScript data={jsonLd} id={`json-ld-${sport}-${division}-${year}-${week}`} />
      <Card>
        <CardHeader>
          <h1 className="text-2xl leading-none font-semibold tracking-tight">{`${titleWeek} ${division.toUpperCase()} Top 25 College Football Rankings`}</h1>
          <CardDescription>
            Our {division.toUpperCase()} Top 25 uses a point system: 25 points for a first-place
            vote down to 1 point for a 25th-place vote. Total points determine the final rankings.
          </CardDescription>
          <CardDescription className="flex items-center space-x-4 pt-4">
            <RankingsFilters years={yearsWithVotes} weeks={weeksWithVotes} />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {top25.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>School (1st Place Votes)</TableHead>
                  <TableHead>Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top25.map((team, index) => {
                  return (
                    <TableRow key={index}>
                      <TableCell>{team.isTie ? `T-${team.rank}` : team.rank}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CustomImage
                            image={team.image}
                            width={32}
                            height={32}
                            className="mr-2 h-8 w-8"
                          />
                          {team.shortName ?? team.abbreviation ?? team.name}
                          {team.firstPlaceVotes ? (
                            <span className="text-muted-foreground ml-2 tracking-wider">
                              ({team.firstPlaceVotes})
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{team._points}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          {top25.length === 0 && (
            <div className="mx-auto max-w-md text-center">
              <h2 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Top 25 Poll Not Found
              </h2>
              <p className="text-muted-foreground mt-4">
                We&apos;re sorry, but the selected Top 25 poll could not be found. Please try again
                or check back later.
              </p>
              <div className="mt-6">
                <Link href="/" className={buttonVariants()} prefetch={false}>
                  Go back Home
                </Link>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {outsideTop25.length > 0 && (
            <div className="mt-4">
              <p>
                <strong>Others receiving votes:</strong>{' '}
                {outsideTop25.map((team) => `${team.shortName} ${team._points}`).join(', ')}
              </p>
            </div>
          )}
        </CardFooter>
      </Card>
      {/*{voterBreakdown.length > 0 && (
        <div className="mt-8">
          <VoterBreakdown voterBreakdown={voterBreakdown} />
        </div>
      )}*/}
      {voterBreakdown.length > 0 && (
        <div className="mt-8">
          <VoterBreakdown2 voterBreakdown={voterBreakdown} />
        </div>
      )}
    </>
  )
}
