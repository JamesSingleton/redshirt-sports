import { Card, CardHeader, CardContent } from '@workspace/ui/components/card'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@workspace/ui/components/table'
import { Skeleton } from '@workspace/ui/components/skeleton'

export default function Loading() {
  return (
    <>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 max-w-md" />
          <div className="flex items-center space-x-4 pt-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-10 w-1/2" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>School (1st Place Votes)</TableHead>
                <TableHead>Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(25)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-6 w-6" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Skeleton className="mr-2 h-8 w-8" />
                      <Skeleton className="h-6 w-40" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Skeleton className="mt-4 h-16 w-full" />
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <Skeleton className="h-8 w-1/2 max-w-md" />
          <div>
            <Skeleton className="h-6 w-3/4" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voter</TableHead>
                {[...Array(25)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-6 w-6" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="mt-1 h-4 w-32" />
                  </TableCell>
                  {[...Array(25)].map((_, i) => (
                    <TableCell key={i}>
                      <Skeleton className="h-10 w-10" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
