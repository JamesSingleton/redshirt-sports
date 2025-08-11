'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react'

import { TeamLogo } from './voter-breakdown/team-logo'
import { useDebounce } from '@/hooks/use-debounce'
import { SyncedHScroll } from './voter-breakdown/synced-scroll'

type Vote = {
  _id: string
  image?: string
  teamName?: string
}

type Voter = {
  name: string
  organization: string
  organizationRole?: string
  ballot: Vote[] // expected length 25
}

type Props = {
  voterBreakdown: Voter[]
}

export default function VoterBreakdown({ voterBreakdown }: Props) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 150)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Precompute searchable text once per dataset reference to minimize per-keystroke work.
  const searchable = useMemo(() => {
    return voterBreakdown.map((v) => ({
      voter: v,
      text: `${v.name} ${v.organization} ${v.organizationRole || ''}`.toLowerCase(),
    }))
  }, [voterBreakdown])

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return searchable.map((s) => s.voter)
    return searchable.filter((s) => s.text.includes(q)).map((s) => s.voter)
  }, [debouncedQuery, searchable])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const startIdx = (safePage - 1) * pageSize
  const current = useMemo(
    () => filtered.slice(startIdx, startIdx + pageSize),
    [filtered, startIdx, pageSize],
  )

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, pageSize])

  // Horizontal scroll shadows for desktop table
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <Card className="w-full">
      <CardHeader className="gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl">Voter Breakdown</CardTitle>
          <CardDescription>
            See how each voter cast their ballot for this week's rankings.
          </CardDescription>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 md:w-auto md:auto-cols-max md:grid-flow-col">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search voters or organizations"
              className="pl-8"
              aria-label="Search voters or organizations"
            />
          </div>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="min-w-[140px]">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {`${n} per page`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-muted-foreground text-sm">
          Showing {current.length} of {filtered.length} voter(s). Page {safePage} of {pageCount}.
        </div>
        <div className="hidden md:block">
          <div className="relative">
            <div ref={scrollRef} className="relative overflow-x-auto rounded-md">
              <Table className="min-w-max">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="bg-background sticky left-0 z-20">Voter</TableHead>
                    {Array.from({ length: 25 }, (_, i) => (
                      <TableHead key={i} className="min-w-12 text-center">
                        {i + 1}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {current.map((voter, idx) => (
                    <TableRow key={`${voter.name}-${idx}`}>
                      <TableCell className="bg-background sticky left-0 z-10 min-w-48">
                        <div className="font-medium">{voter.name}</div>
                        <div className="text-muted-foreground text-sm italic">
                          {voter.organization}
                          {voter.organizationRole ? ` (${voter.organizationRole})` : ''}
                        </div>
                      </TableCell>
                      {voter.ballot?.slice(0, 25).map((vote, i) => (
                        <TableCell key={`${vote?._id ?? 'na'}-${i}`} className="py-1">
                          <div className="flex items-center justify-center">
                            {vote ? (
                              <TeamLogo vote={vote} size={40} />
                            ) : (
                              <div className="bg-muted/30 h-10 w-10 rounded-sm" />
                            )}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination controls (pattern inspired by shadcn/ui Data Table) */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 bg-transparent lg:flex"
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              aria-label="Go to first page"
              title="Go to first page"
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 bg-transparent"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label="Previous page"
              title="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="w-[120px] text-center text-sm">
              Page {safePage} of {pageCount}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-8 bg-transparent"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={safePage === pageCount}
              aria-label="Next page"
              title="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 bg-transparent lg:flex"
              onClick={() => setPage(pageCount)}
              disabled={safePage === pageCount}
              aria-label="Go to last page"
              title="Go to last page"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
          <div className="sr-only">
            Pagination controls pattern adapted from shadcn/ui Data Table examples.
          </div>
        </div>

        {/* Mobile layout (single horizontal row scroll for the ballot) */}
        <div className="block md:hidden">
          <ul className="space-y-3">
            {current.map((voter, idx) => (
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

                {/* Single-row, horizontally scrollable ballot */}
                <div className="-mx-3">
                  <SyncedHScroll
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
                            <div className="text-muted-foreground text-[10px] leading-none">
                              {r}
                            </div>
                            {vote ? (
                              <TeamLogo vote={vote} size={36} />
                            ) : (
                              <div className="bg-muted/30 h-9 w-9 rounded-sm" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </SyncedHScroll>
                </div>
              </li>
            ))}
          </ul>

          {/* Mobile pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-muted-foreground text-xs">
              Page {safePage} of {pageCount}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                <ChevronLeft className="mr-1 size-4" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={safePage === pageCount}
              >
                Next
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
