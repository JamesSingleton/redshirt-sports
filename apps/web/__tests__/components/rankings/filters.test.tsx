import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const { mockPush, mockCapture, mockParams, NULL_VALUE } = vi.hoisted(() => ({
  NULL_VALUE: "__null__",
  mockPush: vi.fn(),
  mockCapture: vi.fn(),
  mockParams: {
    sport: "football",
    division: "fbs",
  } as {
    sport?: string | string[];
    division?: string | string[];
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}));

vi.mock("@redshirt-sports/analytics", () => ({
  analytics: { capture: mockCapture },
}));

vi.mock("@redshirt-sports/ui/components/select", async () => {
  const { createContext, use } = await import("react");
  const SelectContext = createContext<{
    value?: string;
    onValueChange?: (v: string | null) => void;
  }>({});

  return {
    Select: ({
      children,
      onValueChange,
      value,
    }: {
      children: ReactNode;
      onValueChange?: (v: string | null) => void;
      value?: string;
    }) => (
      <SelectContext value={{ value, onValueChange }}>{children}</SelectContext>
    ),
    SelectTrigger: ({
      children,
      "aria-label": ariaLabel,
    }: {
      children: ReactNode;
      "aria-label"?: string;
    }) => {
      const { value, onValueChange } = use(SelectContext);
      return (
        <>
          <input
            aria-label={ariaLabel}
            defaultValue={value}
            onChange={(e) =>
              onValueChange?.(
                e.target.value === NULL_VALUE ? null : e.target.value,
              )
            }
          />
          {children}
        </>
      );
    },
    SelectValue: () => null,
    SelectContent: ({ children }: { children: ReactNode }) => (
      <ul>{children}</ul>
    ),
    SelectItem: ({
      children,
      value,
    }: {
      children: ReactNode;
      value: string;
    }) => <li data-value={value}>{children}</li>,
  };
});

import { RankingsFilters } from "@/components/rankings/filters";

function renderFilters(
  props: Partial<React.ComponentProps<typeof RankingsFilters>> = {},
) {
  return render(
    <RankingsFilters
      years={[{ year: 2025 }, { year: 2024 }]}
      weeks={[{ week: 0 }, { week: 1 }, { week: 999 }]}
      currentYear="2025"
      currentWeek="1"
      {...props}
    />,
  );
}

function changeSelect(label: "Year" | "Ranking", value: string) {
  fireEvent.change(screen.getByRole("textbox", { name: label }), {
    target: { value },
  });
}

describe("RankingsFilters", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockCapture.mockReset();
    mockParams.sport = "football";
    mockParams.division = "fbs";
  });

  it("uses the current year and week props as the selected values", () => {
    renderFilters({ currentYear: "2024", currentWeek: "final-rankings" });

    expect(screen.getByRole("textbox", { name: "Year" })).toHaveValue("2024");
    expect(screen.getByRole("textbox", { name: "Ranking" })).toHaveValue(
      "final-rankings",
    );
  });

  it("renders year options and week options keyed by week segment", () => {
    renderFilters();

    expect(screen.getByText("2025")).toHaveAttribute("data-value", "2025");
    expect(screen.getByText("2024")).toHaveAttribute("data-value", "2024");
    expect(screen.getByText("Preseason")).toHaveAttribute("data-value", "0");
    expect(screen.getByText("Week 1")).toHaveAttribute("data-value", "1");
    expect(screen.getByText("Final Rankings")).toHaveAttribute(
      "data-value",
      "final-rankings",
    );
  });

  it("navigates to year/0 when year changes and captures analytics", () => {
    renderFilters();

    changeSelect("Year", "2024");

    expect(mockCapture).toHaveBeenCalledWith("rankings_filter_changed", {
      filter_type: "year",
      new_value: "2024",
      sport: "football",
      division: "fbs",
    });
    expect(mockPush).toHaveBeenCalledWith(
      "/college/football/rankings/fbs/2024/0",
    );
  });

  it("navigates with the week segment under the current year prop", () => {
    renderFilters({ currentYear: "2024" });

    changeSelect("Ranking", "final-rankings");

    expect(mockCapture).toHaveBeenCalledWith("rankings_filter_changed", {
      filter_type: "week",
      new_value: "final-rankings",
      sport: "football",
      division: "fbs",
      year: "2024",
    });
    expect(mockPush).toHaveBeenCalledWith(
      "/college/football/rankings/fbs/2024/final-rankings",
    );
  });

  it("ignores empty week segment changes from the select", () => {
    renderFilters();

    changeSelect("Ranking", "");

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("ignores year changes when the selected year matches the current year", () => {
    renderFilters({ currentYear: "2025" });

    changeSelect("Year", "2024");
    mockPush.mockReset();
    mockCapture.mockReset();
    changeSelect("Year", "2025");

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("ignores week changes when the selected segment matches the current week", () => {
    renderFilters({ currentWeek: "1" });

    changeSelect("Ranking", "0");
    mockPush.mockReset();
    mockCapture.mockReset();
    changeSelect("Ranking", "1");

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("ignores invalid week segments that fail parsing", () => {
    renderFilters();

    changeSelect("Ranking", "not-a-week");

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("ignores year and week changes when required route params are missing", () => {
    mockParams.sport = undefined;
    renderFilters();

    changeSelect("Year", "2024");
    changeSelect("Ranking", "final-rankings");

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("ignores week changes when the current year is empty", () => {
    renderFilters({ currentYear: "" });

    changeSelect("Ranking", "final-rankings");

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("ignores cleared (null) selections from either select", () => {
    renderFilters();

    changeSelect("Year", NULL_VALUE);
    changeSelect("Ranking", NULL_VALUE);

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("unwraps array route params before navigating", () => {
    mockParams.sport = ["football"];
    mockParams.division = ["fbs"];
    renderFilters();

    changeSelect("Year", "2024");

    expect(mockPush).toHaveBeenCalledWith(
      "/college/football/rankings/fbs/2024/0",
    );
  });
});
