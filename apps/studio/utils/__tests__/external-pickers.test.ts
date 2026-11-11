import { parseExternalRef } from "@redshirt-sports/sanity/external-refs";
import { describe, expect, it } from "vitest";

import { gameLabel, gameOptions, playerOptions } from "../external-pickers";

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
