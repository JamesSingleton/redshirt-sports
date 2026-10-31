import { render, screen, waitFor } from "@testing-library/react";

import { CopyrightYear } from "@/components/copyright-year";

describe("CopyrightYear", () => {
  it("updates to the current calendar year after mount", async () => {
    vi.setSystemTime(new Date("2027-06-15T12:00:00Z"));

    render(<CopyrightYear />);

    await waitFor(() => {
      expect(screen.getByText("2027")).toBeInTheDocument();
    });
  });
});
