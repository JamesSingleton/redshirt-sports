import {
  getDivisionsBySportId,
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
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Division</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {divisions.map(({ division }) => (
            <TableRow key={division.slug}>
              <TableCell>
                <Link href={`/ballots/${sportParam}/${division.slug}`}>
                  {division.name}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
