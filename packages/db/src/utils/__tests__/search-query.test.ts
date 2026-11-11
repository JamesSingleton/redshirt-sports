import { describe, expect, it } from "vitest";

import { likeContains } from "../search-query";

describe("likeContains", () => {
  it("wraps the term for a contains match", () => {
    expect(likeContains("Montana")).toBe("%Montana%");
  });

  it("escapes LIKE wildcards so they match literally", () => {
    expect(likeContains("100%_\\")).toBe("%100\\%\\_\\\\%");
  });
});
