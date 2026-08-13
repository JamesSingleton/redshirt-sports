import { fireEvent, render, screen } from "@testing-library/react";

const { mockCaptureException } = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mockCaptureException,
}));

import GlobalError from "@/app/global-error";

describe("GlobalError", () => {
  beforeEach(() => {
    mockCaptureException.mockClear();
  });

  it("renders global error UI with html/body and reports to Sentry", () => {
    const error = new Error("fatal");
    const reset = vi.fn();

    render(<GlobalError error={error} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "Something went wrong!" }),
    ).toBeInTheDocument();
    expect(mockCaptureException).toHaveBeenCalledWith(error);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalled();
  });
});
