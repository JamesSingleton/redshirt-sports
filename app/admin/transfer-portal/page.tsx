'use client'
import { CheckIcon, ClockIcon, DownloadIcon, FilterIcon } from 'lucide-react'
import { LabelList, Pie, PieChart } from 'recharts'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import TransferPortalByDivision from './_components/transfer-portal-by-division'
import TransferPortalByPosition from './_components/transfer-portal-by-position'

export default function TransferPortal() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transfer Portal</h1>
          <p className="text-gray-500 dark:text-gray-400">
            View and manage transfer portal activity.
          </p>
        </div>
        <Select>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
            <SelectItem value="2021">2021</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Transfer Portal by Division</CardTitle>
              <CardDescription>
                Breakdown of players in the transfer portal by NCAA division.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <TransferPortalByDivision />
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Transfer Portal by Position</CardTitle>
              <CardDescription>
                Breakdown of players in the transfer portal by position.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <TransferPortalByPosition />
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Transfer Portal</h2>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <FilterIcon className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button size="sm" variant="outline">
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Select>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="overflow-auto rounded-lg border">
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
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        alt="Player Avatar"
                        className="rounded-full"
                        height={40}
                        src="https://on3static.com/cdn-cgi/image/height=90,width=90/static/on3/avatar.png"
                        style={{
                          aspectRatio: '40/40',
                          objectFit: 'cover',
                        }}
                        width={40}
                      />
                      <div>
                        <p className="font-medium">Al Wooten II</p>
                        {/* <p className="text-sm text-gray-500 dark:text-gray-400">@johndoe</p> */}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>Mercer</TableCell>
                  <TableCell>Duke</TableCell>
                  <TableCell>RB</TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      <CheckIcon className="h-4 w-4" />
                      Committed
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        alt="Player Avatar"
                        className="rounded-full"
                        height={40}
                        src="https://on3static.com/cdn-cgi/image/height=90,width=90/uploads/assets/44/242/242044.jpeg"
                        style={{
                          aspectRatio: '40/40',
                          objectFit: 'cover',
                        }}
                        width={40}
                      />
                      <div>
                        <p className="font-medium">Joshua Burrell</p>
                        {/* <p className="text-sm text-gray-500 dark:text-gray-400">@janesmith</p> */}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>Florida State</TableCell>
                  <TableCell>Furman</TableCell>
                  <TableCell>ATH</TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      <CheckIcon className="h-4 w-4" />
                      Committed
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        alt="Player Avatar"
                        className="rounded-full"
                        height={40}
                        src="https://on3static.com/cdn-cgi/image/height=90,width=90/static/on3/avatar.png"
                        style={{
                          aspectRatio: '40/40',
                          objectFit: 'cover',
                        }}
                        width={40}
                      />
                      <div>
                        <p className="font-medium">Savio Frazier</p>
                        {/* <p className="text-sm text-gray-500 dark:text-gray-400">@michaeljohnson</p> */}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>Mercer</TableCell>
                  <TableCell>Miami (OH)</TableCell>
                  <TableCell>DL</TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      <CheckIcon className="h-4 w-4" />
                      Committed
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        alt="Player Avatar"
                        className="rounded-full"
                        height={40}
                        src="https://on3static.com/cdn-cgi/image/height=90,width=90/uploads/assets/243/174/174243.png"
                        style={{
                          aspectRatio: '40/40',
                          objectFit: 'cover',
                        }}
                        width={40}
                      />
                      <div>
                        <p className="font-medium">Myron Warren</p>
                        {/* <p className="text-sm text-gray-500 dark:text-gray-400">@emilydavis</p> */}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>Texas State</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>DL</TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
                      <ClockIcon className="h-4 w-4" />
                      Undecided
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow />
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  )
}
