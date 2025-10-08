import { getDivisionsBySportId, getSportIdBySlug, SportParam } from '@redshirt-sports/db/queries'
import Link from 'next/link'

export default async function BallotsSportPage({ params }: PageProps<'/ballots/[sport]'>) {
  const { sport: sportParam } = await params
  const sportId = await getSportIdBySlug(sportParam as SportParam)
  if (!sportId) {
    throw new Error('Invalid sport!')
  }

  const divisions = await getDivisionsBySportId(sportId)

  return (
    <div>
      {divisions.map(({ division }) => (
        <div>
          <Link href={`/ballots/${sportParam}/${division.slug}`}>{division.name}</Link>
        </div>
      ))}
    </div>
  )
}
