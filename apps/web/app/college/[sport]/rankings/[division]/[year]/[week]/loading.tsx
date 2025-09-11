import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@redshirt-sports/ui/components/card'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@redshirt-sports/ui/components/table'
import { Skeleton } from '@redshirt-sports/ui/components/skeleton'

export default function Loading() {
  const cols = Array.from({ length: 25 })
  const rows = Array.from({ length: 8 })

  return (
    <div className="container mx-auto gap-8 px-4 py-8">
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

      <Card className="mt-8 w-full">
        <CardHeader className="gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl">
              <Skeleton className="h-6 w-48" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-72" />
            </CardDescription>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 md:w-auto md:auto-cols-max md:grid-flow-col">
            <Skeleton className="h-9 w-full md:w-64" />
            <Skeleton className="h-9 w-full md:w-36" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-muted-foreground text-sm">
            <Skeleton className="h-4 w-56" />
          </div>

          {/* Desktop / Tablet skeleton table */}
          <div className="hidden md:block">
            <div className="relative overflow-x-auto rounded-md">
              <table className="w-full min-w-max border-collapse">
                <thead>
                  <tr>
                    <th className="bg-background sticky left-0 z-20 p-2 text-left">
                      <Skeleton className="h-4 w-20" />
                    </th>
                    {cols.map((_, i) => (
                      <th key={i} className="min-w-12 p-2 text-center">
                        <Skeleton className="mx-auto h-3 w-6" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((_, r) => (
                    <tr key={r} className="border-t">
                      <td className="bg-background sticky left-0 z-10 min-w-48 p-2 align-middle">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-56" />
                        </div>
                      </td>
                      {cols.map((_, c) => (
                        <td key={c} className="p-2">
                          <div className="flex items-center justify-center">
                            <Skeleton className="h-10 w-10 rounded-sm" />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile skeleton cards with single horizontal scroll row */}
          <div className="block md:hidden">
            <ul className="space-y-3">
              {rows.map((_, r) => (
                <li key={r} className="bg-card text-card-foreground rounded-md border p-3">
                  <div className="mb-2 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>

                  {/* Scroller with subtle edge gradients */}
                  <div className="-mx-3">
                    <div className="relative px-3">
                      {/* Left gradient */}
                      <div
                        aria-hidden
                        className="from-card pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r to-transparent"
                      />
                      {/* Right gradient */}
                      <div
                        aria-hidden
                        className="from-card pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l to-transparent"
                      />
                      <div className="overflow-x-auto">
                        <div className="flex items-center gap-3">
                          {cols.map((_, i) => (
                            <div key={i} className="flex shrink-0 flex-col items-center gap-1">
                              <Skeleton className="h-3 w-6" />
                              <Skeleton className="h-9 w-9 rounded-sm" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Mobile pagination placeholder */}
            <div className="mt-4 flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
