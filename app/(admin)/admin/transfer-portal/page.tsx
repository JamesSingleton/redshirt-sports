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

export default function TransferPortal() {
  const currentYear = new Date().getFullYear()
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
        <h2 className="text-2xl">Latest Portal Entries</h2>
        <Table className="mt-4 rounded-md border">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>School Transferring From</TableHead>
              <TableHead>Is Grad Transfer</TableHead>
              <TableHead>Years of Eligibility</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Evan Eller</TableCell>
              <TableCell>LB</TableCell>
              <TableCell>VMI</TableCell>
              <TableCell>Yes</TableCell>
              <TableCell>1</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </>
  )
}
