import { getSports } from "@redshirt-sports/db/queries";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ballots</h1>
          <p className="text-muted-foreground text-sm">
            Manage weekly voter ballots by sport
          </p>
        </div>
        <form action={loadBallots}>
          <Button variant="outline">Load Ballots</Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sports</CardTitle>
          <CardDescription>
            Select a sport to view its ballot data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sport</TableHead>
                <TableHead className="w-[100px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sports.map((sport) => (
                <TableRow key={sport.id}>
                  <TableCell className="font-medium">
                    {sport.displayName}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/ballots/${sport.slug}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
