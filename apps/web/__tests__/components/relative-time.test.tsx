import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ArchivePublishedTime } from "@/components/news/archive-published-time";
import { RelativeTime } from "@/components/relative-time";

describe("RelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("prerenders a calendar date without reading the current time", () => {
    const now = vi.spyOn(Date, "now");
    const html = renderToString(
      <RelativeTime dateString="2026-01-10T06:00:00.000Z" />,
    );

    expect(now).not.toHaveBeenCalled();
    expect(html).toContain("Jan 9, 2026");
    expect(html).not.toContain("ago");
  });

  it("shows the distance from now after mount", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T12:00:00Z"));

    render(<RelativeTime dateString="2026-01-10T06:00:00.000Z" />);

    expect(screen.getByRole("time")).toHaveTextContent("6 hours ago");
  });
});

describe("ArchivePublishedTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("prerenders the Phoenix calendar date", () => {
    const now = vi.spyOn(Date, "now");
    const html = renderToString(
      <ArchivePublishedTime dateString="2025-12-01T12:00:00.000Z" />,
    );

    expect(now).not.toHaveBeenCalled();
    expect(html).toContain("12/1/2025");
  });

  it("uses a relative label for a post from the last week", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T12:00:00Z"));

    render(<ArchivePublishedTime dateString="2026-01-10T06:00:00.000Z" />);

    expect(screen.getByRole("time")).toHaveTextContent("6 hours ago");
  });
});
