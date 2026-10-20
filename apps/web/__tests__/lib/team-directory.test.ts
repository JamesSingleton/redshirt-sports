import { describe, expect, it } from "vitest";

import { mapTeamDirectorySchool } from "@/lib/team-directory";

describe("team directory", () => {
  it("maps school display fields and search haystack", () => {
    expect(
      mapTeamDirectorySchool({
        _id: "1",
        name: "Abilene Christian University",
        shortName: "Abilene Christian",
        nickname: "Wildcats",
        slug: "abilene-christian-wildcats",
        image: null,
      }),
    ).toEqual({
      _id: "1",
      name: "Abilene Christian University",
      shortName: "Abilene Christian",
      nickname: "Wildcats",
      slug: "abilene-christian-wildcats",
      image: null,
      sortName: "Abilene Christian",
      searchHaystack:
        "abilene christian university abilene christian wildcats",
    });
  });

  it("drops schools without slugs", () => {
    expect(
      mapTeamDirectorySchool({
        _id: "1",
        name: "Test U",
        shortName: "Test",
        nickname: "Cats",
        slug: null,
      }),
    ).toBeNull();
  });
});
