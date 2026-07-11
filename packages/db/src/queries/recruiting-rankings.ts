import { and, asc, eq } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  playerCommitmentsTable,
  playersTable,
  recruitingRankingsTable,
  schoolsTable,
} from "../schema";

export async function getRecruitingRankingsBySportAndClass({
  sportId,
  classYear,
  limit,
}: {
  sportId: string;
  classYear: number;
  limit?: number;
}) {
  const query = db
    .select({
      id: recruitingRankingsTable.id,
      playerId: recruitingRankingsTable.playerId,
      sportId: recruitingRankingsTable.sportId,
      classYear: recruitingRankingsTable.classYear,
      nationalRank: recruitingRankingsTable.nationalRank,
      positionRank: recruitingRankingsTable.positionRank,
      stateRank: recruitingRankingsTable.stateRank,
      stars: recruitingRankingsTable.stars,
      compositeScore: recruitingRankingsTable.compositeScore,
      position: recruitingRankingsTable.position,
      state: recruitingRankingsTable.state,
      playerSlug: playersTable.slug,
      firstName: playersTable.firstName,
      lastName: playersTable.lastName,
      displayName: playersTable.displayName,
      headshotUrl: playersTable.headshotUrl,
      hometown: playersTable.hometown,
      highSchool: playersTable.highSchool,
      committedSchoolId: playersTable.committedSchoolId,
      committedSchoolName: schoolsTable.name,
      committedSchoolShortName: schoolsTable.shortName,
    })
    .from(recruitingRankingsTable)
    .innerJoin(
      playersTable,
      eq(recruitingRankingsTable.playerId, playersTable.id),
    )
    .leftJoin(schoolsTable, eq(playersTable.committedSchoolId, schoolsTable.id))
    .where(
      and(
        eq(recruitingRankingsTable.sportId, sportId),
        eq(recruitingRankingsTable.classYear, classYear),
      ),
    )
    .orderBy(asc(recruitingRankingsTable.nationalRank));

  if (limit != null) {
    return query.limit(limit);
  }

  return query;
}

export async function getTeamRecruitingClass({
  schoolId,
  sportId,
  classYear,
}: {
  schoolId: string;
  sportId: string;
  classYear: number;
}) {
  return db
    .select({
      commitmentId: playerCommitmentsTable.id,
      committedAt: playerCommitmentsTable.committedAt,
      classYear: playerCommitmentsTable.classYear,
      playerId: playersTable.id,
      playerSlug: playersTable.slug,
      firstName: playersTable.firstName,
      lastName: playersTable.lastName,
      displayName: playersTable.displayName,
      headshotUrl: playersTable.headshotUrl,
      hometown: playersTable.hometown,
      highSchool: playersTable.highSchool,
      playerPosition: playersTable.position,
      rankingId: recruitingRankingsTable.id,
      nationalRank: recruitingRankingsTable.nationalRank,
      positionRank: recruitingRankingsTable.positionRank,
      stateRank: recruitingRankingsTable.stateRank,
      stars: recruitingRankingsTable.stars,
      compositeScore: recruitingRankingsTable.compositeScore,
      rankingPosition: recruitingRankingsTable.position,
      state: recruitingRankingsTable.state,
    })
    .from(playerCommitmentsTable)
    .innerJoin(
      playersTable,
      eq(playerCommitmentsTable.playerId, playersTable.id),
    )
    .leftJoin(
      recruitingRankingsTable,
      and(
        eq(recruitingRankingsTable.playerId, playersTable.id),
        eq(recruitingRankingsTable.sportId, sportId),
        eq(recruitingRankingsTable.classYear, classYear),
      ),
    )
    .where(
      and(
        eq(playerCommitmentsTable.schoolId, schoolId),
        eq(playerCommitmentsTable.sportId, sportId),
        eq(playerCommitmentsTable.classYear, classYear),
      ),
    )
    .orderBy(asc(recruitingRankingsTable.nationalRank));
}
