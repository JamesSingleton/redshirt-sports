import Link from 'next/link'
import { FlipHorizontal } from 'lucide-react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@components/ui/card'
import { buttonVariants } from '@components/ui/Button'
import { LatestEntriesTable } from './LatestEntriesTable'
import { Payment, columns } from './columns'

async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
      id: '728ed52f',
      status: 'entered',
      name: 'Evan Eller',
      position: 'LB',
      transferringFrom: 'VMI',
      gradTransfer: true,
      yearsOfEligibility: 1,
    },
    {
      id: '489e1d42',
      status: 'entered',
      name: 'Aidan Twombly',
      position: 'TE',
      transferringFrom: 'VMI',
      gradTransfer: true,
      yearsOfEligibility: 1,
    },
    {
      id: 'a1b2c3d4',
      status: 'entered',
      name: 'Alex Oliver',
      position: 'DB',
      transferringFrom: 'VMI',
      gradTransfer: true,
    },
    {
      id: '12345678',
      status: 'entered',
      name: 'Chance Knox',
      position: 'WR',
      transferringFrom: 'VMI',
      gradTransfer: true,
    },
    {
      id: '87654321',
      status: 'entered',
      name: 'Jack Culbreath',
      position: 'P',
      transferringFrom: 'VMI',
      gradTransfer: true,
    },
    {
      id: '12345678',
      status: 'entered',
      name: 'Isaiah Lemmond',
      position: 'WR',
      transferringFrom: 'VMI',
      gradTransfer: false,
    },
    {
      id: 'sda089134',
      status: 'entered',
      name: 'Holt Fletcher',
      position: 'LB',
      transferringFrom: 'Cornell',
      gradTransfer: true,
    },
  ]
}

export default async function TransferPortal() {
  const currentYear = new Date().getFullYear()
  const data = await getData()
  return (
    <>
      <h1 className="mb-4 text-4xl font-semibold">Transfer Portal Overview</h1>
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Players in Portal - {currentYear}
            </CardTitle>
            <FlipHorizontal className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">283</div>
            <p className="text-xs text-muted-foreground">+5 since last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Add Player to Our Transfer Portal List
            </CardTitle>
            <CardDescription>
              Easily add players manually to our internal transfer portal as an admin.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link
              href="/admin/transfer-portal/add"
              className={buttonVariants({
                variant: 'default',
              })}
            >
              Add Player
            </Link>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Submitted Transfer Portal Players</CardTitle>
            <CardDescription>
              Confirm players added to our internal transfer portal by our users.
            </CardDescription>
          </CardHeader>
          {/* <CardContent>
            <p>283 players waiting to be verified</p>
          </CardContent> */}
          <CardFooter>
            <Link
              href="/admin/transfer-portal/verify"
              className={buttonVariants({
                variant: 'default',
              })}
            >
              Verify Players
            </Link>
          </CardFooter>
        </Card>
      </section>
      <section className="mt-4">
        <h2 className="mb-4 text-2xl">Latest Portal Updates</h2>
        <LatestEntriesTable columns={columns} data={data} />
      </section>
    </>
  )
}
