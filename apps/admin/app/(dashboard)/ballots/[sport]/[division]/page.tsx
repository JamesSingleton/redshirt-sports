import {
  getSeasonsForSport,
  getSportIdBySlug,
  type SportParam,
} from "@redshirt-sports/db/queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";
import Link from "next/link";

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
    <div>
      <p>
        Ballots Page - {sportParam}: {division}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Season</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {seasons.map((season) => (
            <TableRow key={season.year}>
              <TableCell>
                <Link
                  href={`/ballots/${sportParam}/${division}/${season.year}`}
                >
                  {season.displayName}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
