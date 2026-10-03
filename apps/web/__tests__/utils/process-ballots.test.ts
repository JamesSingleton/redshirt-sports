import { client } from "@redshirt-sports/sanity/client";
import type { Mock } from "vitest";

import type { Ballot, BallotsByVoter } from "@/types";
import {
  processVoterBallots,
  transformBallotToTeamIds,
} from "@/utils/process-ballots";

vi.mock("@redshirt-sports/sanity/client", () => ({
  client: {
    fetch: vi.fn(),
  },
}));

const mockFetch = client.fetch as Mock;

function createVote(teamId: string, rank: number): Ballot {
  return {
    id: `entry-${rank}`,
    userId: "user-1",
    division: "fbs",
    week: 1,
    year: 2025,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    teamId,
    rank,
    points: 26 - rank,
  };
}

describe("transformBallotToTeamIds", () => {
  it("maps ballot entries to id and rank pairs", () => {
    const result = transformBallotToTeamIds([
      createVote("team-a", 1),
      createVote("team-b", 2),
    ]);

    expect(result).toEqual([
      { id: "team-a", rank: 1 },
      { id: "team-b", rank: 2 },
    ]);
  });
});

describe("processVoterBallots", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("returns an empty array when there are no ballots", async () => {
    const result = await processVoterBallots({});

    expect(result).toEqual({ voters: [], teams: {} });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns each school once and orders ballot team ids by rank", async () => {
    mockFetch.mockResolvedValue([
      {
        _id: "school-1",
        name: "Alabama",
        shortName: "Alabama",
        abbreviation: "ALA",
        image: { _type: "image", asset: { _ref: "image-1" } },
      },
      {
        _id: "school-2",
        name: "Georgia",
        shortName: "Georgia",
        abbreviation: "UGA",
        image: { _type: "image", asset: { _ref: "image-2" } },
      },
    ]);

    const ballots: BallotsByVoter = {
      voter1: {
        userData: {
          id: "voter1",
          firstName: "Jane",
          lastName: "Doe",
          organization: "ESPN",
          organizationRole: "Analyst",
        },
        votes: [createVote("school-2", 2), createVote("school-1", 1)],
      },
    };

    const result = await processVoterBallots(ballots);

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(result.voters).toHaveLength(1);
    expect(result.voters[0]?.name).toBe("Jane Doe");
    expect(result.voters[0]?.organization).toBe("ESPN");
    expect(result.voters[0]?.ballot).toEqual(["school-1", "school-2"]);
    expect(Object.keys(result.teams)).toEqual(["school-1", "school-2"]);
    expect(result.teams["school-2"]?.name).toBe("Georgia");
  });

  it("skips empty ballot entries and processes multiple voters", async () => {
    mockFetch.mockResolvedValue([
      {
        _id: "school-1",
        name: "Alabama",
        shortName: "Alabama",
        abbreviation: "ALA",
        image: { _type: "image", asset: { _ref: "image-1" } },
      },
      {
        _id: "school-2",
        name: "Georgia",
        shortName: "Georgia",
        abbreviation: "UGA",
        image: { _type: "image", asset: { _ref: "image-2" } },
      },
    ]);

    const ballots: BallotsByVoter = {
      empty: undefined as unknown as BallotsByVoter[string],
      voter1: {
        userData: {
          id: "voter1",
          firstName: "Jane",
          lastName: "Doe",
          organization: "ESPN",
          organizationRole: "Analyst",
        },
        votes: [createVote("school-1", 1)],
      },
      voter2: {
        userData: {
          id: "voter2",
          firstName: "John",
          lastName: "Smith",
          organization: "CBS",
          organizationRole: "Writer",
        },
        votes: [createVote("school-2", 1)],
      },
    };

    const result = await processVoterBallots(ballots);

    expect(result.voters).toHaveLength(2);
    expect(result.voters.map((voter) => voter.name)).toEqual([
      "Jane Doe",
      "John Smith",
    ]);
  });

  it("filters out votes for schools that were not returned from Sanity", async () => {
    mockFetch.mockResolvedValue([
      {
        _id: "school-1",
        name: "Alabama",
        shortName: "Alabama",
        abbreviation: "ALA",
        image: { _type: "image", asset: { _ref: "image-1" } },
      },
    ]);

    const ballots: BallotsByVoter = {
      voter1: {
        userData: {
          id: "voter1",
          firstName: "Jane",
          lastName: "Doe",
          organization: "ESPN",
          organizationRole: "Analyst",
        },
        votes: [createVote("school-1", 1), createVote("missing-school", 2)],
      },
    };

    const result = await processVoterBallots(ballots);

    expect(result.voters[0]?.ballot).toEqual(["school-1"]);
    expect(result.teams["missing-school"]).toBeUndefined();
  });

  it("skips voters without userData and defaults empty org fields", async () => {
    mockFetch.mockResolvedValue([
      {
        _id: "school-1",
        name: "Alabama",
        shortName: "Alabama",
        abbreviation: "ALA",
        image: { _type: "image", asset: { _ref: "image-1" } },
      },
    ]);

    const ballots: BallotsByVoter = {
      noUser: {
        userData: undefined as unknown as BallotsByVoter[string]["userData"],
        votes: [createVote("school-1", 1)],
      },
      voter1: {
        userData: {
          id: "voter1",
          firstName: "Jane",
          lastName: "Doe",
          organization: null as unknown as string,
          organizationRole: null as unknown as string,
        },
        votes: [createVote("school-1", 1)],
      },
    };

    const result = await processVoterBallots(ballots);

    expect(result.voters).toHaveLength(1);
    expect(result.voters[0]).toMatchObject({
      name: "Jane Doe",
      organization: "",
      organizationRole: "",
    });
  });
});
