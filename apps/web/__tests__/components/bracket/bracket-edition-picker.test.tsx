import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createContext, type ReactNode, useContext } from "react";

const mockPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
// A stand-in for the Radix select: every option is a button that fires onValueChange.
vi.mock("@redshirt-sports/ui/components/select", async () => {
  const Context = createContext<(value: string) => void>(() => {});
  return {
    Select: ({
      children,
      onValueChange,
    }: {
      children: ReactNode;
      onValueChange: (value: string) => void;
    }) => <Context.Provider value={onValueChange}>{children}</Context.Provider>,
    SelectTrigger: ({ children, id }: { children: ReactNode; id: string }) => (
      <div id={id} data-testid="trigger">
        {children}
      </div>
    ),
    SelectValue: ({ children }: { children: ReactNode }) => (
      <span>{children}</span>
    ),
    SelectContent: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    SelectItem: ({
      children,
      value,
    }: {
      children: ReactNode;
      value: string;
    }) => {
      const change = useContext(Context);
      return (
        <button type="button" onClick={() => change(value)}>
          option {children}
        </button>
      );
    },
  };
});

import { BracketEditionPicker } from "@/components/bracket/bracket-edition-picker";

const base = "/college/football/playoffs/fcs";

function renderPicker() {
  return render(
    <BracketEditionPicker
      seasons={[
        { year: 2026, href: `${base}/2026` },
        { year: 2025, href: `${base}/2025` },
      ]}
      year={2026}
      editions={[
        { href: `${base}/2026`, label: "Official bracket" },
        { href: `${base}/2026/projections/week-8`, label: "Week 8 projection" },
      ]}
      currentHref={`${base}/2026/projections/week-8`}
    />,
  );
}

describe("BracketEditionPicker", () => {
  beforeEach(() => mockPush.mockReset());

  it("shows the current season and bracket", () => {
    renderPicker();
    const [season, bracket] = screen.getAllByTestId("trigger");
    expect(season).toHaveTextContent("2026");
    expect(bracket).toHaveTextContent("Week 8 projection");
  });

  it("opens another season's current bracket", async () => {
    renderPicker();
    await userEvent.click(screen.getByRole("button", { name: "option 2025" }));
    expect(mockPush).toHaveBeenLastCalledWith(`${base}/2025`, {
      transitionTypes: expect.any(Array),
    });
  });

  it("opens another bracket in the season", async () => {
    renderPicker();
    await userEvent.click(
      screen.getByRole("button", { name: "option Official bracket" }),
    );
    expect(mockPush).toHaveBeenLastCalledWith(`${base}/2026`, {
      transitionTypes: expect.any(Array),
    });
  });

  it("stays put when the current choice is picked again", async () => {
    renderPicker();
    await userEvent.click(screen.getByRole("button", { name: "option 2026" }));
    await userEvent.click(
      screen.getByRole("button", { name: "option Week 8 projection" }),
    );
    expect(mockPush).not.toHaveBeenCalled();
  });
});
