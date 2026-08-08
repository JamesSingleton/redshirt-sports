import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

const { mockPush, mockCapture, mockParams } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockCapture: vi.fn(),
  mockParams: {
    sport: "football",
    division: "fbs",
    year: "2025",
    week: "1",
  } as {
    sport?: string | string[];
    division?: string | string[];
    year?: string | string[];
    week?: string | string[];
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}));

vi.mock("@redshirt-sports/analytics", () => ({
  analytics: { capture: mockCapture },
}));

vi.mock("@redshirt-sports/ui/components/select", () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: ReactNode;
    onValueChange?: (v: string) => void;
    value?: string;
  }) => (
    <div data-testid={`select-${value ?? "empty"}`}>
      <button
        type="button"
        data-testid={`trigger-${value ?? "empty"}`}
        onClick={() => {
          if (value === mockParams.year) {
            onValueChange?.("2024");
          } else if (value === "13") {
            onValueChange?.("");
          } else if (value === "bad-week") {
            onValueChange?.("not-a-week");
          } else {
            onValueChange?.("final-rankings");
          }
        }}
      >
        {value ?? "empty"}
      </button>
      {value === mockParams.year ? (
        <button
          type="button"
          data-testid="trigger-year-same"
          onClick={() => onValueChange?.(mockParams.year)}
        />
      ) : null}
      {value === mockParams.week ? (
        <button
          type="button"
          data-testid="trigger-week-same"
          onClick={() => onValueChange?.(mockParams.week)}
        />
      ) : null}
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ children }: { children: ReactNode; value: string }) => (
    <>{children}</>
  ),
}));

import { RankingsFilters } from "@/components/rankings/filters";

describe("RankingsFilters", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockCapture.mockReset();
  });

  it("navigates to year/0 when year changes and captures analytics", async () => {
    const user = userEvent.setup();
    render(
      <RankingsFilters
        years={[{ year: 2025 }, { year: 2024 }]}
        weeks={[{ week: 0 }, { week: 1 }]}
      />,
    );

    await user.click(screen.getByTestId("trigger-2025"));

    expect(mockCapture).toHaveBeenCalledWith(
      "rankings_filter_changed",
      expect.objectContaining({
        filter_type: "year",
        new_value: "2024",
      }),
    );
    expect(mockPush).toHaveBeenCalledWith(
      "/college/football/rankings/fbs/2024/0",
    );
  });

  it("navigates with week segment when week changes", async () => {
    const user = userEvent.setup();
    render(
      <RankingsFilters
        years={[{ year: 2025 }]}
        weeks={[{ week: 1 }, { week: 999 }]}
      />,
    );

    await user.click(screen.getByTestId("trigger-1"));

    expect(mockCapture).toHaveBeenCalledWith(
      "rankings_filter_changed",
      expect.objectContaining({
        filter_type: "week",
        new_value: "final-rankings",
      }),
    );
    expect(mockPush).toHaveBeenCalledWith(
      "/college/football/rankings/fbs/2025/final-rankings",
    );
  });

  it("ignores empty week segment changes from the select", async () => {
    mockParams.week = "13";
    const user = userEvent.setup();
    render(
      <RankingsFilters
        years={[{ year: 2025 }]}
        weeks={[{ week: 13 }, { week: 999 }]}
      />,
    );

    await user.click(screen.getByTestId("trigger-13"));

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
    mockParams.week = "1";
  });

  it("ignores year changes when the selected year matches the route", async () => {
    const user = userEvent.setup();
    render(
      <RankingsFilters
        years={[{ year: 2025 }]}
        weeks={[{ week: 1 }]}
      />,
    );

    await user.click(screen.getByTestId("trigger-year-same"));

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("ignores week changes when the selected segment matches the route", async () => {
    const user = userEvent.setup();
    render(
      <RankingsFilters
        years={[{ year: 2025 }]}
        weeks={[{ week: 1 }]}
      />,
    );

    await user.click(screen.getByTestId("trigger-week-same"));

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("ignores invalid week segments that fail parsing", async () => {
    mockParams.week = "bad-week";
    const user = userEvent.setup();
    render(
      <RankingsFilters
        years={[{ year: 2025 }]}
        weeks={[{ week: 1 }]}
      />,
    );

    await user.click(screen.getByTestId("trigger-bad-week"));

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
    mockParams.week = "1";
  });

  it("ignores year changes when required route params are missing", async () => {
    mockParams.sport = undefined as never;
    const user = userEvent.setup();
    render(
      <RankingsFilters
        years={[{ year: 2025 }, { year: 2024 }]}
        weeks={[{ week: 1 }]}
      />,
    );

    await user.click(screen.getByTestId("trigger-2025"));

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
    mockParams.sport = "football";
  });

  it("ignores week changes when the year route param is missing", async () => {
    mockParams.year = undefined as never;
    const user = userEvent.setup();
    render(
      <RankingsFilters
        years={[{ year: 2025 }]}
        weeks={[{ week: 1 }, { week: 999 }]}
      />,
    );

    await user.click(screen.getByTestId("trigger-1"));

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
    mockParams.year = "2025";
  });

  it("unwraps array route params before navigating", async () => {
    mockParams.sport = ["football"] as never;
    mockParams.division = ["fbs"] as never;
    mockParams.year = ["2025"] as never;
    mockParams.week = ["1"] as never;

    const user = userEvent.setup();
    render(
      <RankingsFilters
        years={[{ year: 2025 }, { year: 2024 }]}
        weeks={[{ week: 1 }]}
      />,
    );

    await user.click(screen.getByTestId("trigger-2025"));

    expect(mockPush).toHaveBeenCalledWith(
      "/college/football/rankings/fbs/2024/0",
    );

    mockParams.sport = "football";
    mockParams.division = "fbs";
    mockParams.year = "2025";
    mockParams.week = "1";
  });
});
