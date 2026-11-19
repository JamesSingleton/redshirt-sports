"use client";

import type { SchoolsBySportAndSubgroupingStringQueryResult } from "@redshirt-sports/sanity/types";

import type { VoterBallotWithSchool } from "@/types/votes";
import { CreateTop25, EditTop25 } from "./forms/top-25";

type CreateVoteFormWrapperProps = {
  schools: SchoolsBySportAndSubgroupingStringQueryResult;
  previousBallot?: VoterBallotWithSchool[];
};

type EditVoteFormWrapperProps = {
  schools: SchoolsBySportAndSubgroupingStringQueryResult;
  currentBallot?: Array<{ teamId: string; rank: number }>;
};

/** A new ballot. Last week's ballot shows inline and can be copied in. */
export function CreateVoteFormWrapper({
  schools,
  previousBallot,
}: CreateVoteFormWrapperProps) {
  return <CreateTop25 schools={schools} previousBallot={previousBallot} />;
}

/** This week's ballot, already submitted, opened to change it. */
export function EditVoteFormWrapper({
  schools,
  currentBallot,
}: EditVoteFormWrapperProps) {
  return <EditTop25 schools={schools} currentBallot={currentBallot} />;
}

export default CreateVoteFormWrapper;
