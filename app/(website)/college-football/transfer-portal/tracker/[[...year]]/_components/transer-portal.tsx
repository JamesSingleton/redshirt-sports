'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckIcon, LogInIcon, LogOutIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Image as SanityImage } from '@/components/image'
import { Filters } from './filters'
import { TeamTransfer } from './TeamTransfer'
import { type Player, type TransferSchool } from '@/types/transfer-portal'

interface TransferPortalProps {
  entries: {
    id: number
    year: number
    entryDate: string
    eligibilityYears: number | null
    classYear: string | null
    isGradTransfer: boolean
    transferStatus: string
    player: Player
    previousSchool: TransferSchool | null
    commitmentSchool: TransferSchool | null
  }[]
  totalCount: number
  initialPage: number
  initialLimit: number
}

const statusIcons = {
  Entered: <LogInIcon className="h-4 w-4" />,
  Committed: <CheckIcon className="h-4 w-4" />,
  Withdrawn: <LogOutIcon className="h-4 w-4" />,
}

export function TransferPortal({
  entries,
  totalCount,
  initialPage,
  initialLimit,
}: TransferPortalProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [players, setPlayers] = useState(entries)
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)

  const positionFilter = searchParams.get('position')?.toUpperCase() || 'All'
  const divisionFilter = searchParams.get('division') || 'All'
  const yearFilter = searchParams.get('year') || 'All'
  const statusFilter = searchParams.get('status') || 'All'
  const schoolFilter = searchParams.get('school') || 'All'

  const updateFilters = (filters: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(searchParams)
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'All') {
        newSearchParams.set(key, value)
      } else {
        newSearchParams.delete(key)
      }
    })
    newSearchParams.set('page', '1') // Reset to first page on filter change
    router.push(`?${newSearchParams.toString()}`)
  }

  useEffect(() => {
    const fetchPlayers = async () => {
      const queryParams = new URLSearchParams(searchParams)
      queryParams.set('page', page.toString())
      queryParams.set('limit', limit.toString())
      const response = await fetch(`/api/players?${queryParams.toString()}`)
      const data = await response.json()
      setPlayers(data.players)
    }

    fetchPlayers()
  }, [searchParams, page, limit])

  return (
    <div>
      <Filters
        positionFilter={positionFilter}
        divisionFilter={divisionFilter}
        yearFilter={yearFilter}
        statusFilter={statusFilter}
        schoolFilter={schoolFilter}
        onFilterChange={updateFilters}
      />
      <div className="space-y-4">
        {entries.map((entry) => {
          const { entryDate, isGradTransfer, classYear, transferStatus, id, player } = entry
          const feet = Math.floor(player.height / 12)
          const inches = player.height % 12
          return (
            <Card key={id} className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-4">
                  <Image
                    src={player.playerImage}
                    alt={player.firstName + ' ' + player.lastName}
                    className="size-20 rounded-full object-cover object-top"
                    width={80}
                    height={80}
                    unoptimized
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center space-x-2">
                      <Badge variant="outline" className="shrink-0">
                        {new Date(entryDate).toLocaleDateString()}
                      </Badge>
                      <Badge className="shrink-0">
                        {statusIcons[transferStatus]}
                        <span className="ml-1">{transferStatus}</span>
                      </Badge>
                    </div>
                    <div className="mb-1 flex items-center space-x-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-brand-500 text-xs font-medium">
                        {player.position.abbreviation}
                      </div>
                      <h3 className="text-lg font-semibold">
                        {player.firstName} {player.lastName}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {classYear.abbreviation} | {`${feet}'${inches}"`} | {player.weight}
                    </p>
                    <p className="text-sm text-muted-foreground">{`${player.highSchool} (${player.hometown}, ${player.state})`}</p>
                  </div>
                </div>
                <TeamTransfer
                  previousTeam={entry.previousSchool}
                  newTeam={entry.commitmentSchool}
                />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
