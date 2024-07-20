'use client'

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import ImageComponent from '@/components/common/ImageComponent'

import type { VoterBreakdown } from '@/types'

interface VoterBreakdownProps {
  voterBreakdown: VoterBreakdown[]
}

export default function VoterBreakdown({ voterBreakdown }: VoterBreakdownProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Voter</TableHead>
          {[...Array(25)].map((_, i) => (
            <TableHead key={i}>{i + 1}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {voterBreakdown.map((voter: any) => {
          return (
            <TableRow key={`${voter.name}_${voter.organization}`}>
              <TableCell className="whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="font-medium">{voter.name}</div>
                    <div className="mt-1 text-sm italic text-muted-foreground">
                      {voter.organization}
                    </div>
                  </div>
                </div>
              </TableCell>
              {voter.ballot.map((vote: any) => (
                <TableCell key={vote._id}>
                  <div className="w-8">
                    <ImageComponent
                      className="w-full"
                      image={vote.image}
                      width={32}
                      height={32}
                      alt={vote.shortName ?? vote.abbreviation ?? vote.name}
                    />
                  </div>
                </TableCell>
              ))}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
