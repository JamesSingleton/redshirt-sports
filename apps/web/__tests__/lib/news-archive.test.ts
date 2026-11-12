import { describe, expect, it, vi } from "vitest";

import {
  formatArchivePublishedAt,
  parseNewsArchiveFilters,
  parseStoryTypeParam,
  postArchiveKicker,
} from "@/lib/news-archive";

describe("parseNewsArchiveFilters", () => {
  it("parses paging, search, type, and sort", () => {
    expect(
      parseNewsArchiveFilters({
        page: "0",
        q: "  alabama ",
        type: "News",
        sort: "oldest",
      }),
    ).toEqual({
      pageIndex: 1,
      search: "alabama",
      storyType: "news",
      sort: "oldest",
    });
  });

  it("reads the type as a format value or, for old links, its label", () => {
    expect(parseStoryTypeParam("game-recap")).toBe("game-recap");
    expect(parseStoryTypeParam(" Game Recap ")).toBe("game-recap");
    expect(parseStoryTypeParam("Podcast")).toBe("");
    expect(parseStoryTypeParam(undefined)).toBe("");
  });

  it("reads the page number and defaults to newest", () => {
    expect(parseNewsArchiveFilters({ page: "3" })).toEqual({
      pageIndex: 3,
      search: "",
      storyType: "",
      sort: "newest",
    });
    expect(parseNewsArchiveFilters({ page: "abc" }).pageIndex).toBe(1);
  });
});

describe("postArchiveKicker", () => {
  it("prefers tags, then division, then News", () => {
    expect(postArchiveKicker({ tagNames: ["Rankings"] } as never)).toBe(
      "Rankings",
    );
    expect(postArchiveKicker({ divisionLabel: "FBS" } as never)).toBe("FBS");
    expect(postArchiveKicker({} as never)).toBe("News");
  });
});

describe("formatArchivePublishedAt", () => {
  it("uses relative time inside a week", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    vi.setSystemTime(now);
    expect(formatArchivePublishedAt("2026-01-09T12:00:00Z", now)).toBe(
      "1 day ago",
    );
    expect(formatArchivePublishedAt("2026-01-10T06:00:00Z", now)).toBe(
      "6 hours ago",
    );
    vi.useRealTimers();
  });

  it("uses calendar formatting for older posts", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    expect(formatArchivePublishedAt("2025-12-01T12:00:00Z", now)).toBe(
      "12/1/2025",
    );
  });
});
