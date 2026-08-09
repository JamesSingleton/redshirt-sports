import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";

import VoterBallotBreakdown from "@/components/rankings/voter-ballot-breakdown";
import VoterBreakdownDesktop from "@/components/rankings/voter-ballot-breakdown/desktop";
import {
  BallotMatchBadge,
  BallotMatchHeader,
} from "@/components/rankings/voter-ballot-breakdown/match-badge";
import VoterBreakdownMobile from "@/components/rankings/voter-ballot-breakdown/mobile";
import { SyncedScroll } from "@/components/rankings/voter-ballot-breakdown/synced-scroll";
import { TeamLogo } from "@/components/rankings/voter-ballot-breakdown/team-logo";

const { mockUseIsMobile } = vi.hoisted(() => ({
  mockUseIsMobile: vi.fn(),
}));

vi.mock("@/hooks/use-is-mobile", () => ({
  useIsMobile: mockUseIsMobile,
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: ({
    image,
    width,
    height,
  }: {
    image?: { alt?: string };
    width?: number;
    height?: number;
  }) => (
    <img
      alt={image?.alt ?? "team"}
      data-width={width}
      data-height={height}
      data-testid="team-logo"
    />
  ),
}));

const vote = {
  _id: "team-1",
  name: "Alabama",
  shortName: "Alabama",
  abbreviation: "ALA",
  image: { alt: "Alabama logo" },
  _order: 1,
};

const voterBreakdown = Array.from({ length: 12 }, (_, index) => ({
  name: `Voter ${index + 1}`,
  organization: `Org ${index + 1}`,
  organizationRole: index % 2 === 0 ? "Writer" : "",
  matchPercent: 100 - index,
  ballot: index === 0 ? [vote] : [],
}));

describe("VoterBallotBreakdown", () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(false);
  });

  it("filters, sorts, and paginates voters on desktop", async () => {
    const user = userEvent.setup();
    render(<VoterBallotBreakdown voterBreakdown={voterBreakdown as never} />);

    await waitFor(() => {
      expect(screen.getByText("Voter Breakdown")).toBeInTheDocument();
    });

    await user.type(
      screen.getByLabelText("Search voters or organizations"),
      "Org 12",
    );

    await waitFor(() => {
      expect(screen.getByText(/Showing 1 of 1 voter/)).toBeInTheDocument();
    });
  });

  it("renders the mobile breakdown when on a small screen", async () => {
    mockUseIsMobile.mockReturnValue(true);
    render(<VoterBallotBreakdown voterBreakdown={voterBreakdown as never} />);

    await waitFor(() => {
      expect(screen.getByText("Prev")).toBeInTheDocument();
    });
  });

  it("sorts by match percent and changes page size on desktop", async () => {
    const user = userEvent.setup();
    render(<VoterBallotBreakdown voterBreakdown={voterBreakdown as never} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Sort voters")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("Sort voters"));
    await user.click(screen.getByRole("option", { name: "Match %" }));

    await waitFor(() => {
      expect(screen.getByText("Voter 1")).toBeInTheDocument();
    });

    const pageSizeTrigger = screen.getAllByRole("combobox")[1]!;
    await user.click(pageSizeTrigger);
    await user.click(screen.getByRole("option", { name: "20 per page" }));

    await waitFor(() => {
      expect(screen.getByText(/Showing 12 of 12 voter/)).toBeInTheDocument();
    });
  });

  it("paginates voters through mobile controls", async () => {
    mockUseIsMobile.mockReturnValue(true);
    const user = userEvent.setup();
    render(<VoterBallotBreakdown voterBreakdown={voterBreakdown as never} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Prev" }));
  });

  it("limits page size options for small result sets", async () => {
    const user = userEvent.setup();
    render(
      <VoterBallotBreakdown
        voterBreakdown={voterBreakdown.slice(0, 3) as never}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Showing 3 of 3 voter/)).toBeInTheDocument();
    });

    const pageSizeTrigger = screen.getAllByRole("combobox")[1]!;
    await user.click(pageSizeTrigger);
    expect(
      screen.getByRole("option", { name: "10 per page" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "20 per page" }),
    ).not.toBeInTheDocument();
  });

  it("uses desktop pagination callbacks when the viewport is wide", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("min-width"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    mockUseIsMobile.mockReturnValue(false);

    const user = userEvent.setup();
    render(<VoterBallotBreakdown voterBreakdown={voterBreakdown as never} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Go to last page")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("Go to last page"));
    await user.click(screen.getByLabelText("Go to first page"));
    await user.click(screen.getByLabelText("Next page"));
    await user.click(screen.getByLabelText("Previous page"));

    vi.unstubAllGlobals();
  });
});

describe("VoterBreakdownDesktop", () => {
  it("renders voter rows and pagination controls", async () => {
    const user = userEvent.setup();
    const onFirst = vi.fn();
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onLast = vi.fn();

    render(
      <VoterBreakdownDesktop
        rows={voterBreakdown.slice(0, 1) as never}
        page={2}
        pageCount={3}
        onFirstAction={onFirst}
        onPrevAction={onPrev}
        onNextAction={onNext}
        onLastAction={onLast}
      />,
    );

    expect(screen.getByText("Voter 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Match %" })).toBeInTheDocument();
    expect(screen.getByTestId("team-logo")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Go to first page"));
    await user.click(screen.getByLabelText("Previous page"));
    await user.click(screen.getByLabelText("Next page"));
    await user.click(screen.getByLabelText("Go to last page"));

    expect(onFirst).toHaveBeenCalled();
    expect(onPrev).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
    expect(onLast).toHaveBeenCalled();
  });
});

describe("VoterBreakdownMobile", () => {
  it("renders mobile cards and pagination buttons", async () => {
    const user = userEvent.setup();
    const onPrev = vi.fn();
    const onNext = vi.fn();

    render(
      <VoterBreakdownMobile
        rows={voterBreakdown.slice(0, 1) as never}
        page={1}
        pageCount={2}
        onPrevAction={onPrev}
        onNextAction={onNext}
      />,
    );

    expect(screen.getByText("Voter 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Rank 1: Alabama")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onNext).toHaveBeenCalled();
  });

  it("renders placeholder ranks when ballot entries are missing", () => {
    render(
      <VoterBreakdownMobile
        rows={
          [
            {
              name: "Voter Empty",
              organization: "Org",
              organizationRole: "",
              matchPercent: 50,
              ballot: [],
            },
          ] as never
        }
        page={1}
        pageCount={1}
        onPrevAction={vi.fn()}
        onNextAction={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Rank 2")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Rank 2:/)).not.toBeInTheDocument();
  });
});

describe("SyncedScroll", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("syncs scroll position across grouped scrollers", () => {
    render(
      <>
        <SyncedScroll group="ballot-group">
          <div style={{ width: 1000 }}>Left</div>
        </SyncedScroll>
        <SyncedScroll group="ballot-group">
          <div style={{ width: 1000 }}>Right</div>
        </SyncedScroll>
      </>,
    );

    const scrollers = document.querySelectorAll(".overflow-x-auto");
    const [left, right] = Array.from(scrollers) as [
      HTMLDivElement,
      HTMLDivElement,
    ];

    Object.defineProperty(left, "scrollWidth", {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(left, "clientWidth", {
      value: 500,
      configurable: true,
    });
    Object.defineProperty(right, "scrollWidth", {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(right, "clientWidth", {
      value: 500,
      configurable: true,
    });

    left.scrollLeft = 250;
    act(() => {
      left.dispatchEvent(new Event("scroll"));
    });

    expect(right.scrollLeft).toBeGreaterThan(0);
  });

  it("ignores programmatic scroll updates to avoid sync loops", () => {
    render(
      <>
        <SyncedScroll group="loop-group">
          <div style={{ width: 1000 }}>Left</div>
        </SyncedScroll>
        <SyncedScroll group="loop-group">
          <div style={{ width: 1000 }}>Right</div>
        </SyncedScroll>
      </>,
    );

    const scrollers = document.querySelectorAll(".overflow-x-auto");
    const [left, right] = Array.from(scrollers) as [
      HTMLDivElement,
      HTMLDivElement,
    ];

    for (const el of [left, right]) {
      Object.defineProperty(el, "scrollWidth", {
        value: 1000,
        configurable: true,
      });
      Object.defineProperty(el, "clientWidth", {
        value: 500,
        configurable: true,
      });
    }

    left.scrollLeft = 200;
    act(() => {
      left.dispatchEvent(new Event("scroll"));
    });

    const syncedPosition = right.scrollLeft;
    act(() => {
      right.dispatchEvent(new Event("scroll"));
    });

    expect(right.scrollLeft).toBe(syncedPosition);
  });

  it("re-syncs when resize observer fires with existing scroll offset", () => {
    const resizeCallbacks: ResizeObserverCallback[] = [];
    class MockResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeCallbacks.push(callback);
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", MockResizeObserver);

    render(
      <SyncedScroll group="resize-group">
        <div style={{ width: 1000 }}>Scroller</div>
      </SyncedScroll>,
    );

    const scroller = document.querySelector(
      ".overflow-x-auto",
    ) as HTMLDivElement;
    Object.defineProperty(scroller, "scrollWidth", {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(scroller, "clientWidth", {
      value: 500,
      configurable: true,
    });
    scroller.scrollLeft = 100;

    const dispatchSpy = vi.spyOn(scroller, "dispatchEvent");
    act(() => {
      resizeCallbacks[0]?.([], {} as ResizeObserver);
    });

    expect(dispatchSpy).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("skips syncing when there is no horizontal overflow", () => {
    render(
      <>
        <SyncedScroll group="no-overflow">
          <div>Left</div>
        </SyncedScroll>
        <SyncedScroll group="no-overflow">
          <div>Right</div>
        </SyncedScroll>
      </>,
    );

    const scrollers = document.querySelectorAll(".overflow-x-auto");
    const [left, right] = Array.from(scrollers) as [
      HTMLDivElement,
      HTMLDivElement,
    ];

    for (const el of [left, right]) {
      Object.defineProperty(el, "scrollWidth", {
        value: 100,
        configurable: true,
      });
      Object.defineProperty(el, "clientWidth", {
        value: 100,
        configurable: true,
      });
    }

    left.scrollLeft = 0;
    act(() => {
      left.dispatchEvent(new Event("scroll"));
    });

    expect(right.scrollLeft).toBe(0);
  });

  it("skips syncing when the target offset is already aligned", () => {
    render(
      <>
        <SyncedScroll group="aligned-group">
          <div style={{ width: 1000 }}>Left</div>
        </SyncedScroll>
        <SyncedScroll group="aligned-group">
          <div style={{ width: 1000 }}>Right</div>
        </SyncedScroll>
      </>,
    );

    const scrollers = document.querySelectorAll(".overflow-x-auto");
    const [left, right] = Array.from(scrollers) as [
      HTMLDivElement,
      HTMLDivElement,
    ];

    for (const el of [left, right]) {
      Object.defineProperty(el, "scrollWidth", {
        value: 1000,
        configurable: true,
      });
      Object.defineProperty(el, "clientWidth", {
        value: 500,
        configurable: true,
      });
    }

    right.scrollLeft = 250;
    left.scrollLeft = 250;
    act(() => {
      left.dispatchEvent(new Event("scroll"));
    });

    expect(right.scrollLeft).toBe(250);
  });

  it("cancels pending animation frames before scheduling another sync", () => {
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
    render(
      <>
        <SyncedScroll group="raf-group">
          <div style={{ width: 1000 }}>Left</div>
        </SyncedScroll>
        <SyncedScroll group="raf-group">
          <div style={{ width: 1000 }}>Right</div>
        </SyncedScroll>
      </>,
    );

    const scrollers = document.querySelectorAll(".overflow-x-auto");
    const [left] = Array.from(scrollers) as [HTMLDivElement, HTMLDivElement];

    Object.defineProperty(left, "scrollWidth", {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(left, "clientWidth", {
      value: 500,
      configurable: true,
    });

    left.scrollLeft = 100;
    act(() => {
      left.dispatchEvent(new Event("scroll"));
      left.scrollLeft = 200;
      left.dispatchEvent(new Event("scroll"));
    });

    expect(cancelSpy).toHaveBeenCalled();
  });
});

describe("BallotMatchBadge", () => {
  it("renders the match badge", () => {
    render(<BallotMatchBadge matchPercent={92} />);
    expect(screen.getByText("92%")).toBeInTheDocument();
  });
});

describe("BallotMatchHeader", () => {
  it("renders the tooltip trigger", () => {
    render(<BallotMatchHeader />);
    expect(screen.getByRole("button", { name: "Match %" })).toBeInTheDocument();
  });
});

describe("TeamLogo", () => {
  it("renders the team logo image", () => {
    render(<TeamLogo vote={vote as never} size={36} />);
    expect(screen.getByTestId("team-logo")).toHaveAttribute("data-width", "36");
  });
});
