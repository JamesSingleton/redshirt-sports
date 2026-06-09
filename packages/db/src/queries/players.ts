import { eq } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  playerCommitmentsTable,
  playersTable,
  playerTimelineTable,
  schoolsTable,
  sportsTable,
} from "../schema";

export async function getPlayerBySlug(slug: string) {
  const [player] = await db
    .select({
      id: playersTable.id,
      slug: playersTable.slug,
      firstName: playersTable.firstName,
      lastName: playersTable.lastName,
      displayName: playersTable.displayName,
      position: playersTable.position,
      classYear: playersTable.classYear,
      heightInches: playersTable.heightInches,
      weightLbs: playersTable.weightLbs,
      headshotUrl: playersTable.headshotUrl,
      hometown: playersTable.hometown,
      highSchool: playersTable.highSchool,
      currentStatus: playersTable.currentStatus,
      bio: playersTable.bio,
      socialLinks: playersTable.socialLinks,
      sportSlug: sportsTable.slug,
      sportName: sportsTable.name,
      schoolName: schoolsTable.name,
      schoolShortName: schoolsTable.shortName,
    })
    .from(playersTable)
    .leftJoin(sportsTable, eq(playersTable.sportId, sportsTable.id))
    .leftJoin(schoolsTable, eq(playersTable.committedSchoolId, schoolsTable.id))
    .where(eq(playersTable.slug, slug))
    .limit(1);

  if (!player) return null;

  const [timeline, commitments] = await Promise.all([
    db
      .select({
        id: playerTimelineTable.id,
        eventType: playerTimelineTable.eventType,
        label: playerTimelineTable.label,
        startDate: playerTimelineTable.startDate,
        endDate: playerTimelineTable.endDate,
        schoolName: schoolsTable.name,
      })
      .from(playerTimelineTable)
      .leftJoin(schoolsTable, eq(playerTimelineTable.schoolId, schoolsTable.id))
      .where(eq(playerTimelineTable.playerId, player.id))
      .orderBy(playerTimelineTable.startDate),
    db
      .select({
        id: playerCommitmentsTable.id,
        committedAt: playerCommitmentsTable.committedAt,
        classYear: playerCommitmentsTable.classYear,
        schoolName: schoolsTable.name,
        sportName: sportsTable.name,
      })
      .from(playerCommitmentsTable)
      .leftJoin(schoolsTable, eq(playerCommitmentsTable.schoolId, schoolsTable.id))
      .leftJoin(sportsTable, eq(playerCommitmentsTable.sportId, sportsTable.id))
      .where(eq(playerCommitmentsTable.playerId, player.id))
      .orderBy(playerCommitmentsTable.committedAt),
  ]);

  return { ...player, timeline, commitments };
}
