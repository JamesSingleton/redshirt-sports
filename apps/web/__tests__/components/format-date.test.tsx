import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";

import FormatDate from "@/components/format-date";

const PUBLISHED = "2026-01-15T20:00:00.000Z";
const publishedMs = Date.parse(PUBLISHED);

describe("FormatDate", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a time element with a Phoenix timezone formatted date", () => {
    render(<FormatDate dateString={PUBLISHED} />);

    const time = screen.getByRole("time");
    expect(time).toHaveAttribute("datetime", PUBLISHED);
    expect(time).toHaveTextContent("Jan 15, 2026");
  });

  it("applies a custom className", () => {
    render(<FormatDate dateString={PUBLISHED} className="text-sm" />);

    expect(screen.getByRole("time")).toHaveClass("text-sm");
  });

  it("shows minutes since publishing within the first hour", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(publishedMs + 12 * 60_000);

    render(<FormatDate dateString={PUBLISHED} />);

    const time = screen.getByRole("time");
    expect(time).toHaveTextContent("12 min ago");
    expect(time).toHaveAttribute("title", "Jan 15, 2026");
  });

  it("shows hours since publishing until 24 hours have passed", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(publishedMs + 23 * 3_600_000 + 59 * 60_000);

    render(<FormatDate dateString={PUBLISHED} />);

    expect(screen.getByRole("time")).toHaveTextContent("23 hrs ago");
  });

  it("switches to the date once 24 hours have passed", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(publishedMs + 24 * 3_600_000);

    render(<FormatDate dateString={PUBLISHED} />);

    const time = screen.getByRole("time");
    expect(time).toHaveTextContent("Jan 15, 2026");
    expect(time).not.toHaveAttribute("title");
  });

  it("shares one minute ticker that keeps every mounted date current", () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    vi.setSystemTime(publishedMs + 12 * 60_000);

    const first = render(<FormatDate dateString={PUBLISHED} />);
    const second = render(<FormatDate dateString={PUBLISHED} />);
    expect(vi.getTimerCount()).toBe(1);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getAllByRole("time")[0]).toHaveTextContent("13 min ago");

    first.unmount();
    expect(vi.getTimerCount()).toBe(1);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByRole("time")).toHaveTextContent("14 min ago");

    second.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("server-renders the absolute date so cached pages never go stale", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(publishedMs + 5 * 60_000);

    const html = renderToString(<FormatDate dateString={PUBLISHED} />);

    expect(html).toContain("Jan 15, 2026");
    expect(html).not.toContain("min ago");
  });
});
