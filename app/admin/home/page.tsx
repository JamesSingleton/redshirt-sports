import Link from 'next/link'
import { ArrowUpRight, CheckIcon, LogIn, XIcon } from 'lucide-react'
import { auth, currentUser } from '@clerk/nextjs/server'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table'
import { buttonVariants } from '@components/ui/button'
import { cn } from '@lib/utils'

export default async function AdminHome() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 25 FBS</CardTitle>
            <CardDescription>Previous Week&apos;s Voting</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-2 text-sm">
              <li className="flex items-center justify-between">
                <div>1. Alabama</div>
                <div>1,234 votes</div>
              </li>
              <li className="flex items-center justify-between">
                <div>2. Ohio State</div>
                <div>1,178 votes</div>
              </li>
              <li className="flex items-center justify-between">
                <div>3. Georgia</div>
                <div>1,145 votes</div>
              </li>
              <li className="flex items-center justify-between">
                <div>4. Michigan</div>
                <div>1,098 votes</div>
              </li>
              <li className="flex items-center justify-between">
                <div>5. Clemson</div>
                <div>1,023 votes</div>
              </li>
            </ol>
          </CardContent>
          <CardFooter>
            <Link href="/admin/vote" className={buttonVariants({ size: 'sm' })}>
              View Full Rankings
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top 25 FCS</CardTitle>
            <CardDescription>Previous Week&apos;s Voting</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-2 text-sm">
              <li className="flex items-center justify-between">
                <div>1. North Dakota State</div>
                <div>567 votes</div>
              </li>
              <li className="flex items-center justify-between">
                <div>2. Montana State</div>
                <div>521 votes</div>
              </li>
              <li className="flex items-center justify-between">
                <div>3. South Dakota State</div>
                <div>498 votes</div>
              </li>
              <li className="flex items-center justify-between">
                <div>4. Sacramento State</div>
                <div>476 votes</div>
              </li>
              <li className="flex items-center justify-between">
                <div>5. Jackson State</div>
                <div>423 votes</div>
              </li>
            </ol>
          </CardContent>
          <CardFooter>
            <Link href="/admin/vote" className={buttonVariants({ size: 'sm' })}>
              View Full Rankings
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Transfer Portal</CardTitle>
            <CardDescription>Players in the Transfer Portal.</CardDescription>
          </div>
          <Link href="#" className={cn(buttonVariants({ size: 'sm' }), 'ml-auto gap-1')}>
            View All
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Previous School</TableHead>
                  <TableHead>New School</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>John Doe</TableCell>
                  <TableCell>Alabama</TableCell>
                  <TableCell>Miami</TableCell>
                  <TableCell>QB</TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-900 dark:bg-green-900/20 dark:text-green-400">
                      <CheckIcon className="h-4 w-4" />
                      Committed
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Jane Smith</TableCell>
                  <TableCell>Ohio State</TableCell>
                  <TableCell>Undecided</TableCell>
                  <TableCell>WR</TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-400">
                      <LogIn className="h-4 w-4" />
                      Entered
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Michael Johnson</TableCell>
                  <TableCell>Clemson</TableCell>
                  <TableCell>USC</TableCell>
                  <TableCell>LB</TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-900 dark:bg-red-900/20 dark:text-red-400">
                      <XIcon className="h-4 w-4" />
                      Withdrawn
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
