import { processBallotsForm } from '@/actions/process-ballots'
import {
  getBallotsByWeekYearDivisionAndSport,
  getSportIdBySlug,
  getVotersWithVotingStatusForWeek,
  SportParam,
} from '@redshirt-sports/db/queries'
import { Button } from '@redshirt-sports/ui/components/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@redshirt-sports/ui/components/table'

export default async function BallotsSportDivisionSeasonWeekPage({
  params,
}: PageProps<'/ballots/[sport]/[division]/[season]/[week]'>) {
  const { sport: sportParam, division, season: seasonParam, week: weekParam } = await params
  const sportId = await getSportIdBySlug(sportParam as SportParam)
  if (!sportId) {
    throw new Error('Invalid sport!')
  }
  const usersWithVotingStatus = await getVotersWithVotingStatusForWeek({
    sportId,
    division,
    week: Number(weekParam),
    year: Number(seasonParam),
  })

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usersWithVotingStatus.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                {user.firstName} {user.lastName}
              </TableCell>
              <TableCell>{user.hasVoted ? 'Submitted' : 'Not Yet Submitted'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <form action={processBallotsForm}>
        <input type="text" value={sportId} name="sportId" hidden />
        <input type="text" value={division} name="division" hidden />
        <input type="number" value={weekParam} name="week" hidden />
        <input type="number" value={seasonParam} name="season" hidden />
        <Button>Process Ballots</Button>
      </form>
    </div>
  )
}
