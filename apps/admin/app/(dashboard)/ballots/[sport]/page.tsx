import {
  getDivisionsBySportId,
  getSportIdBySlug,
  type SportParam,
} from "@redshirt-sports/db/queries";
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

function toPascalCase(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function BallotsSportPage({
  params,
}: PageProps<"/ballots/[sport]">) {
  const { sport: sportParam } = await params;
  const sportId = await getSportIdBySlug(sportParam as SportParam);
  if (!sportId) {
    throw new Error("Invalid sport!");
  }

  const divisions = await getDivisionsBySportId(sportId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {toPascalCase(sportParam)}
        </h1>
        <p className="text-muted-foreground text-sm">
          Select a division to view its ballot data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Divisions</CardTitle>
          <CardDescription>
            Available divisions for {toPascalCase(sportParam)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Division</TableHead>
                <TableHead className="w-[100px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {divisions.map(({ division }) => (
                <TableRow key={division.slug}>
                  <TableCell className="font-medium">{division.name}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/ballots/${sportParam}/${division.slug}`}>
                        View
                      </Link>
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
