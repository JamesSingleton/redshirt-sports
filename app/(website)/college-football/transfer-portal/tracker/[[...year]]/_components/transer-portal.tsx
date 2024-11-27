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
import { type Player } from '@/types/transfer-portal'

interface TransferPortalProps {
  initialPlayers: Player[]
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
  initialPlayers,
  totalCount,
  initialPage,
  initialLimit,
}: TransferPortalProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
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
        {players.map((player) => (
          <Card key={player.id} className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-4">
                <Image
                  src={player.player.playerImage}
                  alt={player.player.firstName + ' ' + player.player.lastName}
                  className="size-20 rounded-full object-cover object-top"
                  width={80}
                  height={80}
                  unoptimized
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center space-x-2">
                    <Badge variant="outline" className="shrink-0">
                      {new Date(player.entryDate).toLocaleDateString()}
                    </Badge>
                    <Badge className="shrink-0">
                      {statusIcons['Entered']}
                      <span className="ml-1">Entered</span>
                    </Badge>
                  </div>
                  <div className="mb-1 flex items-center space-x-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-brand-500 text-xs font-medium">
                      {player.player.position.abbreviation}
                    </div>
                    <h3 className="text-lg font-semibold">
                      {player.player.firstName} {player.player.lastName}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {player.player.year || 'RS-JR'} | {player.player.height} |{' '}
                    {player.player.weight}
                  </p>
                  <p className="text-sm text-muted-foreground">{`${player.player.highSchool} (${player.player.hometown}, ${player.player.state})`}</p>
                </div>
              </div>
              <TeamTransfer
                previousTeam={player.previousSchool}
                newTeam={player.commitmentSchool}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
