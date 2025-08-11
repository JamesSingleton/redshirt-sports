'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Input } from '@workspace/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { Search } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { useIsMobile } from '@/hooks/use-is-mobile'
import type { Voter } from '@/types/votes'

const VoterBreakdownDesktop = dynamic(() => import('./desktop'), { ssr: false })
const VoterBreakdownMobile = dynamic(() => import('./mobile'), { ssr: false })

type Props = {
  voterBreakdown: Voter[]
}

export default function VoterBreakdown2({ voterBreakdown }: Props) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 150)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const searchable = useMemo(
    () =>
      voterBreakdown.map((v) => ({
        voter: v,
        text: `${v.name} ${v.organization} ${v.organizationRole || ''}`.toLowerCase(),
      })),
    [voterBreakdown],
  )
  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return searchable.map((s) => s.voter)
    return searchable.filter((s) => s.text.includes(q)).map((s) => s.voter)
  }, [debouncedQuery, searchable])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const startIdx = (safePage - 1) * pageSize
  const rows = useMemo(
    () => filtered.slice(startIdx, startIdx + pageSize),
    [filtered, startIdx, pageSize],
  )

  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, pageSize])

  const isMobile = useIsMobile()

  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  if (!ready) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Voter Breakdown</CardTitle>
          <CardDescription>
            See how each voter cast their ballot for this week's rankings.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">Loading view…</CardContent>
      </Card>
    )
  }

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
          Showing {rows.length} of {filtered.length} voter(s). Page {safePage} of {pageCount}.
        </div>

        {isMobile ? (
          <VoterBreakdownMobile
            rows={rows}
            page={safePage}
            pageCount={pageCount}
            onPrevAction={() => setPage((p) => Math.max(1, p - 1))}
            onNextAction={() => setPage((p) => Math.min(pageCount, p + 1))}
          />
        ) : (
          <VoterBreakdownDesktop
            rows={rows}
            page={safePage}
            pageCount={pageCount}
            onFirstAction={() => setPage(1)}
            onPrevAction={() => setPage((p) => Math.max(1, p - 1))}
            onNextAction={() => setPage((p) => Math.min(pageCount, p + 1))}
            onLastAction={() => setPage(pageCount)}
          />
        )}
      </CardContent>
    </Card>
  )
}
