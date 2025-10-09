import { getSeasonsForSport, getSportIdBySlug, SportParam } from '@redshirt-sports/db/queries'
import Link from 'next/link'

export default async function BallotsSportDivisionPage({
  params,
}: PageProps<'/ballots/[sport]/[division]'>) {
  const { sport: sportParam, division } = await params

  const sportId = await getSportIdBySlug(sportParam as SportParam)
  if (!sportId) {
    throw new Error('Invalid sport!')
  }

  const seasons = await getSeasonsForSport(sportId)

  return (
    <p>
      Ballots Page - {sportParam}: {division}
      {seasons.map((season) => (
        <div>
          <Link href={`/ballots/${sportParam}/${division}/${season.year}`}>
            {season.displayName}
          </Link>
        </div>
      ))}
    </p>
  )
}
