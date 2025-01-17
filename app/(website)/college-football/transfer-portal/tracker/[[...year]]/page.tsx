import Link from 'next/link'

import { Twitter } from '@/components/icons'
import { Filters } from '@/components/transfer-portal/filters'
import { PlayerEntryCard } from '@/components/transfer-portal/player-entry-card'
import {
  getPositions,
  getSchools,
  getTransferCycleYears,
  getTransferPortalEntries,
} from '@/server/queries'

import type { Metadata, ResolvingMetadata } from 'next'
import type { TransferPortalEntry } from '@/types/transfer-portal'

type Props = {
  params: { year: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { year } = params

  return {
    title: year ? `College Football Transfer Portal ${year}` : 'College Football Transfer Portal',
    description:
      'Stay up-to-date with the latest college football transfer portal news. Track player movements, commitments, and transfers across all NCAA divisions in real-time.',
  }
}

export default async function TransferPortalTracker({ params, searchParams }: Props) {
  const { year } = params
  let portalCycleYear

  // if year is not undefined, convert to a number
  if (year) {
    portalCycleYear = parseInt(year as string)
  }

  const positions = await getPositions()
  const schools = await getSchools()
  const cycleYears = await getTransferCycleYears()
  // grab the latest cycleYear from cycleYears based on the createdAt date
  const latestCycleYear = cycleYears.sort((a, b) =>
    b.createdAt.toISOString().localeCompare(a.createdAt.toISOString()),
  )[0].year

  if (!year) {
    portalCycleYear = latestCycleYear
  }

  const status =
    (searchParams.status as 'Entered' | 'Committed' | 'Withdrawn' | undefined) || undefined
  const position = (searchParams.position as string) || undefined
  const isGradTransfer =
    typeof searchParams.grad === 'string' && searchParams.grad.toLowerCase() === 'true'
      ? true
      : typeof searchParams.grad === 'string' && searchParams.grad.toLowerCase() === 'false'
        ? false
        : undefined

  console.log('isGradTransfer', isGradTransfer)

  const entries: TransferPortalEntry[] = await getTransferPortalEntries(1, 20, {
    year: portalCycleYear,
    status: status,
    position: position,
    isGradTransfer: isGradTransfer,
  })

  return (
    <div className="container mx-auto py-10">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
            College Football Transfer Portal {year}
          </h1>
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
      <Filters
        positions={positions}
        schools={schools}
        searchParams={searchParams}
        years={cycleYears}
      />
      <div className="space-y-4">
        {entries.map((entry) => (
          <PlayerEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}
