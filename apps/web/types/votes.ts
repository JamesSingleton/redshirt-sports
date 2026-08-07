import type { SanityImageAsset } from "@redshirt-sports/sanity/types";

import type { Ballot } from "./common";

export type VoteWithExtraData = {
  name: string;
  shortName: string;
  abbreviation: string;
  image: SanityImageAsset;
  _id: string;
  _order: number;
};

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
  ballot: VoteWithExtraData[];
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
