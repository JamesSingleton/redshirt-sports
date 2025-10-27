import Link from 'next/link'
import {
  getSeasonWithTypesByYearAndSportId,
  getSportIdBySlug,
  SportParam,
} from '@redshirt-sports/db/queries'
import { SEASON_TYPE_CODES } from '@redshirt-sports/db/schema'

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@redshirt-sports/ui/components/table'

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
    <div>
      <p>
        Ballots Page - {sportParam}: {division} - Season {seasonParam}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Season Type</TableHead>
            <TableHead>Week</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {season?.seasonTypes.flatMap((seasonType) => {
            const type = seasonTypeLabelBySeasonType(seasonType.type)?.[0]
            return seasonType.weeks.map((week) => (
              <TableRow key={type + '-' + week.number}>
                <TableCell>{type}</TableCell>
                <TableCell>
                  <Link href={`/ballots/${sportParam}/${division}/${season.year}/${week.number}`}>
                    Week {week.number}
                  </Link>
                </TableCell>
              </TableRow>
            ))
          })}
        </TableBody>
      </Table>
    </div>
  )
}
