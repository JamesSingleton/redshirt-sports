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
  getVotesForWeekAndYear,
  getVoterInfo,
} from '@/server/queries'
import { client } from '@/lib/sanity.client'
import { token } from '@/lib/sanity.fetch'
import { test } from '@/lib/sanity.queries'
import VoterBreakdown from './_components/voter-breakdown'

interface Vote {
  _id: string
  image: any
  shortName?: string
  abbreviation?: string
  name: string
  userId: string
}

interface Testing {
  [userId: string]: Vote[]
}

interface VoteLite {
  id: number
  userId: string
  division: string
  week: number
  year: number
  createdAt: Date
  teamId: string
  rank: number
  points: number
}

interface TestingLite {
  [userId: string]: VoteLite[]
}

interface VoterBallot {
  name: string
  organization?: string
  votes: any[] // Replace `any` with the actual type returned by `client.fetch`
}

async function processBallotsByUser(ballots: TestingLite) {
  const userBallots: Testing = {}
  for (const [userId, votes] of Object.entries(ballots)) {
    const userData = await client.fetch(
      test,
      {
        ids: votes,
      },
      { token, perspective: 'published' },
    )
    userBallots[userId] = userData
  }
  return userBallots
}

async function processBallotsByVoter(ballots: TestingLite) {
  const voterBallots: VoterBallot[] = []

  for (const [userId, votes] of Object.entries(ballots)) {
    const userData = await client.fetch(
      test,
      {
        ids: votes,
      },
      { token, perspective: 'published' },
    )
    const voterInfo = await getVoterInfo(userId)
    voterBallots.push({
      name: `${voterInfo?.firstName} ${voterInfo?.lastName}`,
      organization: voterInfo?.organization as string,
      votes: userData,
    })
  }
  return voterBallots
}

export default async function CollegeFootballRankingsPage({
  params,
}: {
  params: { division: string; year: string; week: string }
}) {
  const { division, year, week } = params
  const finalRankings = await getFinalRankingsForWeekAndYear({
    year: parseInt(year, 10),
    week: parseInt(week, 10),
  })
  const { rankings } = finalRankings

  const allVotes: VoteLite[] = await getVotesForWeekAndYear({
    year: parseInt(year, 10),
    week: parseInt(week, 10),
    division,
  })

  const ballotsByUser: { [key: string]: VoteLite[] } = allVotes.reduce((acc: TestingLite, vote) => {
    if (!acc[vote.userId]) {
      acc[vote.userId] = []
    }
    acc[vote.userId].push(vote)
    return acc
  }, {})

  const ballotsByUserWithExtraData: Testing = await processBallotsByUser(ballotsByUser)
  const test = await processBallotsByVoter(ballotsByUser)
  console.log(test)

  const top25 = []
  const outsideTop25 = []
  for (const team of rankings) {
    if (team.rank && team.rank <= 25) {
      top25.push(team)
    } else {
      outsideTop25.push(team)
    }
  }

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
                <SelectItem value="final">Preseason</SelectItem>
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
          <VoterBreakdown ballots={ballotsByUserWithExtraData} />
        </CardContent>
      </Card>
    </>
  )
}
