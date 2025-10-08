import {
  getSeasonWithTypesByYearAndSportId,
  getSportIdBySlug,
  SportParam,
} from '@redshirt-sports/db/queries'
import { SEASON_TYPE_CODES } from '@redshirt-sports/db/schema'
import Link from 'next/link'

const seasonTypeLabelBySeasonType = (seasonType: number) =>
  Object.entries(SEASON_TYPE_CODES).find(([_key, value]) => value === seasonType)

export default async function BallotsSportDivisionSeasonPage({
  params,
}: PageProps<'/ballots/[sport]/[division]/[season]'>) {
  const { sport: sportParam, division, season: seasonParam } = await params
  const sportId = await getSportIdBySlug(sportParam as SportParam)
  if (!sportId) {
    throw new Error('Invalid sport!')
  }

  const season = await getSeasonWithTypesByYearAndSportId({ sportId, year: Number(seasonParam) })

  return (
    <p>
      Ballots Page - {sportParam}: {division} - Season {seasonParam}
      {season?.seasonTypes.map((seasonType) => {
        const type = seasonTypeLabelBySeasonType(seasonType.type)?.[0]

        return (
          <div>
            <p>{type}</p>
            {seasonType.weeks.map((week) => (
              <p>
                <Link href={`/ballots/${sportParam}/${division}/${season.year}/${week.number}`}>
                  Week {week.number}
                </Link>
              </p>
            ))}
          </div>
        )
      })}
    </p>
  )
}
