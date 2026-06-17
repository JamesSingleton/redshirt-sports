/** Matches conference news page GROQ: subgrouping affiliation OR division slug (non-D1). */
export function conferenceMatchesDivisionSegment(
  conference: {
    division: string;
    subgroupings: Array<{
      sport: string;
      subgrouping: string | null;
    }> | null;
  },
  sport: string,
  divisionSegment: string,
): boolean {
  const hasSubgroupingMatch =
    conference.subgroupings?.some(
      (sg) => sg.sport === sport && sg.subgrouping === divisionSegment,
    ) ?? false;

  if (hasSubgroupingMatch) return true;

  const segmentLower = divisionSegment.toLowerCase();
  const isD1Segment = segmentLower === "d1" || segmentLower === "division-i";

  if (isD1Segment) return false;

  return conference.division === divisionSegment;
}
