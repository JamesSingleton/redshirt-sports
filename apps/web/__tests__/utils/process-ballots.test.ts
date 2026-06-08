import { client } from "@redshirt-sports/sanity/client";

import type { BallotsByVoter } from "@/types";
import {
  processVoterBallots,
  transformBallotToTeamIds,
} from "@/utils/process-ballots";

vi.mock("@redshirt-sports/sanity/client", () => ({
  client: {
    fetch: vi.fn(),
  },
}));

const mockFetch = vi.mocked(client.fetch);

describe("transformBallotToTeamIds", () => {
  it("maps ballot entries to id and rank pairs", () => {
    const result = transformBallotToTeamIds([
      { teamId: "team-a", rank: 1 },
      { teamId: "team-b", rank: 2 },
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

    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("enriches ballots with school data and sorts votes by rank", async () => {
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
        votes: [
          { teamId: "school-2", rank: 2 },
          { teamId: "school-1", rank: 1 },
        ],
      },
    };

    const result = await processVoterBallots(ballots);

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Jane Doe");
    expect(result[0]?.organization).toBe("ESPN");
    expect(result[0]?.ballot.map((vote) => vote.name)).toEqual([
      "Alabama",
      "Georgia",
    ]);
    expect(result[0]?.ballot.map((vote) => vote._order)).toEqual([1, 2]);
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
        votes: [{ teamId: "school-1", rank: 1 }],
      },
      voter2: {
        userData: {
          id: "voter2",
          firstName: "John",
          lastName: "Smith",
          organization: "CBS",
          organizationRole: "Writer",
        },
        votes: [{ teamId: "school-2", rank: 1 }],
      },
    };

    const result = await processVoterBallots(ballots);

    expect(result).toHaveLength(2);
    expect(result.map((voter) => voter.name)).toEqual([
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
        votes: [
          { teamId: "school-1", rank: 1 },
          { teamId: "missing-school", rank: 2 },
        ],
      },
    };

    const result = await processVoterBallots(ballots);

    expect(result[0]?.ballot).toHaveLength(1);
    expect(result[0]?.ballot[0]?.name).toBe("Alabama");
  });
});
