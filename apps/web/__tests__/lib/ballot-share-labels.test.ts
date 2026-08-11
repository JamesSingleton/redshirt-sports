import {
  ballotShareFilename,
  ballotShareHeadline,
  ballotShareTweetText,
  confirmationTitle,
  divisionLongName,
  divisionShortName,
  sportDisplayName,
} from "@/lib/ballot-share-labels";

describe("ballot-share-labels", () => {
  it("maps known sport and division names", () => {
    expect(sportDisplayName("football")).toBe("College Football");
    expect(divisionShortName("fcs")).toBe("FCS");
    expect(divisionLongName("fcs")).toContain("FCS");
    expect(confirmationTitle("football", "fcs")).toContain("FCS");
  });

  it("falls back to raw slugs for unknown values", () => {
    expect(sportDisplayName("custom")).toBe("custom");
    expect(divisionShortName("custom")).toBe("custom");
    expect(divisionLongName("custom")).toBe("custom");
  });

  it("builds share copy and filenames for regular, preseason, and final weeks", () => {
    expect(ballotShareHeadline({ division: "fbs", week: 5 })).toBe(
      "My FBS Top 25 — Week 5",
    );
    expect(ballotShareTweetText({ division: "fcs", week: 0 })).toContain(
      "Preseason",
    );
    expect(ballotShareFilename({ division: "fbs", week: 5 })).toBe(
      "redshirt-top25-fbs-week5.png",
    );
    expect(ballotShareFilename({ division: "fbs", week: 0 })).toBe(
      "redshirt-top25-fbs-preseason.png",
    );
    expect(ballotShareFilename({ division: "fbs", week: 999 })).toBe(
      "redshirt-top25-fbs-final-rankings.png",
    );
  });
});
