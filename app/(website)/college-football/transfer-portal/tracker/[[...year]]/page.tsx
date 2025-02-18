import Link from 'next/link'
import { CheckIcon, Filter, LogInIcon, LogOutIcon, Sheet } from 'lucide-react'
import { Twitter } from '@/components/icons'

import type { Metadata } from 'next'
import { PlayerEntryCard } from '@/components/transfer-portal/player-entry-card'
import { SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Select, Button, Label } from '@sanity/ui'

type Params = Promise<{ year: string }>
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

type Props = {
  params: Params
  searchParams: SearchParams
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { year } = await params

  return {
    title: year ? `College Football Transfer Portal ${year}` : 'College Football Transfer Portal',
    description:
      'Stay up-to-date with the latest college football transfer portal news. Track player movements, commitments, and transfers across all NCAA divisions in real-time.',
  }
}

export default async function TransferPortalTracker({ params, searchParams }: Props) {
  const { year } = await params
  let portalCycleYear: number

  if (year) {
    portalCycleYear = parseInt(year)
  }

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
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <LogInIcon className="h-4 w-4" />
            <span>Entered: 2,745</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckIcon className="h-4 w-4" />
            <span>Committed: 1,584 (58%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <LogOutIcon className="h-4 w-4" />
            <span>Withdrawn: 99 (3.61%)</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={activeFilters.year}
            onValueChange={(value) => setActiveFilters((prev) => ({ ...prev, year: value }))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {filters.year.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={activeFilters.position}
            onValueChange={(value) => setActiveFilters((prev) => ({ ...prev, position: value }))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              {filters.position.map((position) => (
                <SelectItem key={position} value={position}>
                  {position}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                {(Object.entries(filters) as [keyof typeof filters, string[]][]).map(
                  ([key, values]) => (
                    <div key={key} className="grid gap-2">
                      <Label htmlFor={key}>{key}</Label>
                      <Select
                        value={activeFilters[key]}
                        onValueChange={(value) =>
                          setActiveFilters((prev) => ({ ...prev, [key]: value }))
                        }
                      >
                        <SelectTrigger id={key}>
                          <SelectValue placeholder={`Select ${key}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {values.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ),
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        <PlayerEntryCard />
      </div>
    </div>
  )
}
