import { describe, expect, it } from "vitest";

import {
  groupTeamsByLetter,
  mapTeamDirectorySchool,
} from "@/lib/team-directory";

describe("team directory", () => {
  it("maps school display fields and search haystack", () => {
    expect(
      mapTeamDirectorySchool({
        _id: "2",
        name: "University of Example",
        shortName: null,
        nickname: "Eagles",
        slug: "example-eagles",
      }),
    ).toEqual({
      _id: "2",
      name: "University of Example",
      shortName: null,
      nickname: "Eagles",
      slug: "example-eagles",
      image: undefined,
      sortName: "University of Example",
      searchHaystack: "university of example eagles",
    });

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
      searchHaystack: "abilene christian university abilene christian wildcats",
    });
  });

  it("groups teams by first letter with non-alpha bucket", () => {
    const team = (sortName: string) =>
      mapTeamDirectorySchool({
        _id: sortName,
        name: sortName,
        shortName: sortName,
        nickname: null,
        slug: `${sortName}-slug`,
      })!;
    const groups = groupTeamsByLetter([
      team("Beta"),
      team("Alpha"),
      team("9ers"),
    ]);
    expect(groups.map((g) => g.letter)).toEqual(["#", "A", "B"]);
  });

  it("drops schools without slugs in directory mapping", () => {
    expect(
      mapTeamDirectorySchool({
        _id: "1",
        name: "No Slug U",
        shortName: "No Slug",
        nickname: null,
        slug: "",
      }),
    ).toBeNull();
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
