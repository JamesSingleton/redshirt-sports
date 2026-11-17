import { parseExternalRef } from "@redshirt-sports/sanity/external-refs";
import { describe, expect, it } from "vitest";

import {
  gameLabel,
  gameOptions,
  playerOptions,
  portalPlayerOptions,
} from "../external-pickers";

describe("gameOptions", () => {
  const game = {
    provider: "espn" as const,
    id: "401547",
    sport: "football",
    homeName: "Montana State",
    awayName: "Montana",
    neutralSite: false,
    kickoffAt: "2025-11-22T19:00:00.000Z",
  };

  it("labels away at home with the Eastern date", () => {
    expect(gameLabel(game)).toBe("Montana at Montana State · Nov 22, 2025");
    expect(gameLabel({ ...game, neutralSite: true, kickoffAt: null })).toBe(
      "Montana vs. Montana State",
    );
  });

  it("stores the provider id with a label snapshot", () => {
    const [option] = gameOptions([game]);
    expect(parseExternalRef(option.value)).toEqual({
      provider: "espn",
      id: "401547",
      label: "Montana at Montana State · Nov 22, 2025",
    });
  });
});

describe("playerOptions", () => {
  it("keeps college players only and reads the ESPN id", () => {
    const options = playerOptions({
      results: [
        {
          type: "team",
          contents: [{ displayName: "Montana", uid: "s:20~l:23~t:149" }],
        },
        {
          type: "player",
          contents: [
            {
              displayName: "Keali'i Ah Yat",
              subtitle: "Montana Grizzlies",
              uid: "s:20~l:23~a:5081234",
            },
            {
              displayName: "Pro Player",
              subtitle: "Saints",
              uid: "s:20~l:28~a:111",
            },
            { displayName: "No Team", uid: "s:40~l:41~a:222" },
            { uid: "s:20~l:23~a:333" },
            { displayName: "Bad uid", uid: "garbage" },
          ],
        },
      ],
    });
    expect(options.map((o) => o.label)).toEqual([
      "Keali'i Ah Yat · Montana Grizzlies (College Football)",
      "No Team (Men's College Basketball)",
    ]);
    expect(parseExternalRef(options[0].value)).toEqual({
      provider: "espn",
      id: "5081234",
      label: "Keali'i Ah Yat · Montana Grizzlies",
    });
    expect(playerOptions({})).toEqual([]);
  });
});

describe("portalPlayerOptions", () => {
  it("stores our player's id and name, and says where the article will show", () => {
    const options = portalPlayerOptions([
      {
        id: 100007,
        slug: "darnell-okafor",
        firstName: "Darnell",
        lastName: "Okafor",
        suffix: "Jr.",
        sportSlug: "football",
        position: "QB",
      },
      {
        id: 100008,
        slug: "ann-lee",
        firstName: "Ann",
        lastName: "Lee",
        suffix: null,
        sportSlug: "lacrosse",
        position: null,
      },
      {
        id: 100009,
        slug: "bo-cole",
        firstName: "Bo",
        lastName: "Cole",
        suffix: null,
        sportSlug: null,
        position: null,
      },
    ]);
    expect(options.map((option) => option.label)).toEqual([
      "Darnell Okafor Jr. · QB, Football (Redshirt player page)",
      "Ann Lee (Redshirt player page)",
      "Bo Cole (Redshirt player page)",
    ]);
    expect(parseExternalRef(options[0]!.value)).toEqual({
      provider: "redshirt",
      id: "100007",
      label: "Darnell Okafor Jr.",
    });
    expect(portalPlayerOptions([])).toEqual([]);
  });
});
