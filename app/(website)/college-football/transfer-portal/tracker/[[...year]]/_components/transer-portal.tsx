'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckIcon, LogInIcon, LogOutIcon, GraduationCap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Filters } from './filters'
import { TeamTransfer } from './TeamTransfer'
import { type TransferPortalEntry } from '@/types/transfer-portal'

interface TransferPortalProps {
  entries: TransferPortalEntry[]
  totalCount: number
  initialPage: number
  initialLimit: number
  positions: {
    id: number
    name: string
    abbreviation: string
  }[]
}

const statusIcons: { [key: string]: JSX.Element } = {
  Entered: <LogInIcon className="h-4 w-4" />,
  Committed: <CheckIcon className="h-4 w-4" />,
  Withdrawn: <LogOutIcon className="h-4 w-4" />,
}

export function TransferPortal({
  entries,
  totalCount,
  initialPage,
  initialLimit,
  positions,
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
        positions={positions}
        divisionFilter={divisionFilter}
        yearFilter={yearFilter}
        statusFilter={statusFilter}
        schoolFilter={schoolFilter}
        onFilterChange={updateFilters}
      />
      <div className="space-y-4">
        {entries.map((entry) => {
          const { entryDate, isGradTransfer, classYear, transferStatus, id, player } = entry
          let feet = 0
          let inches = 0
          if (player.height) {
            feet = Math.floor(player.height / 12)
            inches = player.height % 12
          }
          return (
            <Card key={id} className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-4">
                  {player.playerImage ? (
                    <Image
                      src={player.playerImage}
                      alt={player.firstName + ' ' + player.lastName}
                      className="size-20 rounded-full object-cover object-top"
                      width={80}
                      height={80}
                      unoptimized
                    />
                  ) : (
                    <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                      <span className="text-sm">{player.firstName[0] + player.lastName[0]}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center space-x-2">
                      <Badge variant="outline" className="shrink-0">
                        {new Date(entryDate).toLocaleDateString()}
                      </Badge>
                      <Badge className="shrink-0">
                        {statusIcons[transferStatus as keyof typeof statusIcons]}
                        <span className="ml-1">{transferStatus}</span>
                      </Badge>
                    </div>
                    <div className="mb-1 flex items-center space-x-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-brand-500 text-xs font-medium">
                        {player.position.abbreviation}
                      </div>
                      <h3 className="inline-flex items-center text-lg font-semibold">
                        {player.firstName} {player.lastName}
                        {isGradTransfer && (
                          <>
                            <span className="sr-only">Graduate Transfer</span>
                            <GraduationCap className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {classYear.abbreviation} | {`${feet}'${inches}"`} | {player.weight}
                    </p>
                    <p className="text-sm text-muted-foreground">{`${player.highSchool} (${player.hometown}, ${player.state})`}</p>
                  </div>
                </div>
                <TeamTransfer
                  previousSchool={entry.previousSchool}
                  commitmentSchool={entry.commitmentSchool}
                />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
