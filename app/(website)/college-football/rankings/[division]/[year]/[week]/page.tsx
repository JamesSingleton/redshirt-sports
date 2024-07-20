import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { ImageComponent } from '@/components/common'
import {
  getFinalRankingsForWeekAndYear,
  getWeeksThatHaveVotes,
  getVotesForWeekAndYearByVoter,
} from '@/server/queries'
import { client } from '@/lib/sanity.client'
import { token } from '@/lib/sanity.fetch'
import { schoolWithVoteOrder } from '@/lib/sanity.queries'
import VoterBreakdown from './_components/voter-breakdown'

import { type Metadata } from 'next'
import type { BallotsByVoter } from '@/types'

export async function generateMetadata({
  params,
}: {
  params: { division: string }
}): Promise<Metadata> {
  return {
    title: `${params.division.toUpperCase()} College Football Rankings`,
    description: `View the latest ${params.division.toUpperCase()} College Football Rankings.`,
  }
}

async function processVoterBallots(userBallots: BallotsByVoter) {
  const voterBallot = []

  for (const userId in userBallots) {
    const { votes, userData } = userBallots[userId]
    const votesWithMoreData = await client.fetch(
      schoolWithVoteOrder,
      {
        ids: votes,
      },
      { token, perspective: 'published' },
    )

    voterBallot.push({
      name: `${userData.firstName} ${userData.lastName}`,
      organization: userData.organization,
      ballot: votesWithMoreData,
    })
  }

  return voterBallot
}

export default async function CollegeFootballRankingsPage({
  params,
}: {
  params: { division: string; year: string; week: string }
}) {
  const { division, year, week } = params
  const weeksWithVotes = await getWeeksThatHaveVotes({ year: parseInt(year, 10), division })
  const finalRankings = await getFinalRankingsForWeekAndYear({
    year: parseInt(year, 10),
    week: parseInt(week, 10),
  })
  const { rankings } = finalRankings

  const votesForWeekAndYearByVoter = await getVotesForWeekAndYearByVoter({
    year: parseInt(year, 10),
    week: parseInt(week, 10),
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

  const weeksToPickFrom = weeksWithVotes.map((week) => {
    return {
      value: week.toString(),
      label: week === 0 ? 'Preseason' : `Week ${week}`,
    }
  })

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>FCS College Football Rankings</CardTitle>
          <CardDescription className="flex items-center space-x-4 pt-4">
            <Select>
              <SelectTrigger id="year" aria-label="Year">
                <SelectValue placeholder="2024" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger id="ranking" aria-label="Ranking">
                <SelectValue placeholder="Preseason" />
              </SelectTrigger>
              <SelectContent>
                {weeksToPickFrom.map((week) => (
                  <SelectItem key={week.value} value={week.value}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                        <ImageComponent
                          image={team.image}
                          width={32}
                          height={32}
                          mode="contain"
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
          <div className="mt-4">
            <p>
              <strong>Others receiving votes:</strong>{' '}
              {outsideTop25.map((team) => `${team.shortName} ${team._points}`).join(', ')}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="mt-8 w-full">
        <CardHeader>
          <CardTitle>Voter Breakdown</CardTitle>
          <CardDescription>
            See how each voter cast their ballot for this week&apos;s rankings.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-6">
          <VoterBreakdown voterBreakdown={voterBreakdown} />
        </CardContent>
      </Card>
    </>
  )
}
