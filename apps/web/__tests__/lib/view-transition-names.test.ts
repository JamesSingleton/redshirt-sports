import {
  articleHeroTransitionName,
  teamHubLogoTransitionName,
} from "@/lib/view-transition-names";

describe("view-transition-names", () => {
  it("builds stable article hero names from slug", () => {
    expect(articleHeroTransitionName("big-game")).toBe("article-hero-big-game");
  });

  it("builds stable team hub logo names from slug", () => {
    expect(teamHubLogoTransitionName("alabama")).toBe("team-hub-logo-alabama");
  });
});
