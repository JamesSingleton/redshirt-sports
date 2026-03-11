import {
  getFinalRankingsForWeekAndYear,
  getSportIdBySlug,
  getVotersWithVotingStatusForWeek,
  type SportParam,
} from "@redshirt-sports/db/queries";
import { Badge } from "@redshirt-sports/ui/components/badge";
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

import {
  computeRankingsFromBallots,
  processBallotsForm,
} from "@/actions/process-ballots";

function toPascalCase(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function BallotsSportDivisionSeasonWeekPage({
  params,
}: PageProps<"/ballots/[sport]/[division]/[season]/[week]">) {
  const {
    sport: sportParam,
    division,
    season: seasonParam,
    week: weekParam,
  } = await params;
  const sportId = await getSportIdBySlug(sportParam as SportParam);
  if (!sportId) {
    throw new Error("Invalid sport!");
  }

  const year = Number(seasonParam);
  const week = Number(weekParam);

  const [usersWithVotingStatus, computedRankings, storedRankings] =
    await Promise.all([
      getVotersWithVotingStatusForWeek({ sportId, division, week, year }),
      computeRankingsFromBallots({
        sportId,
        division,
        seasonYear: year,
        weekNumber: week,
      }),
      getFinalRankingsForWeekAndYear({ year, week, division }).catch(
        () => null,
      ),
    ]);

  const submittedCount = usersWithVotingStatus.filter((u) => u.hasVoted).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Week {week}</h1>
          <p className="text-muted-foreground text-sm">
            {toPascalCase(sportParam)} &mdash; {toPascalCase(division)} &mdash;{" "}
            {seasonParam} Season
          </p>
        </div>
        <form action={processBallotsForm}>
          <input type="text" value={sportId} name="sportId" hidden readOnly />
          <input type="text" value={division} name="division" hidden readOnly />
          <input type="number" value={weekParam} name="week" hidden readOnly />
          <input
            type="number"
            value={seasonParam}
            name="season"
            hidden
            readOnly
          />
          <Button>Process Ballots</Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voter Status</CardTitle>
          <CardDescription>
            {submittedCount} of {usersWithVotingStatus.length} voters have
            submitted ballots
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersWithVotingStatus.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.hasVoted ? (
                      <Badge>Submitted</Badge>
                    ) : (
                      <Badge variant="secondary">Not Yet Submitted</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Computed from Ballots</CardTitle>
            <CardDescription>Real-time calculation</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {computedRankings.length === 0 ? (
              <p className="text-muted-foreground p-6 text-sm">
                No ballots found
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Rank</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">1st</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {computedRankings.map((team) => (
                    <TableRow key={team._id}>
                      <TableCell className="font-medium">
                        {team.isTie ? `T-${team.rank}` : team.rank}
                      </TableCell>
                      <TableCell>{team.name}</TableCell>
                      <TableCell className="text-right">
                        {team._points}
                      </TableCell>
                      <TableCell className="text-right">
                        {team.firstPlaceVotes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stored in DB</CardTitle>
            <CardDescription>Last processed rankings</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!storedRankings || storedRankings.rankings.length === 0 ? (
              <p className="text-muted-foreground p-6 text-sm">
                No rankings found in DB
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Rank</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">1st</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storedRankings.rankings.map((team) => (
                    <TableRow key={team._id}>
                      <TableCell className="font-medium">
                        {team.isTie ? `T-${team.rank}` : team.rank}
                      </TableCell>
                      <TableCell>{team.name}</TableCell>
                      <TableCell className="text-right">
                        {team._points}
                      </TableCell>
                      <TableCell className="text-right">
                        {team.firstPlaceVotes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
