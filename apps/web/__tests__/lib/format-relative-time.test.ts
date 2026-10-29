import { afterEach, describe, expect, it, vi } from "vitest";

import { formatRelativeTime } from "@/lib/format-relative-time";

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("drops the about qualifier from hour, month, and future distances", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T12:00:00Z"));

    expect(formatRelativeTime(new Date("2026-01-10T06:00:00Z"))).toBe(
      "6 hours ago",
    );
    expect(formatRelativeTime(new Date("2026-01-08T12:00:00Z"))).toBe(
      "2 days ago",
    );
    expect(formatRelativeTime(new Date("2025-11-20T12:00:00Z"))).toBe(
      "2 months ago",
    );
    expect(formatRelativeTime(new Date("2026-01-10T18:00:00Z"))).toBe(
      "in 6 hours",
    );
  });
});
