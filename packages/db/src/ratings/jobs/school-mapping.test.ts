import { describe, expect, it } from "vitest";

import {
  type CatalogTeam,
  collapseDuplicateTeams,
  planTeamIdMapping,
} from "./school-mapping";
import { nameSimilarity, scoreSchool, stripQualifiers } from "./team-matching";

const FOOTBALL = "football/college-football";
const MBB = "basketball/mens-college-basketball";
const WBB = "basketball/womens-college-basketball";

function team(
  externalId: string,
  location: string,
  mascot: string | null,
  leagues: string[] = [FOOTBALL, MBB, WBB],
): CatalogTeam {
  return {
    externalId,
    location,
    mascot,
    displayName: mascot ? `${location} ${mascot}` : location,
    leagues,
  };
}

function school(
  id: string,
  shortName: string,
  nickname: string | null,
  name: string | null = null,
) {
  return { id, shortName, nickname, name };
}

const plan = (teams: CatalogTeam[], schools: ReturnType<typeof school>[]) =>
  planTeamIdMapping({ teams, schools });

const acceptedPairs = (result: ReturnType<typeof plan>) =>
  Object.fromEntries(result.accepted.map((m) => [m.schoolId, m.externalId]));

describe("name normalization", () => {
  it("reads a leading St. as Saint and a trailing St. as State", () => {
    expect(nameSimilarity("St. Thomas", "Saint Thomas")).toBe(1);
    expect(nameSimilarity("Sam Houston St.", "Sam Houston State")).toBe(1);
    expect(
      nameSimilarity("Minnesota St Moorhead", "Minnesota State Moorhead"),
    ).toBe(1);
    expect(
      nameSimilarity("St. Cloud State", "St. Cloud State University"),
    ).toBe(1);
    expect(nameSimilarity("St. Thomas", "Thomas State")).toBeLessThan(1);
  });

  it("strips state qualifiers in linear time", () => {
    expect(stripQualifiers("Bethany (WV)")).toEqual({
      text: "Bethany  ",
      qualified: true,
    });
    expect(stripQualifiers("Bethany")).toEqual({
      text: "Bethany",
      qualified: false,
    });
    // Inputs that made the old regex backtrack polynomially.
    const started = performance.now();
    stripQualifiers(`${" ".repeat(50_000)}x`);
    stripQualifiers("(".repeat(50_000));
    expect(performance.now() - started).toBeLessThan(200);
  });

  it("expands SE and strips accents", () => {
    expect(nameSimilarity("SE Louisiana", "Southeastern Louisiana")).toBe(1);
    expect(nameSimilarity("San José State", "San Jose State")).toBe(1);
  });

  it("does not count a shared mascot as a shared name", () => {
    const result = scoreSchool(team("1", "Avila University", "Eagles"), {
      id: "emory",
      shortName: "Emory",
      name: "Emory University",
      nickname: "Eagles",
    });
    expect(result.byName).toBe(0);
  });

  it("treats Lady and plural mascots as the same", () => {
    expect(
      scoreSchool(
        team("61", "Georgia", "Lady Bulldogs"),
        school("uga", "Georgia", "Bulldogs"),
      ).mascot,
    ).toBe(true);
    expect(
      scoreSchool(
        team("2264", "Harding", "Bisons"),
        school("h", "Harding", "Bison"),
      ).mascot,
    ).toBe(true);
  });
});

describe("planTeamIdMapping", () => {
  it("tells Miami from Miami (OH) by mascot", () => {
    const result = plan(
      [
        team("2390", "Miami", "Hurricanes"),
        team("193", "Miami (OH)", "RedHawks"),
      ],
      [
        school("um", "Miami", "Hurricanes", "University of Miami"),
        school("muo", "Miami (OH)", "RedHawks", "Miami University (Ohio)"),
      ],
    );
    expect(acceptedPairs(result)).toEqual({ um: "2390", muo: "193" });
  });

  it("maps St. Thomas (MN) to the Tommies, never to the Bobcats", () => {
    const result = plan(
      [
        team("2900", "St. Thomas", "Tommies"),
        team("606", "St. Thomas (FL)", "Bobcats"),
      ],
      [
        school(
          "ust",
          "St. Thomas (MN)",
          "Tommies",
          "University of St. Thomas (Minn.)",
        ),
        school("stu", "St. Thomas", "Bobcats", "St. Thomas University"),
      ],
    );
    expect(acceptedPairs(result)).toEqual({ ust: "2900" });
    // The provider's Tommies are plain "St. Thomas", a better name fit than "St. Thomas (FL)",
    // so the Bobcats go to review with the right team first.
    expect(result.review[0]).toMatchObject({
      schoolId: "stu",
      reason: "better-name-elsewhere",
    });
    expect(result.review[0]?.suggestions[0]?.externalId).toBe("606");
  });

  it("maps UAlbany and SE Louisiana, and leaves Albany State alone", () => {
    const result = plan(
      [
        team("399", "UAlbany", "Great Danes"),
        team("2545", "SE Louisiana", "Lions"),
      ],
      [
        school("ualb", "UAlbany", "Great Danes", "University at Albany"),
        school("asu", "Albany State", "Golden Rams", "Albany State University"),
        school(
          "selu",
          "Southeastern Louisiana",
          "Lions",
          "Southeastern Louisiana University",
        ),
      ],
    );
    expect(acceptedPairs(result)).toEqual({ ualb: "399", selu: "2545" });
    expect(result.review.map((item) => item.schoolId)).toEqual(["asu"]);
  });

  it("keeps Southern, Southern Utah, and Southern Miss apart", () => {
    const result = plan(
      [
        team("2582", "Southern", "Jaguars"),
        team("253", "Southern Utah", "Thunderbirds"),
        team("2572", "Southern Miss", "Golden Eagles"),
      ],
      [
        school("su", "Southern", "Jaguars", "Southern University"),
        school(
          "suu",
          "Southern Utah",
          "Thunderbirds",
          "Southern Utah University",
        ),
        school(
          "usm",
          "Southern Miss",
          "Golden Eagles",
          "University of Southern Mississippi",
        ),
      ],
    );
    expect(acceptedPairs(result)).toEqual({
      su: "2582",
      suu: "253",
      usm: "2572",
    });
  });

  it("does not confuse a state with its State (Delaware vs Delaware State)", () => {
    const result = plan(
      [
        team("48", "Delaware", "Blue Hens"),
        team("2169", "Delaware State", "Hornets"),
      ],
      [
        school("del", "Delaware", "Blue Hens"),
        school("dsu", "Delaware State", "Hornets"),
      ],
    );
    expect(acceptedPairs(result)).toEqual({ del: "48", dsu: "2169" });
  });

  it("sends a match that needs a dropped state qualifier to review", () => {
    // The provider's "Union College" Bulldogs is Union (KY); Union (TN) is also the Bulldogs.
    const result = plan(
      [
        team("2841", "Union College", "Bulldogs"),
        team("237", "Union", "Garnet Chargers"),
      ],
      [school("ut", "Union (TN)", "Bulldogs", "Union University (Tennessee)")],
    );
    expect(result.accepted).toEqual([]);
    expect(result.review[0]).toMatchObject({
      schoolId: "ut",
      reason: "loose-name",
    });
    expect(result.review[0]?.suggestions[0]?.externalId).toBe("2841");
  });

  it("sends a match only the mascot rescued to review", () => {
    // Our nickname is stale: Johnson & Wales (Providence) is now the Griffins.
    const result = plan(
      [
        team("353", "Johnson & Wales", "Griffins"),
        team("109019", "Johnson & Wales-Charlotte", "Wildcats"),
      ],
      [
        school(
          "jwu",
          "Johnson and Wales",
          "Wildcats",
          "Johnson and Wales University",
        ),
      ],
    );
    expect(result.accepted).toEqual([]);
    expect(result.review[0]?.reason).toBe("better-name-elsewhere");
  });

  it("sends two schools that both fit one team to review", () => {
    const result = plan(
      [team("2390", "Miami", "Hurricanes")],
      [school("a", "Miami", "Hurricanes"), school("b", "Miami", "Hurricanes")],
    );
    expect(result.accepted).toEqual([]);
    expect(result.review.map((item) => item.schoolId)).toEqual(["a", "b"]);
  });

  it("never offers a team that is already mapped, or its duplicate", () => {
    const result = planTeamIdMapping({
      teams: [
        team("121", "Bates", "Bobcats", [FOOTBALL, MBB]),
        team("130110", "Bates", "Bobcats", [WBB]),
      ],
      schools: [school("bates-dupe", "Bates", "Bobcats")],
      takenTeamIds: new Set(["130110"]),
    });
    expect(result.accepted).toEqual([]);
    expect(result.review[0]).toMatchObject({
      reason: "no-candidates",
      suggestions: [],
    });
  });

  it("drops placeholder TBA teams and treats all-caps placeholder mascots as none", () => {
    const result = plan(
      [
        { externalId: "1", displayName: "TBA", location: "TBA", mascot: null },
        team("458", "Agnes Scott", "AGNES SCOTT"),
      ],
      [school("as", "Agnes Scott", "Scotties")],
    );
    expect(result.review[0]).toMatchObject({ reason: "no-mascot" });
    expect(result.review[0]?.suggestions.map((s) => s.externalId)).toEqual([
      "458",
    ]);
  });
});

describe("sport-specific provider ids", () => {
  it("takes the football id over a basketball-only id for the same school", () => {
    // 107590 resolves only under women's basketball; 613 is the cross-sport id.
    const result = plan(
      [
        team("107590", "South Dakota School of Mines", "Hardrockers", [WBB]),
        team("613", "South Dakota Mines", "Hardrockers", [FOOTBALL, MBB, WBB]),
      ],
      [
        school(
          "sdsmt",
          "South Dakota Mines",
          "Hardrockers",
          "South Dakota School of Mines",
        ),
      ],
    );
    expect(result.accepted).toEqual([
      expect.objectContaining({ externalId: "613", alternateIds: ["107590"] }),
    ]);
  });

  it("still calls two basketball-only ids too close to pick", () => {
    const result = plan(
      [
        team("451", "Converse College", "Valkyries", [MBB]),
        team("124947", "Converse", "Valkyries", [MBB]),
      ],
      [school("conv", "Converse", "Valkyries")],
    );
    expect(result.accepted).toEqual([]);
  });

  it("does not treat a different mascot as a duplicate", () => {
    const result = plan(
      [
        team("613", "South Dakota Mines", "Hardrockers"),
        team("9", "South Dakota Mines", "Miners", [WBB]),
      ],
      [school("sdsmt", "South Dakota Mines", "Hardrockers")],
    );
    expect(result.accepted.map((m) => m.alternateIds)).toEqual([[]]);
  });
});

describe("collapseDuplicateTeams", () => {
  it("keeps the football id and lists the others", () => {
    const [bates] = collapseDuplicateTeams([
      team("130110", "Bates", "Bobcats", [WBB]),
      team("121", "Bates", "Bobcats", [FOOTBALL, MBB]),
    ]);
    expect(bates).toMatchObject({
      externalId: "121",
      alternateIds: ["130110"],
    });
  });

  it("prefers the id in the most leagues, then the oldest", () => {
    const [babson] = collapseDuplicateTeams([
      team("5308", "Babson", "Beavers", [MBB]),
      team("102", "Babson", "Beavers", [WBB]),
    ]);
    expect(babson).toMatchObject({ externalId: "102", alternateIds: ["5308"] });
    const [elms] = collapseDuplicateTeams([
      team("131686", "Elms", "Blazers", [WBB]),
      team("111948", "Elms", "Blazers", [MBB, WBB]),
    ]);
    expect(elms?.externalId).toBe("111948");
  });

  it("leaves different schools with similar names alone", () => {
    expect(
      collapseDuplicateTeams([
        team("520", "Embry Riddle (FL)", "Eagles"),
        team("111226", "Embry Riddle (AZ)", "Eagles"),
      ]),
    ).toHaveLength(2);
  });
});
