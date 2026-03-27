import {
  getSeasonsForSport,
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

export default async function BallotsSportDivisionPage({
  params,
}: PageProps<"/ballots/[sport]/[division]">) {
  const { sport: sportParam, division } = await params;
  const sportId = await getSportIdBySlug(sportParam as SportParam);
  if (!sportId) {
    throw new Error("Invalid sport!");
  }
  const seasons = await getSeasonsForSport(sportId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {toPascalCase(division)}
        </h1>
        <p className="text-muted-foreground text-sm">
          Select a season to view its ballot data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seasons</CardTitle>
          <CardDescription>
            Available seasons for {toPascalCase(sportParam)} &mdash;{" "}
            {toPascalCase(division)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Season</TableHead>
                <TableHead className="w-31.25 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seasons.map((season) => (
                <TableRow key={season.year}>
                  <TableCell className="font-medium">
                    {season.displayName}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/ballots/${sportParam}/${division}/${season.year}`}
                      >
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
