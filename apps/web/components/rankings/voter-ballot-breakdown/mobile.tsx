'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@redshirt-sports/ui/components/button'

import { TeamLogo } from './team-logo'
import { SyncedScroll } from './synced-scroll'
import type { Voter } from '@/types/votes'

type Props = {
  rows: Voter[]
  page: number
  pageCount: number
  onPrevAction: () => void
  onNextAction: () => void
}

export default function VoterBreakdownMobile({
  rows,
  page,
  pageCount,
  onPrevAction,
  onNextAction,
}: Props) {
  return (
    <div className="block md:hidden">
      <ul className="space-y-3">
        {rows.map((voter, idx) => (
          <li
            key={`${voter.name}-${idx}`}
            className="bg-card text-card-foreground rounded-md border p-3"
          >
            <div className="mb-2">
              <div className="leading-tight font-medium">{voter.name}</div>
              <div className="text-muted-foreground text-xs italic">
                {voter.organization}
                {voter.organizationRole ? ` (${voter.organizationRole})` : ''}
              </div>
            </div>

            <div className="-mx-3">
              <SyncedScroll
                group="mobile-ballots"
                className="px-3"
                aria-label="Voter ballot horizontal scroller"
              >
                <div className="flex snap-x snap-mandatory items-center gap-3">
                  {Array.from({ length: 25 }).map((_, i) => {
                    const r = i + 1
                    const vote = voter.ballot?.[i]
                    return (
                      <div
                        key={`${vote?._id ?? 'na'}-${i}`}
                        className="flex shrink-0 snap-start flex-col items-center gap-1"
                        aria-label={`Rank ${r}${vote?.teamName ? `: ${vote.teamName}` : ''}`}
                      >
                        <div className="text-muted-foreground text-[10px] leading-none">{r}</div>
                        {vote ? (
                          <TeamLogo vote={vote} size={36} />
                        ) : (
                          <div className="bg-muted/30 h-9 w-9 rounded-sm" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </SyncedScroll>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-muted-foreground text-xs">
          Page {page} of {pageCount}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPrevAction} disabled={page === 1}>
            <ChevronLeft className="mr-1 size-4" />
            Prev
          </Button>
          <Button variant="outline" size="sm" onClick={onNextAction} disabled={page === pageCount}>
            Next
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
