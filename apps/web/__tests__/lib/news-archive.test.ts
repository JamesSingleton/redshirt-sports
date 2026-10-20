import { describe, expect, it, vi } from "vitest";

import {
  formatArchivePublishedAt,
  parseNewsArchiveFilters,
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
      storyType: "News",
      sort: "oldest",
    });
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
    expect(formatArchivePublishedAt("2026-01-09T12:00:00Z", now)).toMatch(
      /ago$/,
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
