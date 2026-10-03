import type { SanityImageAsset } from "@redshirt-sports/sanity/types";

import type { Ballot } from "./common";

export type BallotTeam = {
  _id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  image: SanityImageAsset;
};

export type BallotTeamsById = Record<string, BallotTeam>;

export type VoterData = {
  id: string;
  firstName: string;
  lastName: string;
  organization: string | null;
  organizationRole: string | null;
};

export type BallotAndVoterData = {
  votes: Ballot[];
  userData: VoterData | undefined;
};

export type BallotsByVoter = {
  [key: string]: BallotAndVoterData;
};

export type VoterBreakdown = {
  name: string;
  organization: string;
  organizationRole: string;
  /**
   * Team ids in ballot order. Teams live once in {@link BallotTeamsById}:
   * repeating each school object per voter makes the RSC payload huge and
   * overflows the stack when a cached render is serialized.
   */
  ballot: string[];
  matchPercent: number;
};

export type VoterBreakdownData = {
  voters: VoterBreakdown[];
  teams: BallotTeamsById;
};

export type Vote = {
  _id: string;
  image?: SanityImageAsset;
  teamName?: string;
};

export type Voter = {
  name: string;
  organization: string;
  organizationRole?: string;
  ballot: Vote[]; // expected length 25
};

export type VoterBallotWithSchool = {
  id: string;
  userId: string;
  division: string;
  week: number;
  year: number;
  createdAt: Date;
  teamId: string;
  rank: number;
  points: number;
  sportId?: string;
  schoolId?: string;
  schoolName: string;
  schoolShortName: string;
  schoolAbbreviation: string;
  schoolNickname: string;
  schoolImageUrl: string;
};
