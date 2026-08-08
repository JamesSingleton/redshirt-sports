import { MIN_TEAM_PAGE_POSTS } from "@redshirt-sports/sanity/queries";

import { isTeamPageEligible } from "@/lib/team-page-eligibility";

describe("isTeamPageEligible", () => {
  it("allows schools with enough posts", () => {
    expect(
      isTeamPageEligible({
        postCount: MIN_TEAM_PAGE_POSTS,
        hasRankings: false,
      }),
    ).toBe(true);
  });

  it("allows rankings-only schools below the post threshold", () => {
    expect(
      isTeamPageEligible({
        postCount: 0,
        hasRankings: true,
      }),
    ).toBe(true);
  });

  it("rejects schools with neither enough posts nor rankings", () => {
    expect(
      isTeamPageEligible({
        postCount: MIN_TEAM_PAGE_POSTS - 1,
        hasRankings: false,
      }),
    ).toBe(false);
  });
});
