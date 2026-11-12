import { evaluate, parse } from "groq-js";
import { describe, expect, it } from "vitest";

import { authorsForUser, isAdministrator } from "../current-user";

/** A client whose `fetch` runs the query with groq-js over `dataset`. */
const clientFor = (dataset: Record<string, unknown>[]) => ({
  fetch: async (query: string, params?: Record<string, unknown>) =>
    (await evaluate(parse(query), { dataset, params })).get(),
});

const authors = [
  {
    _id: "james",
    _type: "author",
    name: "James Singleton",
    studioUserId: "u-james",
  },
  { _id: "omar", _type: "author", name: "Omar-Rashon Borja" },
  { _id: "former", _type: "author", name: "Pat Former", archived: true },
  {
    _id: "drafts.omar",
    _type: "author",
    name: "Omar-Rashon Borja",
    studioUserId: "u-other",
  },
];

describe("authorsForUser", () => {
  it("uses the author linked to the Studio account", async () => {
    await expect(
      authorsForUser(
        { id: "u-james", name: "Someone Else" },
        clientFor(authors) as never,
      ),
    ).resolves.toEqual([{ _type: "reference", _ref: "james", _key: "james" }]);
  });

  it("falls back to an exact name match when no author is linked", async () => {
    await expect(
      authorsForUser(
        { id: "u-omar", name: " omar-rashon borja " },
        clientFor(authors) as never,
      ),
    ).resolves.toEqual([{ _type: "reference", _ref: "omar", _key: "omar" }]);
  });

  it("doesn't guess by name once the account is linked elsewhere", async () => {
    await expect(
      authorsForUser(
        { id: "u-james", name: "Omar-Rashon Borja" },
        clientFor(authors) as never,
      ),
    ).resolves.toEqual([{ _type: "reference", _ref: "james", _key: "james" }]);
  });

  it("starts empty for archived authors, unknown users, and no user", async () => {
    const client = clientFor(authors) as never;
    await expect(
      authorsForUser({ id: "u-pat", name: "Pat Former" }, client),
    ).resolves.toEqual([]);
    await expect(
      authorsForUser({ id: "u-new", name: "New Writer" }, client),
    ).resolves.toEqual([]);
    await expect(authorsForUser(null, client)).resolves.toEqual([]);
  });
});

describe("isAdministrator", () => {
  it("checks for the administrator role", () => {
    expect(
      isAdministrator({
        roles: [{ name: "administrator", title: "Administrator" }],
      }),
    ).toBe(true);
    expect(
      isAdministrator({ roles: [{ name: "editor", title: "Editor" }] }),
    ).toBe(false);
    expect(isAdministrator(null)).toBe(false);
  });
});
