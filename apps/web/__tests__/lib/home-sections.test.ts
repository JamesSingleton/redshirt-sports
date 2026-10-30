import {
  buildHomeCoverageSections,
  HOME_COVERAGE_SECTIONS,
  type HomeCoveragePost,
  postMatchesHomeSection,
} from "@/lib/home-sections";

function post(
  id: string,
  fields: Omit<HomeCoveragePost, "_id"> = {},
): HomeCoveragePost {
  return { _id: id, ...fields };
}

describe("postMatchesHomeSection", () => {
  const fcs = HOME_COVERAGE_SECTIONS[0];
  const womens = HOME_COVERAGE_SECTIONS.find(
    (section) => section.id === "womens-basketball",
  );

  it("matches a sport-wide section and either scope slug", () => {
    expect(womens).toBeDefined();
    expect(
      postMatchesHomeSection(
        post("w", { sportSlug: "womens-basketball" }),
        womens!,
      ),
    ).toBe(true);
    expect(
      postMatchesHomeSection(
        post("sub", { sportSlug: "football", subgroupingSlug: "fcs" }),
        fcs,
      ),
    ).toBe(true);
    expect(
      postMatchesHomeSection(
        post("div", {
          sportSlug: "football",
          subgroupingSlug: "fbs",
          divisionSlug: "fcs",
        }),
        fcs,
      ),
    ).toBe(true);
  });

  it("rejects a different sport or a scope that matches neither slug", () => {
    expect(
      postMatchesHomeSection(
        post("hoops", { sportSlug: "mens-basketball", subgroupingSlug: "fcs" }),
        fcs,
      ),
    ).toBe(false);
    expect(
      postMatchesHomeSection(
        post("fbs", { sportSlug: "football", subgroupingSlug: "fbs" }),
        fcs,
      ),
    ).toBe(false);
  });
});

describe("buildHomeCoverageSections", () => {
  it("names the lower football divisions and skips stories already on the page", () => {
    expect(
      HOME_COVERAGE_SECTIONS.find((section) => section.id === "d2")?.title,
    ).toBe("Division II Football");
    expect(
      HOME_COVERAGE_SECTIONS.find((section) => section.id === "d3")?.title,
    ).toBe("Division III Football");

    const reserved = Array.from({ length: 12 }, (_, index) =>
      post(`reserved-${index}`, {
        sportSlug: "football",
        subgroupingSlug: "fcs",
      }),
    );
    const fcs = ["a", "b", "c", "d", "e"].map((id) =>
      post(id, { sportSlug: "football", subgroupingSlug: "fcs" }),
    );
    const other = post("hoops", {
      sportSlug: "mens-basketball",
      subgroupingSlug: "mid-major",
    });

    const sections = buildHomeCoverageSections([...reserved, ...fcs, other]);
    const fcsSection = sections.find((section) => section.id === "fcs");

    expect(fcsSection?.posts.map((item) => item._id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(sections.some((section) => section.id === "mid-major")).toBe(false);
  });

  it("returns nothing when there are no posts", () => {
    expect(buildHomeCoverageSections([])).toEqual([]);
  });

  it("gives a short list back so a later section can use those stories", () => {
    const dual = ["1", "2", "3"].map((id) =>
      post(id, {
        sportSlug: "football",
        subgroupingSlug: "fcs",
        divisionSlug: "d2",
      }),
    );
    const pure = post("4", { sportSlug: "football", divisionSlug: "d2" });

    const sections = buildHomeCoverageSections([...dual, pure], {
      reservedCount: 0,
      perSection: 4,
      minimum: 4,
    });

    expect(sections.map((section) => section.id)).toEqual(["d2"]);
    expect(sections[0]?.posts.map((item) => item._id)).toEqual([
      "1",
      "2",
      "3",
      "4",
    ]);
  });

  it("keeps an earlier section once it has enough stories", () => {
    const posts = ["1", "2", "3"].map((id) =>
      post(id, {
        sportSlug: "football",
        subgroupingSlug: "fcs",
        divisionSlug: "d2",
      }),
    );

    const sections = buildHomeCoverageSections(posts, {
      reservedCount: 0,
      perSection: 4,
      minimum: 3,
    });

    expect(sections.map((section) => section.id)).toEqual(["fcs"]);
  });
});
