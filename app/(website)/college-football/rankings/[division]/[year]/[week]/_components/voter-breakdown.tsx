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

interface Vote {
  _id: string
  image: any
  shortName?: string
  abbreviation?: string
  name: string
  userId: string
}

interface VoterBreakdownProps {
  ballots: { [userId: string]: Vote[] }
}

export default function VoterBreakdown({ ballots }: VoterBreakdownProps) {
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
        {Object.entries(ballots).map(([userId, votes]) => {
          return (
            <TableRow key={userId}>
              <TableCell className="whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="font-medium">James Singleton</div>
                    <div className="mt-1 text-sm italic text-muted-foreground">Redshirt Sports</div>
                  </div>
                </div>
              </TableCell>
              {votes.map((vote) => (
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
