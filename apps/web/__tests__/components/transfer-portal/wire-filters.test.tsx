import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const { mockReplace, navigation } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  navigation: { searchParams: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/college/football/transfer-portal",
  useSearchParams: () => navigation.searchParams,
}));

vi.mock("@redshirt-sports/ui/components/select", async () => {
  const { createContext, use } = await import("react");
  const SelectContext = createContext<{
    value?: string;
    onValueChange?: (value: string | null) => void;
  }>({});

  return {
    Select: ({
      children,
      value,
      onValueChange,
    }: {
      children: ReactNode;
      value?: string;
      onValueChange?: (value: string | null) => void;
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
            onChange={(event) => onValueChange?.(event.target.value)}
          />
          <button type="button" onClick={() => onValueChange?.(null)}>
            Clear {ariaLabel}
          </button>
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

import { WireFilters } from "@/components/transfer-portal/wire-filters";

const PATH = "/college/football/transfer-portal";

function renderFilters() {
  return render(
    <WireFilters
      year={2026}
      years={[2026, 2025]}
      positions={["QB", "WR"]}
      conferences={[
        { id: "conf-1", name: "Big Sky Conference", shortName: "Big Sky" },
        { id: "conf-2", name: "Missouri Valley", shortName: null },
      ]}
    />,
  );
}

function lastReplace() {
  return mockReplace.mock.lastCall;
}

describe("WireFilters", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    navigation.searchParams = new URLSearchParams();
  });

  it("renders every filter option with defaults", () => {
    renderFilters();
    expect(
      screen.getByRole("searchbox", { name: "Search players" }),
    ).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Portal year" })).toHaveValue(
      "2026",
    );
    expect(screen.getByRole("textbox", { name: "Status" })).toHaveValue("all");
    expect(screen.getByRole("textbox", { name: "Position" })).toHaveValue(
      "all",
    );
    expect(screen.getByRole("textbox", { name: "Conference" })).toHaveValue(
      "all",
    );
    expect(screen.getByText("2025")).toHaveAttribute("data-value", "2025");
    expect(screen.getByText("In portal")).toHaveAttribute(
      "data-value",
      "ENTERED",
    );
    expect(screen.getByText("WR")).toHaveAttribute("data-value", "WR");
    expect(screen.getByText("Big Sky")).toHaveAttribute("data-value", "conf-1");
    expect(screen.getByText("Missouri Valley")).toHaveAttribute(
      "data-value",
      "conf-2",
    );
  });

  it("reflects current search params", () => {
    navigation.searchParams = new URLSearchParams({
      q: "smith",
      status: "COMMITTED",
      position: "QB",
      conference: "conf-1",
    });
    renderFilters();
    expect(screen.getByRole("searchbox")).toHaveValue("smith");
    expect(screen.getByRole("textbox", { name: "Status" })).toHaveValue(
      "COMMITTED",
    );
    expect(screen.getByRole("textbox", { name: "Position" })).toHaveValue("QB");
    expect(screen.getByRole("textbox", { name: "Conference" })).toHaveValue(
      "conf-1",
    );
  });

  it.each([
    ["Portal year", "2025", "year=2025"],
    ["Status", "WITHDRAWN", "status=WITHDRAWN"],
    ["Position", "WR", "position=WR"],
    ["Conference", "conf-2", "conference=conf-2"],
  ])("sets %s in the URL", (label, value, query) => {
    renderFilters();
    fireEvent.change(screen.getByRole("textbox", { name: label }), {
      target: { value },
    });
    expect(lastReplace()).toEqual([`${PATH}?${query}`, { scroll: false }]);
  });

  it.each(["Portal year", "Status", "Position", "Conference"])(
    "ignores a cleared %s selection",
    (label) => {
      renderFilters();
      fireEvent.click(screen.getByRole("button", { name: `Clear ${label}` }));
      expect(mockReplace).not.toHaveBeenCalled();
    },
  );

  it("removes a filter when All is chosen and keeps the others", () => {
    navigation.searchParams = new URLSearchParams({
      status: "COMMITTED",
      position: "QB",
    });
    renderFilters();
    fireEvent.change(screen.getByRole("textbox", { name: "Status" }), {
      target: { value: "all" },
    });
    expect(lastReplace()).toEqual([`${PATH}?position=QB`, { scroll: false }]);
  });

  it("drops the query string when the last filter is cleared", () => {
    navigation.searchParams = new URLSearchParams({ position: "QB" });
    renderFilters();
    fireEvent.change(screen.getByRole("textbox", { name: "Position" }), {
      target: { value: "all" },
    });
    expect(lastReplace()).toEqual([PATH, { scroll: false }]);
  });

  it("submits a trimmed search", () => {
    renderFilters();
    const search = screen.getByRole("searchbox");
    fireEvent.change(search, { target: { value: "  jane doe  " } });
    fireEvent.submit(screen.getByRole("search"));
    expect(lastReplace()).toEqual([`${PATH}?q=jane+doe`, { scroll: false }]);
  });

  it("clears the search when the field is missing from the form", () => {
    navigation.searchParams = new URLSearchParams({ q: "smith" });
    renderFilters();
    screen.getByRole("searchbox").remove();
    fireEvent.submit(screen.getByRole("search"));
    expect(lastReplace()).toEqual([PATH, { scroll: false }]);
  });
});
