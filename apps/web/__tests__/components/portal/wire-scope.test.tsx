import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

import { WireScope } from "@/components/portal/wire-scope";

const sports = [
  { slug: "football", label: "Football" },
  { slug: "mens-basketball", label: "Men's Basketball" },
];

describe("WireScope", () => {
  afterEach(() => vi.clearAllMocks());

  it("navigates to a season, keeping the newest at the bare URL", async () => {
    const user = userEvent.setup();
    render(
      <WireScope
        sport="football"
        sports={sports}
        year={2026}
        years={[2027, 2026, 2025]}
        currentYear={2027}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Season" })).toHaveTextContent(
      "2026",
    );
    await user.click(screen.getByRole("combobox", { name: "Season" }));
    await user.click(screen.getByRole("option", { name: "2025" }));
    expect(mockPush).toHaveBeenLastCalledWith(
      "/college/football/transfer-portal/2025",
    );
    await user.click(screen.getByRole("combobox", { name: "Season" }));
    await user.click(screen.getByRole("option", { name: "2027" }));
    expect(mockPush).toHaveBeenLastCalledWith(
      "/college/football/transfer-portal",
    );
  });

  it("opens another sport on its newest season", async () => {
    const user = userEvent.setup();
    render(
      <WireScope
        sport="football"
        sports={sports}
        year={2025}
        years={[2026, 2025]}
        currentYear={2026}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Sport" })).toHaveTextContent(
      "Football",
    );
    await user.click(screen.getByRole("combobox", { name: "Sport" }));
    await user.click(screen.getByRole("option", { name: "Men's Basketball" }));
    expect(mockPush).toHaveBeenLastCalledWith(
      "/college/mens-basketball/transfer-portal",
    );
  });

  it("names an unknown sport by its slug", () => {
    render(
      <WireScope
        sport="lacrosse"
        sports={sports}
        year={2026}
        years={[2026]}
        currentYear={2026}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Sport" })).toHaveTextContent(
      "lacrosse",
    );
  });
});
