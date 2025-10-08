import {
  getBallotsByWeekYearDivisionAndSport,
  getSportIdBySlug,
  getVotersWithVotingStatusForWeek,
  SportParam,
} from '@redshirt-sports/db/queries'

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

  console.log(usersWithVotingStatus)
  return (
    <p>
      Ballots Page - {sportParam}: {division} - Season {seasonParam}, week {weekParam}
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
