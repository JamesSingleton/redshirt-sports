import { describe, expect, it } from "vitest";

import {
  isValidPosition,
  PLAYER_CLASS_CODES,
  playerClassLabel,
} from "./constants";
import {
  normalizePlayerName,
  parsePlayerSlugId,
  playerPath,
  playerSlug,
} from "./player-url";

describe("playerSlug", () => {
  it.each([
    [["Jalen", "Brooks", null], "jalen-brooks"],
    [["D'Andre", "Swift", "Jr."], "dandre-swift-jr"],
    [["José", "Peña-Ruiz", null], "jose-pena-ruiz"],
    [["L.J.", "Cason", null], "lj-cason"],
    [["  ", "", null], "player"],
  ] as const)("%j -> %s", ([first, last, suffix], expected) => {
    expect(playerSlug(first, last, suffix)).toBe(expected);
  });
});

describe("normalizePlayerName", () => {
  it("strips accents, punctuation and case", () => {
    expect(normalizePlayerName("José", "Peña-Ruiz", "Jr.")).toBe(
      "jose pena ruiz jr",
    );
  });
});

describe("playerPath / parsePlayerSlugId", () => {
  it("round-trips", () => {
    const path = playerPath({ id: 147731, slug: "tavari-johnson" });
    expect(path).toBe("/players/tavari-johnson-147731");
    expect(parsePlayerSlugId("tavari-johnson-147731")).toEqual({
      slug: "tavari-johnson",
      id: 147731,
    });
  });

  it.each([
    "147731",
    "tavari-johnson",
    "tavari-johnson-",
    "tavari-johnson-99999",
    "tavari-johnson-0147731",
    "Tavari-Johnson-147731",
    "tavari--johnson-147731",
    "tavari-johnson-147731-",
    "tavari-johnson-1477310000000000000000",
    "../etc/passwd-147731",
    "-147731",
    `${"a".repeat(200)}-147731`,
    "",
  ])("rejects %j", (segment) => {
    expect(parsePlayerSlugId(segment)).toBeNull();
  });

  it("stays fast on hostile input", () => {
    const hostile = [
      "-".repeat(100_000),
      `a${"-a".repeat(50_000)}!`,
      `${"1-".repeat(50_000)}x`,
    ];
    const started = performance.now();
    for (const input of hostile) {
      parsePlayerSlugId(input);
      playerSlug(input, input, input);
      normalizePlayerName(input);
    }
    expect(performance.now() - started).toBeLessThan(50);
    expect(playerSlug("-".repeat(100_000), "")).toBe("player");
  });
});

describe("classes and positions", () => {
  it("lists the nine class codes in order", () => {
    expect(PLAYER_CLASS_CODES).toEqual([
      "FR",
      "RS-FR",
      "SO",
      "RS-SO",
      "JR",
      "RS-JR",
      "SR",
      "RS-SR",
      "GR",
    ]);
    expect(playerClassLabel("RS-SO")).toBe("Redshirt sophomore");
    expect(playerClassLabel("XX")).toBeNull();
  });

  it("validates positions per sport", () => {
    expect(isValidPosition("football", "QB")).toBe(true);
    expect(isValidPosition("football", "PG")).toBe(false);
    expect(isValidPosition("womens-basketball", "PG")).toBe(true);
    expect(isValidPosition("lacrosse", "QB")).toBe(false);
  });
});
