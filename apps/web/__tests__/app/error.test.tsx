import { act, fireEvent, render, screen } from "@testing-library/react";

const { mockCaptureException } = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mockCaptureException,
}));

import AppError from "@/app/error";

// Each test starts a minute later than the last, past the 10s window in
// which a second automatic retry is skipped.
let clock = new Date("2026-11-05T12:00:00Z").getTime();

describe("AppError", () => {
  beforeEach(() => {
    mockCaptureException.mockClear();
    vi.useFakeTimers();
    clock += 60_000;
    vi.setSystemTime(clock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries once on its own before showing the error UI", () => {
    const error = new Error("boom");
    const retry = vi.fn();

    render(<AppError error={error} retry={retry} />);

    expect(mockCaptureException).toHaveBeenCalledWith(error);
    expect(screen.getByRole("status")).toHaveTextContent("Reloading…");
    expect(retry).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(retry).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", { name: "Something went wrong" }),
    ).toBeInTheDocument();
  });

  it("shows the error UI at once when it just auto-retried, and Try again retries", () => {
    const retry = vi.fn();
    const first = render(<AppError error={new Error("boom")} retry={retry} />);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    first.unmount();
    retry.mockClear();

    // The retry failed too: the boundary mounts again inside the window.
    render(<AppError error={new Error("boom again")} retry={retry} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(retry).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("cancels the pending retry when unmounted", () => {
    const retry = vi.fn();
    const { unmount } = render(
      <AppError error={new Error("boom")} retry={retry} />,
    );

    unmount();
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(retry).not.toHaveBeenCalled();
  });
});
