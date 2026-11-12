import { describe, expect, it, vi } from "vitest";

import { uniqueName } from "../unique-name";

function contextWith(
  document: Record<string, unknown>,
  existing: string | null,
) {
  const fetch = vi.fn().mockResolvedValue(existing);
  return {
    fetch,
    context: {
      document,
      getClient: () => ({ fetch }),
    } as never,
  };
}

describe("uniqueName", () => {
  const validate = uniqueName({
    type: "school",
    label: "school",
    against: ["name", "shortName"],
  });

  it("blocks a name another school already uses", async () => {
    const { context, fetch } = contextWith(
      { _id: "drafts.new-school" },
      "University of Montana",
    );

    await expect(validate(" Montana ", context)).resolves.toBe(
      'A school named "University of Montana" already uses this. Open it instead of creating a second one.',
    );
    const [query, params] = fetch.mock.calls[0]!;
    expect(query).toContain(
      "lower(name) == lower($name) || lower(shortName) == lower($name)",
    );
    // The document's own draft and published copies don't count.
    expect(params).toMatchObject({
      type: "school",
      id: "new-school",
      name: "Montana",
    });
  });

  it("passes unique and empty names", async () => {
    const { context, fetch } = contextWith({ _id: "school-1" }, null);
    await expect(validate("Montana", context)).resolves.toBe(true);
    await expect(validate("  ", context)).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("only compares within the shared reference when one is given", async () => {
    const byDivision = uniqueName({
      type: "conference",
      label: "conference in this division",
      against: ["shortName"],
      sameField: "primaryClassification",
    });

    const unscoped = contextWith({ _id: "c1" }, "Mid-American Conference");
    await expect(byDivision("MAC", unscoped.context)).resolves.toBe(true);
    expect(unscoped.fetch).not.toHaveBeenCalled();

    const scoped = contextWith(
      { _id: "c1", primaryClassification: { _ref: "d3" } },
      null,
    );
    await expect(byDivision("MAC", scoped.context)).resolves.toBe(true);
    const [query, params] = scoped.fetch.mock.calls[0]!;
    expect(query).toContain("primaryClassification._ref == $scopeRef");
    expect(params).toMatchObject({ scopeRef: "d3" });
  });
});
