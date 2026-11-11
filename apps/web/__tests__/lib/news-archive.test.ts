import { describe, expect, it, vi } from "vitest";

import {
  archiveCursor,
  formatArchivePublishedAt,
  parseArchiveCursor,
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
      cursor: null,
    });
  });

  it("reads the type as a format value or, for old links, its label", () => {
    expect(parseStoryTypeParam("game-recap")).toBe("game-recap");
    expect(parseStoryTypeParam(" Game Recap ")).toBe("game-recap");
    expect(parseStoryTypeParam("Podcast")).toBe("");
    expect(parseStoryTypeParam(undefined)).toBe("");
  });

  it("reads the cursor on later pages only", () => {
    const after = "n~2026-11-10T18:00:00.000Z~abc-123";
    expect(parseNewsArchiveFilters({ page: "3", after }).cursor).toEqual({
      at: "2026-11-10T18:00:00.000Z",
      id: "abc-123",
    });
    expect(parseNewsArchiveFilters({ after }).cursor).toBeNull();
  });
});

describe("archive cursors", () => {
  const post = { _id: "abc-123", publishedAt: "2026-11-10T18:00:00.000Z" };

  it("round-trips for the sort it was made for", () => {
    for (const sort of ["newest", "oldest"] as const) {
      expect(parseArchiveCursor(archiveCursor(post, sort), sort)).toEqual({
        at: post.publishedAt,
        id: post._id,
      });
    }
  });

  it("is ignored under the other sort", () => {
    expect(
      parseArchiveCursor(archiveCursor(post, "newest"), "oldest"),
    ).toBeNull();
  });

  it("is missing without a publish date", () => {
    expect(archiveCursor(undefined, "newest")).toBeUndefined();
    expect(
      archiveCursor({ _id: "a", publishedAt: null }, "newest"),
    ).toBeUndefined();
  });

  it("rejects malformed values", () => {
    for (const value of [
      undefined,
      "",
      "n",
      "n~not-a-date~abc",
      "n~2026-11-10T18:00:00.000Z~",
      "n~2026-11-10T18:00:00.000Z~bad id",
      "n~2026-11-10T18:00:00.000Z~abc~extra",
    ]) {
      expect(parseArchiveCursor(value, "newest")).toBeNull();
    }
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
