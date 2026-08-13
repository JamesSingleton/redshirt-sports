import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ModeToggle } from "@/components/mode-toggle";

const { mockSetTheme } = vi.hoisted(() => ({
  mockSetTheme: vi.fn(),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: mockSetTheme }),
}));

describe("ModeToggle", () => {
  beforeEach(() => {
    mockSetTheme.mockReset();
  });

  it("renders the theme toggle trigger", () => {
    render(<ModeToggle />);

    expect(
      screen.getByRole("button", { name: "Toggle theme" }),
    ).toBeInTheDocument();
  });

  it("sets light, dark, and system themes from the menu", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    await user.click(screen.getByRole("button", { name: "Toggle theme" }));
    await user.click(screen.getByRole("menuitem", { name: /Light/i }));
    await user.click(screen.getByRole("button", { name: "Toggle theme" }));
    await user.click(screen.getByRole("menuitem", { name: /Dark/i }));
    await user.click(screen.getByRole("button", { name: "Toggle theme" }));
    await user.click(screen.getByRole("menuitem", { name: /System/i }));

    expect(mockSetTheme).toHaveBeenNthCalledWith(1, "light");
    expect(mockSetTheme).toHaveBeenNthCalledWith(2, "dark");
    expect(mockSetTheme).toHaveBeenNthCalledWith(3, "system");
  });
});
