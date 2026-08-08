import { fireEvent, render, screen } from "@testing-library/react";

const { mockCaptureException } = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mockCaptureException,
}));

import AppError from "@/app/error";

describe("AppError", () => {
  beforeEach(() => {
    mockCaptureException.mockClear();
  });

  it("renders error UI and reports to Sentry", () => {
    const error = new Error("boom");
    const reset = vi.fn();

    render(<AppError error={error} reset={reset} />);

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(mockCaptureException).toHaveBeenCalledWith(error);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalled();
  });
});
