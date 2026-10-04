import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { WireFeed } from "@/components/transfer-portal/wire-feed";
import {
  portalEntry,
  portalPlayer,
} from "../../helpers/transfer-portal-fixtures";

const { mockLoadMore } = vi.hoisted(() => ({ mockLoadMore: vi.fn() }));

vi.mock("@/actions/transfer-portal", () => ({
  loadMorePortalEntries: mockLoadMore,
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" />,
}));

const query = { sport: "football", portalYear: 2026 } as const;

const nextEntry = portalEntry({
  id: "entry-2",
  player: portalPlayer({ id: "player-2", slug: "sam-roe", firstName: "Sam" }),
});

function renderFeed(initialCursor: string | null) {
  return render(
    <WireFeed
      query={query}
      caption="2026 Football transfer portal entries"
      initialEntries={[portalEntry()]}
      initialCursor={initialCursor}
    />,
  );
}

describe("WireFeed", () => {
  beforeEach(() => {
    mockLoadMore.mockReset();
  });

  it("renders the first page without a load more button at the end", () => {
    renderFeed(null);
    expect(
      screen.getByRole("table", {
        name: "2026 Football transfer portal entries",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Jane Doe" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Load more" }),
    ).not.toBeInTheDocument();
  });

  it("appends the next page and keeps paging until the cursor runs out", async () => {
    let resolveFirst!: (value: unknown) => void;
    mockLoadMore
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockResolvedValueOnce({ entries: [], nextCursor: null });
    renderFeed("cursor-1");

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(mockLoadMore).toHaveBeenCalledWith({ ...query, cursor: "cursor-1" });
    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Load more/ })).toBeDisabled();

    await act(async () => {
      resolveFirst({ entries: [nextEntry], nextCursor: "cursor-2" });
    });
    expect(
      await screen.findByRole("link", { name: "Sam Doe" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(mockLoadMore).toHaveBeenLastCalledWith({
      ...query,
      cursor: "cursor-2",
    });
    await vi.waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Load more/ }),
      ).not.toBeInTheDocument(),
    );
  });

  it("shows an error and allows retrying when loading fails", async () => {
    mockLoadMore
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ entries: [nextEntry], nextCursor: null });
    renderFeed("cursor-1");

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load more entries. Try again.",
    );

    fireEvent.click(await screen.findByRole("button", { name: "Load more" }));
    expect(
      await screen.findByRole("link", { name: "Sam Doe" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
