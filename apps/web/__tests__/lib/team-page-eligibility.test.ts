import { MIN_TEAM_PAGE_POSTS } from "@redshirt-sports/sanity/queries";

import { isTeamPageEligible } from "@/lib/team-page-eligibility";

describe("isTeamPageEligible", () => {
  it("allows schools with at least one post", () => {
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

  it("rejects schools with no posts and no rankings", () => {
    expect(
      isTeamPageEligible({
        postCount: 0,
        hasRankings: false,
      }),
    ).toBe(false);
  });
});
