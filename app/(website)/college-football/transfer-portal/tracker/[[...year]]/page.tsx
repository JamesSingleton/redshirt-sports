import Link from 'next/link'
import { Twitter } from '@/components/icons'
import { TransferPortal } from './_components/transer-portal'
// import { getPlayers } from '@/lib/db/utils' // Kept for future use with real data
import { getTransferPortalEntriesWithDetails } from '@/lib/data'
import { type Player } from '@/types/transfer-portal'
import { getPositions } from '@/server/queries'

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const position = searchParams.position as string
  const division = searchParams.division as string
  const year = searchParams.year as string
  const status = searchParams.status as string
  const school = searchParams.school as string
  const page = parseInt((searchParams.page as string) || '1', 10)
  const limit = parseInt((searchParams.limit as string) || '10', 10)

  const positions = await getPositions()
  const entries = await getTransferPortalEntriesWithDetails(year ? parseInt(year, 10) : undefined)

  // Apply filters
  // const filteredPlayers = entries.filter(
  //   (player: Player) =>
  //     (!position || position === 'All' || player.position === position) &&
  //     (!division || division === 'All' || player.division === division) &&
  //     (!year || year === 'All' || player.year === year) &&
  //     (!status || status === 'All' || player.status === status) &&
  //     (!school || school === 'All' || player.previousTeam.name === school),
  // )

  // Apply pagination
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  // const paginatedPlayers = filteredPlayers.slice(startIndex, endIndex)

  return (
    <div className="container mx-auto py-10">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">College Football Transfer Portal {year}</h1>
          <Link
            href="https://x.com/Redshirt_Portal"
            className="text-brand-500 hover:text-brand-600"
            target="_blank"
            rel="noreferrer noopener"
          >
            <span className="sr-only">Follow us on Twitter</span>
            <Twitter className="h-6 w-6" />
          </Link>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          The Transfer Portal lists all college athletes that enter the NCAA Transfer Portal,
          including data on the previous and new school.
        </p>
      </div>
      <TransferPortal
        entries={entries}
        // totalCount={filteredPlayers.length}
        positions={positions}
        initialPage={page}
        initialLimit={limit}
      />
    </div>
  )
}
