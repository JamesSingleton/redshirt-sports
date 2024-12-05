import Image from 'next/image'
import { CheckIcon, LogInIcon, LogOutIcon, GraduationCap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { TeamTransfer } from './TeamTransfer'
import { type TransferPortalEntry } from '@/types/transfer-portal'

interface TransferPortalProps {
  entries: TransferPortalEntry[]
}

const statusIcons: { [key: string]: JSX.Element } = {
  Entered: <LogInIcon className="h-4 w-4" />,
  Committed: <CheckIcon className="h-4 w-4" />,
  Withdrawn: <LogOutIcon className="h-4 w-4" />,
}

export function TransferPortal({ entries }: TransferPortalProps) {
  return (
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
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-brand-500 text-xs font-medium text-white">
                      {player.position.abbreviation}
                    </div>
                    <h2 className="inline-flex items-center text-lg font-semibold">
                      {player.firstName} {player.lastName}
                      {isGradTransfer && (
                        <GraduationCap className="ml-2 h-5 w-5" aria-label="Graduate Transfer" />
                      )}
                    </h2>
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
  )
}
