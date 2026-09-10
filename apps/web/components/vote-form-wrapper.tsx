"use client";

import { analytics } from "@redshirt-sports/analytics";
import type { SchoolsBySportAndSubgroupingStringQueryResult } from "@redshirt-sports/sanity/types";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import { useRef } from "react";

import type { VoterBallotWithSchool } from "@/types/votes";
import { CreateTop25, EditTop25, type Top25FormRef } from "./forms/top-25";
import CustomImage from "./sanity-image";

type CreateVoteFormWrapperProps = {
  schools: SchoolsBySportAndSubgroupingStringQueryResult;
  previousBallot?: VoterBallotWithSchool[];
};

type EditVoteFormWrapperProps = {
  schools: SchoolsBySportAndSubgroupingStringQueryResult;
  currentBallot?: Array<{ teamId: string; rank: number }>;
};

export function CreateVoteFormWrapper({
  schools,
  previousBallot,
}: CreateVoteFormWrapperProps) {
  const formRef = useRef<Top25FormRef>(null);
  const showPreviousBallot = previousBallot && previousBallot.length > 0;

  const handlePopulateForm = () => {
    formRef.current?.populateWithPreviousBallot();
    analytics?.capture("previous_ballot_populated", {
      // Button is only rendered when previousBallot is non-empty.
      previous_ballot_count: previousBallot!.length,
    });
  };

  return (
    <div className="flex flex-col gap-6 pt-4 lg:flex-row">
      {showPreviousBallot ? (
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Previous Ballot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePopulateForm}
              className="mb-4 w-full"
            >
              Use Previous Ballot
            </Button>
            <p className="text-muted-foreground mb-4 text-center text-sm">
              Click to populate the form with your previous ballot selections
            </p>
            {previousBallot.map((team) => (
              <div key={team.teamId} className="flex items-center space-x-2">
                <span className="w-8 text-right font-bold">{team.rank}.</span>
                <div className="flex grow items-center space-x-2">
                  <CustomImage
                    image={team.schoolImageUrl}
                    width={32}
                    height={32}
                    className="size-8"
                  />
                  <span>{team.schoolShortName}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>New Ballot Submission</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTop25
            ref={formRef}
            schools={schools}
            previousBallot={previousBallot}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function EditVoteFormWrapper({
  schools,
  currentBallot,
}: EditVoteFormWrapperProps) {
  return (
    <div className="flex flex-col gap-6 pt-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit Ballot</CardTitle>
        </CardHeader>
        <CardContent>
          <EditTop25 schools={schools} currentBallot={currentBallot} />
        </CardContent>
      </Card>
    </div>
  );
}

export default CreateVoteFormWrapper;
