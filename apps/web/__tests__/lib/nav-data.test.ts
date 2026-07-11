import type { QueryNavbarDataResult } from "@redshirt-sports/sanity/types";
import { describe, expect, it } from "vitest";

import type { Top25RankingsData } from "@/components/nav-types";
import { resolveNavbarItems } from "@/lib/nav-data";

const emptyRankings: Top25RankingsData = [];

const sampleNavbar: QueryNavbarDataResult = {
  _id: "navbar",
  logo: null,
  siteTitle: "Redshirt Sports",
  columns: [
    {
      _key: "teams",
      type: "link",
      name: "Teams",
      href: "/college/teams",
      openInNewTab: false,
    },
    {
      _key: "football",
      type: "column",
      title: "Football",
      sportSlug: "football",
      links: [
        {
          _key: "fbs",
          name: "FBS",
          description: null,
          groupLabel: "Browse by Division",
          href: "/college/football/news/fbs",
          openInNewTab: false,
        },
      ],
    },
  ],
};

describe("resolveNavbarItems", () => {
  it("skips links missing name or href", () => {
    const navbar: QueryNavbarDataResult = {
      ...sampleNavbar,
      columns: [
        {
          _key: "recruiting",
          type: "column",
          title: "Recruiting",
          sportSlug: null,
          links: [
            {
              _key: "incomplete",
              name: "",
              description: null,
              groupLabel: null,
              href: "/recruiting",
              openInNewTab: false,
            },
            {
              _key: "visible",
              name: "Players",
              description: null,
              groupLabel: null,
              href: "/recruiting/football/players",
              openInNewTab: false,
            },
          ],
        },
      ],
    };

    const items = resolveNavbarItems(navbar, emptyRankings);
    const column = items[0];

    expect(column?.type).toBe("column");
    if (column?.type === "column") {
      expect(column.sections[0]?.links).toHaveLength(1);
      expect(column.sections[0]?.links[0]?.label).toBe("Players");
    }
  });

  it("groups consecutive links by groupLabel", () => {
    const navbar: QueryNavbarDataResult = {
      ...sampleNavbar,
      columns: [
        {
          _key: "football",
          type: "column",
          title: "Football",
          sportSlug: null,
          links: [
            {
              _key: "fbs",
              name: "FBS",
              description: null,
              groupLabel: "Browse by Division",
              href: "/college/football/news/fbs",
              openInNewTab: false,
            },
            {
              _key: "fcs",
              name: "FCS",
              description: null,
              groupLabel: "Browse by Division",
              href: "/college/football/news/fcs",
              openInNewTab: false,
            },
            {
              _key: "news",
              name: "All News",
              description: null,
              groupLabel: "More",
              href: "/college/football/news",
              openInNewTab: false,
            },
          ],
        },
      ],
    };

    const items = resolveNavbarItems(navbar, emptyRankings);
    const column = items[0];

    expect(column?.type).toBe("column");
    if (column?.type === "column") {
      expect(column.sections).toHaveLength(2);
      expect(column.sections[0]?.groupLabel).toBe("Browse by Division");
      expect(column.sections[0]?.links).toHaveLength(2);
      expect(column.sections[1]?.groupLabel).toBe("More");
    }
  });

  it("injects live ranking links when sportSlug is set", () => {
    const rankings: Top25RankingsData = [
      {
        sport: "football",
        divisions: [{ division: "fbs", week: 1, year: 2025 }],
      },
    ];

    const items = resolveNavbarItems(sampleNavbar, rankings);
    const football = items.find(
      (item: (typeof items)[number]) =>
        item.type === "column" && item.title === "Football",
    );

    expect(football?.type).toBe("column");
    if (football?.type === "column") {
      const rankingsSection = football.sections.find(
        (section: (typeof football.sections)[number]) =>
          section.groupLabel?.includes("Top 25"),
      );
      expect(rankingsSection?.links[0]?.href).toBe(
        "/college/football/rankings/fbs/2025/1",
      );
    }
  });
});
