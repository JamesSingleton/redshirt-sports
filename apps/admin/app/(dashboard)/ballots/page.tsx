import { getSports } from '@redshirt-sports/db/queries'
import { loadBallots } from './loadBallots'
import Link from 'next/link'

export default async function BallotsPage() {
  const sports = await getSports()
  return (
    <>
      <p>Ballots Page</p>
      {sports.map((sport) => (
        <div key={sport.id}>
          <Link href={`/ballots/${sport.slug}`}>{sport.displayName}</Link>
        </div>
      ))}
    </>
  )
}
