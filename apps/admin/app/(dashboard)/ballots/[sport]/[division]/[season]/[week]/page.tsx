import {
  getFinalRankingsForWeekAndYear,
  getSportIdBySlug,
  getVotersWithVotingStatusForWeek,
  type SportParam,
} from "@redshirt-sports/db/queries";
import { Button } from "@redshirt-sports/ui/components/button";
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

  return (
    <div className="w-full space-y-8">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usersWithVotingStatus.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                {user.firstName} {user.lastName}
              </TableCell>
              <TableCell>
                {user.hasVoted ? "Submitted" : "Not Yet Submitted"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-2 text-lg font-semibold">Computed from Ballots</h2>
          {computedRankings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No ballots found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>1st Place</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {computedRankings.map((team) => (
                  <TableRow key={team._id}>
                    <TableCell>
                      {team.isTie ? `T-${team.rank}` : team.rank}
                    </TableCell>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>{team._points}</TableCell>
                    <TableCell>{team.firstPlaceVotes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Stored in DB</h2>
          {!storedRankings || storedRankings.rankings.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No rankings found in DB
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>1st Place</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storedRankings.rankings.map((team) => (
                  <TableRow key={team._id}>
                    <TableCell>
                      {team.isTie ? `T-${team.rank}` : team.rank}
                    </TableCell>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>{team._points}</TableCell>
                    <TableCell>{team.firstPlaceVotes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <form action={processBallotsForm}>
        <input type="text" value={sportId} name="sportId" hidden />
        <input type="text" value={division} name="division" hidden />
        <input type="number" value={weekParam} name="week" hidden />
        <input type="number" value={seasonParam} name="season" hidden />
        <Button>Process Ballots</Button>
      </form>
    </div>
  );
}
