import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buttonVariants } from '@workspace/ui/components/button'
import { Card, CardHeader, CardDescription, CardContent, CardFooter } from '@workspace/ui/components/card'
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
import { constructMetadata } from '@/utils/construct-metadata'
import { Org, Web } from '@/lib/ldJson'
import { HOME_DOMAIN } from '@/lib/constants'
import { Image as SanityImage } from '@/components/image'

import type { Metadata } from 'next'
import type { Graph } from 'schema-dts'

type Props = {
  params: Promise<{ division: string; week: string; year: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { division, year, week } = await params

  let titleWeek = `Week ${week}`

  if (week === '0') {
    titleWeek = 'Preseason'
  }

  return constructMetadata({
    title: `${year} ${division.toUpperCase()} Top 25 Rankings, ${titleWeek} | ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: `Discover the ${division.toUpperCase()} Top 25 College Football Rankings for ${year}, ${titleWeek}. See how the voters ranked the top teams.`,
    canonical: `/college-football/rankings/${division}/${year}/${week}`,
  })
}

export default async function CollegeFootballRankingsPage({ params }: Props) {
  const { division, year, week } = await params
  let weekNumber = parseInt(week, 10)

  if (week === 'final-rankings') {
    weekNumber = 999
  }
  const [yearsWithVotesResult, weeksWithVotesResult] = await Promise.allSettled([
    getYearsThatHaveVotes({ division }),
    getWeeksThatHaveVotes({ year: parseInt(year, 10), division }),
  ])

  const yearsWithVotes =
    yearsWithVotesResult.status === 'fulfilled' ? yearsWithVotesResult.value : []
  const weeksWithVotes =
    weeksWithVotesResult.status === 'fulfilled' ? weeksWithVotesResult.value : []

  let titleWeek = `Week ${weekNumber}`

  if (weekNumber === 0) {
    titleWeek = 'Preseason'
  }

  if (weekNumber === 999) {
    titleWeek = 'Postseason'
  }

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
      Org,
      Web,
      {
        '@type': 'WebPage',
        '@id': `${HOME_DOMAIN}/college-football/rankings/${division}/${year}/${week}#webpage`,
        url: `${HOME_DOMAIN}/college-football/rankings/${division}/${year}/${week}`,
        name: `${year} ${division.toUpperCase()} Top 25 Rankings, ${titleWeek} | ${process.env.NEXT_PUBLIC_APP_NAME}`,
        description: `Discover the ${division.toUpperCase()} Top 25 College Football Rankings for ${year}, ${titleWeek}. See how the voters ranked the top teams.`,
        isPartOf: {
          '@id': `${HOME_DOMAIN}#website`,
        },
        inLanguage: 'en-US',
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold leading-none tracking-tight">{`${titleWeek} ${division.toUpperCase()} Top 25 College Football Rankings`}</h1>
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
                          <SanityImage
                            asset={team.image}
                            width={32}
                            height={32}
                            className="mr-2 h-8 w-8"
                          />
                          {team.shortName ?? team.abbreviation ?? team.name}
                          {team.firstPlaceVotes ? (
                            <span className="ml-2 tracking-wider text-muted-foreground">
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
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Top 25 Poll Not Found
              </h2>
              <p className="mt-4 text-muted-foreground">
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
      {top25.length > 0 && voterBreakdown.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <h2 className="text-2xl font-semibold leading-none tracking-tight">Voter Breakdown</h2>
            <CardDescription>
              See how each voter cast their ballot for this week&apos;s rankings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="sticky left-0 z-20 bg-background">Voter</TableHead>
                    {[...Array(25)].map((_, i) => (
                      <TableHead key={i} className="text-center">
                        {i + 1}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voterBreakdown.map((voter, index) => {
                    return (
                      <TableRow key={index}>
                        <TableCell className="sticky left-0 z-10 min-w-32 bg-background font-medium">
                          <div>{voter.name}</div>
                          <div className="text-sm italic text-muted-foreground">
                            {`${voter.organization} (${voter.organizationRole})`}
                          </div>
                        </TableCell>
                        {voter.ballot.map((vote: any) => {
                          return (
                            <TableCell key={vote._id}>
                              <div className="h-auto w-10">
                                <SanityImage asset={vote.image} width={40} height={40} />
                              </div>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
