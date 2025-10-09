import { processBallotsForm } from '@/actions/process-ballots'
import {
  getBallotsByWeekYearDivisionAndSport,
  getSportIdBySlug,
  getVotersWithVotingStatusForWeek,
  SportParam,
} from '@redshirt-sports/db/queries'
import { Button } from '@redshirt-sports/ui/components/button'

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
    <p>
      Ballots Page - {sportParam}: {division} - Season {seasonParam}, week {weekParam}
      <form action={processBallotsForm}>
        <input type="text" value={sportId} name="sportId" hidden />
        <input type="text" value={division} name="division" hidden />
        <input type="number" value={weekParam} name="week" hidden />
        <input type="number" value={seasonParam} name="season" hidden />
        <Button>Process Ballots</Button>
      </form>
      {usersWithVotingStatus.map((user) => (
        <div>
          <p>
            {user.firstName} {user.lastName} | {user.hasVoted ? 'Submitted' : 'Not Yet Submitted'}
          </p>
        </div>
      ))}
    </p>
  )
}
