import { eq } from "drizzle-orm";

import { primaryDb as db } from "../client";
import { getPlayerHeadshotUrl } from "../storage/player-headshots";
import {
  highSchoolsTable,
  playerCollegeAffiliationsTable,
  playerSportProfilesTable,
  playersTable,
  schoolsTable,
  sportsTable,
  transferPortalEntriesTable,
} from "../schema";
import { parsePublicIdFromPath } from "../utils/create-public-id";
import { formatHeightInches } from "../utils/player-profile-path";

export async function getPlayerByPublicId(pathSegment: string) {
  const publicId = parsePublicIdFromPath(pathSegment);

  const [player] = await db
    .select({
      id: playersTable.id,
      publicId: playersTable.publicId,
      firstName: playersTable.firstName,
      lastName: playersTable.lastName,
      displayName: playersTable.displayName,
      dateOfBirth: playersTable.dateOfBirth,
      hometownCity: playersTable.hometownCity,
      hometownState: playersTable.hometownState,
      hometownCountryCode: playersTable.hometownCountryCode,
      height: playersTable.height,
      weight: playersTable.weight,
      headshotBucket: playersTable.headshotBucket,
      headshotPath: playersTable.headshotPath,
      bio: playersTable.bio,
      socialLinks: playersTable.socialLinks,
      highSchoolName: highSchoolsTable.name,
      highSchoolNameOverride: playersTable.highSchoolNameOverride,
    })
    .from(playersTable)
    .leftJoin(highSchoolsTable, eq(playersTable.highSchoolId, highSchoolsTable.id))
    .where(eq(playersTable.publicId, publicId))
    .limit(1);

  if (!player) {
    return null;
  }

  const [sportProfiles, collegeAffiliations, portalHistory] = await Promise.all([
    db
      .select({
        id: playerSportProfilesTable.id,
        sportSlug: sportsTable.slug,
        sportName: sportsTable.name,
        primaryPosition: playerSportProfilesTable.primaryPosition,
        classStanding: playerSportProfilesTable.classStanding,
        isGraduateTransfer: playerSportProfilesTable.isGraduateTransfer,
        jerseyNumber: playerSportProfilesTable.jerseyNumber,
      })
      .from(playerSportProfilesTable)
      .innerJoin(sportsTable, eq(playerSportProfilesTable.sportId, sportsTable.id))
      .where(eq(playerSportProfilesTable.playerId, player.id)),
    db
      .select({
        id: playerCollegeAffiliationsTable.id,
        schoolName: schoolsTable.name,
        schoolShortName: schoolsTable.shortName,
        sportName: sportsTable.name,
        startYear: playerCollegeAffiliationsTable.startYear,
        endYear: playerCollegeAffiliationsTable.endYear,
        isTransfer: playerCollegeAffiliationsTable.isTransfer,
        sortOrder: playerCollegeAffiliationsTable.sortOrder,
      })
      .from(playerCollegeAffiliationsTable)
      .innerJoin(schoolsTable, eq(playerCollegeAffiliationsTable.schoolId, schoolsTable.id))
      .innerJoin(sportsTable, eq(playerCollegeAffiliationsTable.sportId, sportsTable.id))
      .where(eq(playerCollegeAffiliationsTable.playerId, player.id))
      .orderBy(playerCollegeAffiliationsTable.sortOrder),
    db
      .select({
        id: transferPortalEntriesTable.id,
        status: transferPortalEntriesTable.status,
        statusDate: transferPortalEntriesTable.statusDate,
        sequenceInCycle: transferPortalEntriesTable.sequenceInCycle,
        enteredAt: transferPortalEntriesTable.enteredAt,
        fromSchoolName: schoolsTable.name,
      })
      .from(transferPortalEntriesTable)
      .innerJoin(
        schoolsTable,
        eq(transferPortalEntriesTable.fromSchoolId, schoolsTable.id),
      )
      .where(eq(transferPortalEntriesTable.playerId, player.id))
      .orderBy(transferPortalEntriesTable.enteredAt),
  ]);

  return {
    ...player,
    headshotUrl: getPlayerHeadshotUrl(player),
    heightDisplay: formatHeightInches(player.height),
    highSchoolDisplay:
      player.highSchoolName ?? player.highSchoolNameOverride ?? null,
    sportProfiles,
    collegeAffiliations,
    portalHistory,
  };
}

/** @deprecated Use getPlayerByPublicId — path segment may include name prefix + public_id. */
export async function getPlayerBySlug(slug: string) {
  return getPlayerByPublicId(slug);
}
