'use client'

import { useState } from 'react'
import { ArrowRight, Check, X, Filter, MoveRight, LogIn } from 'lucide-react'
import { Button } from '@redshirt-sports/ui/components/button'
import { Badge } from '@redshirt-sports/ui/components/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@redshirt-sports/ui/components/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@redshirt-sports/ui/components/pagination'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@redshirt-sports/ui/components/sheet'

// --- Data ---

const mockPlayers = [
  {
    id: 1,
    name: 'Amari Wallace',
    status: 'Committed' as const,
    position: 'S',
    year: 'FR',
    height: '5-9.5',
    weight: '175',
    highSchool: 'Miami Central (Miami, FL)',
    rating: 87.0,
    ratingSecondary: 89.3,
    lastTeam: 'Miami',
    newTeam: 'Sacramento State',
    initials: 'AW',
  },
  {
    id: 2,
    name: 'Horatio Fields',
    status: 'Committed' as const,
    position: 'WR',
    year: 'RS-SR',
    height: '6-3',
    weight: '190',
    highSchool: 'New Manchester (Douglasville, GA)',
    rating: 89.25,
    ratingSecondary: 80.84,
    lastTeam: 'Auburn',
    newTeam: 'Ole Miss',
    initials: 'HF',
  },
  {
    id: 3,
    name: 'Devin Hightower',
    status: 'Committed' as const,
    position: 'LB',
    year: 'RS-SR',
    height: '6-1',
    weight: '225',
    highSchool: 'Archbishop Hoban (Akron, OH)',
    rating: 87.0,
    ratingSecondary: 86.83,
    lastTeam: 'Ohio State',
    newTeam: 'Tulsa',
    initials: 'DH',
  },
  {
    id: 4,
    name: 'Marcus Calwise',
    status: 'Committed' as const,
    position: 'WR',
    year: 'SO',
    height: '5-10',
    weight: '185',
    highSchool: 'Newton (Covington, GA)',
    rating: 85.0,
    ratingSecondary: null,
    lastTeam: 'Eastern Kentucky',
    newTeam: 'Louisiana Tech',
    initials: 'MC',
  },
  {
    id: 5,
    name: 'Brandon Hayes',
    status: 'Committed' as const,
    position: 'QB',
    year: 'JR',
    height: '6-2',
    weight: '205',
    highSchool: 'St. Thomas Aquinas (Fort Lauderdale, FL)',
    rating: 91.5,
    ratingSecondary: 88.9,
    lastTeam: 'Florida State',
    newTeam: 'Texas A&M',
    initials: 'BH',
  },
  {
    id: 6,
    name: 'Trey Johnson',
    status: 'Entered' as const,
    position: 'DL',
    year: 'RS-FR',
    height: '6-4',
    weight: '285',
    highSchool: 'IMG Academy (Bradenton, FL)',
    rating: 88.75,
    ratingSecondary: 91.2,
    lastTeam: 'Alabama',
    newTeam: '',
    initials: 'TJ',
  },
  {
    id: 7,
    name: 'Jaylen Carter',
    status: 'Entered' as const,
    position: 'CB',
    year: 'SO',
    height: '6-0',
    weight: '180',
    highSchool: 'Lakeland (Lakeland, FL)',
    rating: 86.5,
    ratingSecondary: 87.6,
    lastTeam: 'Georgia',
    newTeam: '',
    initials: 'JC',
  },
  {
    id: 8,
    name: 'Michael Rodriguez',
    status: 'Committed' as const,
    position: 'TE',
    year: 'JR',
    height: '6-5',
    weight: '245',
    highSchool: 'De La Salle (Concord, CA)',
    rating: 87.25,
    ratingSecondary: 85.3,
    lastTeam: 'USC',
    newTeam: 'Michigan',
    initials: 'MR',
  },
]

type FilterKey = 'year' | 'status' | 'position' | 'team'

interface Filters {
  year: string
  status: string
  position: string
  team: string
}

const filterOptions = {
  years: ['2026', '2025', '2024'],
  statuses: ['All', 'Committed', 'Entered', 'Withdrawn'],
  positions: ['All', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S'],
  teams: ['All', 'Alabama', 'Auburn', 'Florida State', 'Georgia', 'Miami', 'Michigan', 'Ohio State', 'Oregon', 'USC'],
}

// --- Sub-components ---

function StatusBadge({ status }: { status: string }) {
  if (status === 'Committed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
        <Check className="h-3 w-3" />
        Committed
      </span>
    )
  }
  if (status === 'Entered') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
        <LogIn className="h-3 w-3" />
        Entered
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-400">
      <X className="h-3 w-3" />
      Withdrawn
    </span>
  )
}

function StarRating({ rating }: { rating: number }) {
  const stars = Math.floor(rating / 20)
  return (
    <div className="flex gap-0.5" aria-label={`${stars} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={`star-${i}`}
          className={`text-sm ${i < stars ? 'text-amber-400' : 'text-border'}`}
          aria-hidden="true"
        >
          {'*'}
        </span>
      ))}
    </div>
  )
}

function TeamLogo({ team, size = 'md' }: { team: string; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-10 w-10 text-xs'
  return (
    <div
      className={`${sizeClasses} flex items-center justify-center rounded-full bg-muted font-bold text-muted-foreground`}
      title={team}
    >
      {team.slice(0, 2).toUpperCase()}
    </div>
  )
}

function FilterDropdownButton({
  label,
  value,
  options,
  onSelect,
}: {
  label: string
  value: string
  options: string[]
  onSelect: (value: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-card text-sm font-medium">
          {label}: {value}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onSelect={() => onSelect(option)}
            className={value === option ? 'font-semibold text-primary' : ''}
          >
            {option}
            {value === option && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// --- Main Component ---

export function TransferPortalContent() {
  const [activeTab, setActiveTab] = useState('TRANSFER PORTAL')
  const [filters, setFilters] = useState<Filters>({
    year: '2026',
    status: 'All',
    position: 'All',
    team: 'All',
  })
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  const tabs = ['TOP', 'TRANSFER PORTAL', 'RANKINGS']

  const updateFilter = (key: FilterKey, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearAllFilters = () => {
    setFilters({ year: '2026', status: 'All', position: 'All', team: 'All' })
  }

  const hasActiveFilters = filters.status !== 'All' || filters.position !== 'All' || filters.team !== 'All'

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container py-8">
        {/* Page Title */}
        <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          College Football Transfer Portal
        </h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-1">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-bold uppercase tracking-wider ${
                activeTab === tab ? '' : 'text-muted-foreground'
              }`}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Desktop Filters */}
          <div className="hidden flex-wrap gap-3 md:flex">
            <FilterDropdownButton
              label="Year"
              value={filters.year}
              options={filterOptions.years}
              onSelect={(v) => updateFilter('year', v)}
            />
            <FilterDropdownButton
              label="Status"
              value={filters.status}
              options={filterOptions.statuses}
              onSelect={(v) => updateFilter('status', v)}
            />
            <FilterDropdownButton
              label="Position"
              value={filters.position}
              options={filterOptions.positions}
              onSelect={(v) => updateFilter('position', v)}
            />
            <FilterDropdownButton
              label="Team"
              value={filters.team}
              options={filterOptions.teams}
              onSelect={(v) => updateFilter('team', v)}
            />
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                className="text-destructive hover:text-destructive"
              >
                <X className="mr-1 h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>

          {/* Mobile Filters */}
          <div className="flex gap-2 md:hidden">
            <FilterDropdownButton
              label="Year"
              value={filters.year}
              options={filterOptions.years}
              onSelect={(v) => updateFilter('year', v)}
            />
            <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 bg-card">
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                      {[filters.status, filters.position, filters.team].filter((f) => f !== 'All').length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6 overflow-y-auto">
                  <div>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Status</h3>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.statuses.map((s) => (
                        <Button
                          key={s}
                          variant={filters.status === s ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateFilter('status', s)}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Position</h3>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.positions.map((p) => (
                        <Button
                          key={p}
                          variant={filters.position === p ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateFilter('position', p)}
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Team</h3>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.teams.map((t) => (
                        <Button
                          key={t}
                          variant={filters.team === t ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateFilter('team', t)}
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active filter badges */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap gap-2">
            {filters.status !== 'All' && (
              <Badge variant="secondary" className="gap-1.5 pr-1">
                {filters.status}
                <button
                  onClick={() => updateFilter('status', 'All')}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  aria-label={`Remove ${filters.status} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.position !== 'All' && (
              <Badge variant="secondary" className="gap-1.5 pr-1">
                {filters.position}
                <button
                  onClick={() => updateFilter('position', 'All')}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  aria-label={`Remove ${filters.position} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.team !== 'All' && (
              <Badge variant="secondary" className="gap-1.5 pr-1">
                {filters.team}
                <button
                  onClick={() => updateFilter('team', 'All')}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  aria-label={`Remove ${filters.team} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Stats Summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground">
              <ArrowRight className="h-4 w-4 text-background" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Entered</span>
            <span className="text-2xl font-extrabold text-foreground">3,426</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600">
              <Check className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Committed</span>
            <span className="text-2xl font-extrabold text-foreground">2,348</span>
            <span className="text-sm font-semibold text-muted-foreground">69%</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <X className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Withdrawn</span>
            <span className="text-2xl font-extrabold text-foreground">53</span>
            <span className="text-sm font-semibold text-muted-foreground">1.55%</span>
          </div>
        </div>

        {/* Player List */}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {/* Desktop Header */}
          <div className="hidden border-b border-border px-4 py-3 md:block">
            <div
              className="grid items-center gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground"
              style={{
                gridTemplateColumns: '100px 72px 1.75fr 80px 1fr 32px 1fr',
                gridTemplateAreas:
                  '"statusH avatarH playerH posH lastTeamH arrowH newTeamH"',
              }}
            >
              <div style={{ gridArea: 'statusH' }}>Status</div>
              <div style={{ gridArea: 'avatarH' }} />
              <div style={{ gridArea: 'playerH' }}>Player</div>
              <div style={{ gridArea: 'posH' }} className="text-center">Pos</div>
              <div style={{ gridArea: 'lastTeamH' }} className="text-center">Last Team</div>
              <div style={{ gridArea: 'arrowH' }} />
              <div style={{ gridArea: 'newTeamH' }} className="text-center">New Team</div>
            </div>
          </div>

          {/* Player Rows */}
          <ul className="divide-y divide-border">
            {mockPlayers.map((player) => (
              <li key={player.id} className="px-4 py-4 transition-colors hover:bg-muted/50">
                {/* CSS Grid Row */}
                <div
                  className="player-row grid items-center gap-3 md:gap-4"
                  style={
                    {
                      '--mobile-cols': '64px 1fr',
                      '--mobile-areas': `
                        "avatar details"
                        "teamRow teamRow"
                      `,
                      '--desktop-cols': '100px 72px 1.75fr 80px 1fr 32px 1fr',
                      '--desktop-areas':
                        '"status avatar details pos lastTeam arrow newTeam"',
                    } as React.CSSProperties
                  }
                >
                  {/* Status -- desktop only */}
                  <div className="hidden md:flex" style={{ gridArea: 'status' }}>
                    <StatusBadge status={player.status} />
                  </div>

                  {/* Avatar */}
                  <div style={{ gridArea: 'avatar' }}>
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground md:h-16 md:w-16">
                      {player.initials}
                    </div>
                  </div>

                  {/* Player Details */}
                  <div className="min-w-0" style={{ gridArea: 'details' }}>
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-foreground md:text-base">
                        {player.name}
                      </span>
                      <div className="md:hidden">
                        <StatusBadge status={player.status} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{player.year}</span>
                      <span aria-hidden="true">/</span>
                      <span>{player.height}</span>
                      <span aria-hidden="true">/</span>
                      <span>{player.weight}</span>
                      <span className="hidden sm:inline" aria-hidden="true">{'|'}</span>
                      <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">{player.position}</Badge>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {player.highSchool}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <StarRating rating={player.rating} />
                      <span className="text-xs font-bold text-foreground">{player.rating.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Position -- desktop only */}
                  <div className="hidden text-center md:block" style={{ gridArea: 'pos' }}>
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {player.position}
                    </Badge>
                  </div>

                  {/* Last Team -- desktop only */}
                  <div className="hidden items-center justify-center md:flex" style={{ gridArea: 'lastTeam' }}>
                    <TeamLogo team={player.lastTeam} />
                  </div>

                  {/* Arrow -- desktop only */}
                  <div className="hidden items-center justify-center md:flex" style={{ gridArea: 'arrow' }}>
                    <MoveRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* New Team -- desktop only */}
                  <div className="hidden items-center justify-center md:flex" style={{ gridArea: 'newTeam' }}>
                    {player.newTeam ? (
                      <TeamLogo team={player.newTeam} />
                    ) : (
                      <span className="text-xs text-muted-foreground">TBD</span>
                    )}
                  </div>

                  {/* Team row -- mobile only */}
                  <div className="flex items-center gap-2 md:hidden" style={{ gridArea: 'teamRow' }}>
                    <TeamLogo team={player.lastTeam} size="sm" />
                    <span className="text-[10px] text-muted-foreground">{player.lastTeam}</span>
                    <MoveRight className="h-3 w-3 text-muted-foreground" />
                    {player.newTeam ? (
                      <>
                        <TeamLogo team={player.newTeam} size="sm" />
                        <span className="text-[10px] text-muted-foreground">{player.newTeam}</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">TBD</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pagination */}
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">99</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        {/* Update notice */}
        <div className="mt-4 text-xs text-muted-foreground">
          UPDATE: 2/14/26
        </div>
      </div>

      {/* CSS Grid responsive layout for player rows */}
      <style jsx>{`
        .player-row {
          grid-template-columns: var(--mobile-cols);
          grid-template-areas: var(--mobile-areas);
        }
        @media (min-width: 768px) {
          .player-row {
            grid-template-columns: var(--desktop-cols);
            grid-template-areas: var(--desktop-areas);
          }
        }
      `}</style>
    </div>
  )
}
