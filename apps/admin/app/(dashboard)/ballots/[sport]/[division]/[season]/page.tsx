import {
  getSeasonWithTypesByYearAndSportId,
  getSportIdBySlug,
  type SportParam,
} from "@redshirt-sports/db/queries";
import { SEASON_TYPE_CODES } from "@redshirt-sports/db/schema";
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

const seasonTypeLabelBySeasonType = (seasonType: number) =>
  Object.entries(SEASON_TYPE_CODES).find(
    ([_key, value]) => value === seasonType,
  );

export default async function BallotsSportDivisionSeasonPage({
  params,
}: PageProps<"/ballots/[sport]/[division]/[season]">) {
  const { sport: sportParam, division, season: seasonParam } = await params;
  const sportId = await getSportIdBySlug(sportParam as SportParam);
  if (!sportId) {
    throw new Error("Invalid sport!");
  }

  const season = await getSeasonWithTypesByYearAndSportId({
    sportId,
    year: Number(seasonParam),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {season?.displayName ?? seasonParam} Season
        </h1>
        <p className="text-muted-foreground text-sm">
          {toPascalCase(sportParam)} &mdash; {toPascalCase(division)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weeks</CardTitle>
          <CardDescription>
            Select a week to view ballot details
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Season Type</TableHead>
                <TableHead>Week</TableHead>
                <TableHead className="w-[100px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {season?.seasonTypes.flatMap((seasonType) => {
                const type = seasonTypeLabelBySeasonType(seasonType.type)?.[0];
                return seasonType.weeks.map((week) => (
                  <TableRow key={`${type}-${week.number}`}>
                    <TableCell className="text-muted-foreground">
                      {type}
                    </TableCell>
                    <TableCell className="font-medium">
                      Week {week.number}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/ballots/${sportParam}/${division}/${season.year}/${week.number}`}
                        >
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ));
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
