import { getSports } from "@redshirt-sports/db/queries";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";
import Link from "next/link";

import { loadBallots } from "./loadBallots";

export default async function BallotsPage() {
  const sports = await getSports();
  return (
    <>
      <p>Ballots Page</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sport</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sports.map((sport) => (
            <TableRow key={sport.id}>
              <TableCell>
                <Link href={`/ballots/${sport.slug}`}>{sport.displayName}</Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <form action={loadBallots}>
        <Button>Load Ballots</Button>
      </form>
    </>
  );
}
