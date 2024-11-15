'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  ArrowRightIcon,
  FilterIcon,
  LogInIcon,
  CheckIcon,
  LogOutIcon,
  HelpCircleIcon,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Twitter } from '@/components/icons'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Player = {
  id: string
  name: string
  photo: string
  class: string
  height: string
  weight: number
  highSchool: string
  location: string
  position: string
  previousTeam: {
    name: string
    logo: string
  }
  status: 'ENTERED' | 'COMMITTED' | 'WITHDRAWN'
  date: string
  division: string
  year: string
}

const positions = [
  'ALL',
  'QB',
  'RB',
  'WR',
  'TE',
  'OT',
  'IOL',
  'EDGE',
  'DL',
  'LB',
  'CB',
  'S',
  'ATH',
  'K',
  'P',
  'LS',
]

const divisions = ['ALL', 'FBS', 'FCS', 'DII', 'DIII', 'NAIA', 'JUCO']
const years = ['ALL', '2024', '2025', '2026', '2027']
const statuses = ['ALL', 'ENTERED', 'COMMITTED', 'WITHDRAWN']

const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Tim Malo',
    photo: '/placeholder.svg?height=80&width=80',
    class: 'SR',
    height: '6-0',
    weight: 185,
    highSchool: 'Sehome',
    location: 'Bellingham, WA',
    position: 'S',
    previousTeam: {
      name: 'Montana',
      logo: '/placeholder.svg?height=24&width=24',
    },
    status: 'ENTERED',
    date: '10/31/24',
    division: 'FCS',
    year: '2024',
  },
  {
    id: '2',
    name: 'Nicholas Hilliard',
    photo: '/placeholder.svg?height=80&width=80',
    class: 'SR',
    height: '6-1',
    weight: 294,
    highSchool: 'Ascension Catholic',
    location: 'Donaldsonville, LA',
    position: 'IOL',
    previousTeam: {
      name: 'Princeton',
      logo: '/placeholder.svg?height=24&width=24',
    },
    status: 'COMMITTED',
    date: '10/31/24',
    division: 'FCS',
    year: '2024',
  },
]

const schools = Array.from(new Set(mockPlayers.map((player) => player.previousTeam.name)))

const statusIcons = {
  ENTERED: <LogInIcon className="h-4 w-4" />,
  COMMITTED: <CheckIcon className="h-4 w-4" />,
  WITHDRAWN: <LogOutIcon className="h-4 w-4" />,
}

const PlayerCard = React.memo(({ player }: { player: Player }) => (
  <Card key={player.id} className="mb-4 rounded-lg p-4 shadow">
    <div className="flex items-start space-x-4">
      <div className="flex flex-col items-center">
        <Image
          src={player.photo}
          alt={player.name}
          width={64}
          height={64}
          className="rounded-full object-cover"
        />
        <span className="mt-2 text-sm font-bold text-primary">{player.position}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{player.name}</h2>
            <p className="text-sm text-muted-foreground">
              {player.class} | {player.height} | {player.weight} lbs
            </p>
          </div>
          <div className="ml-2 flex flex-col items-end">
            <span className="text-sm">{player.date}</span>
            <Badge className="mt-1">
              {statusIcons[player.status]}
              <span className="ml-1">{player.status}</span>
            </Badge>
          </div>
        </div>
        <p className="mb-2 break-words text-sm text-muted-foreground">
          {player.highSchool} ({player.location})
        </p>
        <div className="flex items-center space-x-2 text-sm">
          <Image
            src={player.previousTeam.logo}
            alt={player.previousTeam.name}
            width={30}
            height={30}
            className="object-contain"
          />
          <ArrowRightIcon className="h-4 w-4 text-gray-400" />
          <HelpCircleIcon className="h-6 w-6 text-gray-400" />
        </div>
      </div>
    </div>
  </Card>
))

PlayerCard.displayName = 'PlayerCard'

export default function TransferPortalTracker({
  year,
  data = { players: [] },
}: {
  year: string
  data?: { players: Player[] }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState({
    position: searchParams.get('position') || 'ALL',
    division: searchParams.get('division') || 'ALL',
    year: searchParams.get('year') || 'ALL',
    status: searchParams.get('status') || 'ALL',
    school: searchParams.get('school') || '',
  })

  const [drawerFilters, setDrawerFilters] = useState({ ...filters })
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const updateURL = useCallback(() => {
    const url = new URL(window.location.href)
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'ALL') {
        url.searchParams.set(key, value)
      } else {
        url.searchParams.delete(key)
      }
    })
    router.push(url.pathname + url.search, { scroll: false })
  }, [filters, router])

  useEffect(() => {
    updateURL()
  }, [updateURL])

  const stats = useMemo(
    () => ({
      entered: data.players.filter((p) => p.status === 'ENTERED').length,
      committed: data.players.filter((p) => p.status === 'COMMITTED').length,
      withdrawn: data.players.filter((p) => p.status === 'WITHDRAWN').length,
    }),
    [data.players],
  )

  const filteredPlayers = useMemo(
    () =>
      data.players.filter(
        (player) =>
          (filters.position === 'ALL' || player.position === filters.position) &&
          (filters.division === 'ALL' || player.division === filters.division) &&
          (filters.year === 'ALL' || player.year === filters.year) &&
          (filters.status === 'ALL' || player.status === filters.status) &&
          (filters.school === '' ||
            player.previousTeam.name.toLowerCase().includes(filters.school.toLowerCase())),
      ),
    [filters, data.players],
  )

  const applyDrawerFilters = useCallback(() => {
    setFilters(drawerFilters)
    setIsDrawerOpen(false)
  }, [drawerFilters])

  const FilterDrawer = useCallback(
    () => (
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <FilterIcon className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Apply filters to narrow down the player list</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="drawer-division">Division</Label>
              <Select
                onValueChange={(value) =>
                  setDrawerFilters((prev) => ({ ...prev, division: value }))
                }
              >
                <SelectTrigger id="drawer-division">
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((division) => (
                    <SelectItem key={division} value={division}>
                      {division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="drawer-year">Year</Label>
              <Select
                onValueChange={(value) => setDrawerFilters((prev) => ({ ...prev, year: value }))}
              >
                <SelectTrigger id="drawer-year">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="drawer-status">Status</Label>
              <Select
                onValueChange={(value) => setDrawerFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="drawer-status">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center">
                        {status !== 'ALL' && statusIcons[status as keyof typeof statusIcons]}
                        <span className="ml-2">{status}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="drawer-school">School</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="drawer-school"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {drawerFilters.school || 'Filter by school...'}
                    <ArrowRightIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search school..." className="h-9" />
                    <CommandEmpty>No school found.</CommandEmpty>
                    <CommandGroup>
                      {schools.map((school) => (
                        <CommandItem
                          key={school}
                          onSelect={(currentValue) => {
                            setDrawerFilters((prev) => ({
                              ...prev,
                              school: currentValue === drawerFilters.school ? '' : currentValue,
                            }))
                          }}
                        >
                          {school}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={applyDrawerFilters}>Apply Filters</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    ),
    [isDrawerOpen, drawerFilters, applyDrawerFilters],
  )

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 border-b">
        <div className="container px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">College Football Transfer Portal {year}</h1>
            <Link
              href="https://x.com/Redshirt_Portal"
              className="text-brand-500 hover:text-brand-600"
            >
              <Twitter className="h-6 w-6" />
            </Link>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            The Transfer Portal lists all college athletes that enter the NCAA Transfer Portal,
            including data on the previous and new school.
          </p>
        </div>

        <div className="container px-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="grid gap-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={filters.position}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, position: value }))}
              >
                <SelectTrigger id="position" className="w-[130px]">
                  <SelectValue placeholder="Select Position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden space-x-2 md:flex">
              <div className="grid gap-2">
                <Label htmlFor="division">Division</Label>
                <Select
                  value={filters.division}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, division: value }))}
                >
                  <SelectTrigger id="division" className="w-[130px]">
                    <SelectValue placeholder="Select Division" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((division) => (
                      <SelectItem key={division} value={division}>
                        {division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="year">Year</Label>
                <Select
                  value={filters.year}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, year: value }))}
                >
                  <SelectTrigger id="year" className="w-[130px]">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="status" className="w-[130px]">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center">
                          {status !== 'ALL' && statusIcons[status as keyof typeof statusIcons]}
                          <span className="ml-2">{status}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="school">School</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="school"
                      variant="outline"
                      role="combobox"
                      className="w-[200px] justify-between"
                    >
                      {filters.school || 'Filter by school...'}
                      <ArrowRightIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search school..." className="h-9" />
                      <CommandEmpty>No school found.</CommandEmpty>
                      <CommandGroup>
                        {schools.map((school) => (
                          <CommandItem
                            key={school}
                            onSelect={(currentValue) => {
                              setFilters((prev) => ({
                                ...prev,
                                school: currentValue === filters.school ? '' : currentValue,
                              }))
                            }}
                          >
                            {school}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <FilterDrawer />
          </div>
        </div>

        <div className="container flex justify-between border-t px-4 py-4 text-sm">
          <div className="flex items-center space-x-4">
            <div>
              <span className="font-semibold">{stats.entered}</span> ENTERED
            </div>
            <div>
              <span className="font-semibold">{stats.committed}</span> COMMITTED
            </div>
            <div>
              <span className="font-semibold">{stats.withdrawn}</span> WITHDRAWN
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-4">
        {filteredPlayers.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  )
}
