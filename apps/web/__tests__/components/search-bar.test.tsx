import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SearchBar } from "@/components/search-bar";

const { mockPush, mockFetch } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@redshirt-sports/sanity/client", () => ({
  client: { fetch: mockFetch },
}));

describe("SearchBar", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockFetch.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows searching state and renders results", async () => {
    mockFetch.mockResolvedValue([
      {
        _id: "post-1",
        _type: "post",
        title: "Alabama Preview",
        slug: "alabama-preview",
        publishedAt: "2026-01-01T00:00:00Z",
      },
    ]);

    const user = userEvent.setup();
    render(<SearchBar placeholder="Find articles" />);

    await user.type(screen.getByPlaceholderText("Find articles"), "alabama");

    await waitFor(() => {
      expect(screen.getByText("Alabama Preview")).toBeInTheDocument();
    });
  });

  it("navigates when a result is clicked", async () => {
    mockFetch.mockResolvedValue([
      {
        _id: "post-1",
        _type: "post",
        title: "Alabama Preview",
        slug: "alabama-preview",
        publishedAt: "2026-01-01T00:00:00Z",
      },
    ]);

    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(screen.getByRole("textbox"), "alabama");
    await waitFor(() => {
      expect(screen.getByText("Alabama Preview")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Alabama Preview"));

    expect(mockPush).toHaveBeenCalledWith("/alabama-preview");
  });

  it("submits the full search query on Enter", async () => {
    mockFetch.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(screen.getByRole("textbox"), "recruiting{enter}");

    expect(mockPush).toHaveBeenCalledWith("/search?q=recruiting");
  });

  it("shows no results message when search returns empty", async () => {
    mockFetch.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(screen.getByRole("textbox"), "missing");
    await waitFor(() => {
      expect(
        screen.getByText('No articles found for "missing"'),
      ).toBeInTheDocument();
    });
  });

  it("clears the query with the clear button", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(screen.getByRole("textbox"), "test");
    await user.click(screen.getByRole("button", { name: "" }));

    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("handles keyboard navigation and escape", async () => {
    mockFetch.mockResolvedValue([
      {
        _id: "post-1",
        _type: "post",
        title: "First",
        slug: "first",
        publishedAt: "2026-01-01T00:00:00Z",
      },
      {
        _id: "post-2",
        _type: "post",
        title: "Second",
        slug: "second",
        publishedAt: "2026-01-02T00:00:00Z",
      },
    ]);

    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByRole("textbox");
    await user.type(input, "post");
    await waitFor(() => {
      expect(screen.getByText("First")).toBeInTheDocument();
    });

    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}{Enter}");
    expect(mockPush).toHaveBeenCalledWith("/first");

    await user.type(input, "post");
    await waitFor(() => {
      expect(screen.getByText("First")).toBeInTheDocument();
    });
    await user.keyboard("{Escape}");
    expect(input).not.toHaveFocus();
  });

  it("returns an empty array when the Sanity search fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error("search failed"));
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(screen.getByRole("textbox"), "error");
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it("closes results when clicking outside", async () => {
    mockFetch.mockResolvedValue([
      {
        _id: "post-1",
        _type: "post",
        title: "Outside click",
        slug: "outside",
        publishedAt: "2026-01-01T00:00:00Z",
      },
    ]);

    const user = userEvent.setup();
    render(
      <div>
        <SearchBar />
        <button type="button">Outside</button>
      </div>,
    );

    await user.type(screen.getByRole("textbox"), "outside");
    await waitFor(() => {
      expect(screen.getByText("Outside click")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByText("Outside click")).not.toBeInTheDocument();
  });

  it("submits the full query when Enter is pressed with visible results but no selection", async () => {
    mockFetch.mockResolvedValue([
      {
        _id: "post-1",
        _type: "post",
        title: "Result",
        slug: "result",
        publishedAt: "2026-01-01T00:00:00Z",
      },
    ]);
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByRole("textbox");
    await user.type(input, "result");
    await waitFor(() => {
      expect(screen.getByText("Result")).toBeInTheDocument();
    });

    await user.keyboard("{ArrowUp}");
    await user.keyboard("{Enter}");

    expect(mockPush).toHaveBeenCalledWith("/search?q=result");
  });

  it("does not search when the query is only whitespace", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SearchBar />);

    await user.type(screen.getByRole("textbox"), "   ");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not submit an empty query", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.click(screen.getByRole("textbox"));
    await user.keyboard("{Enter}");

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("keeps the selected index when ArrowDown is pressed on the last result", async () => {
    mockFetch.mockResolvedValue([
      {
        _id: "post-1",
        _type: "post",
        title: "Only Result",
        slug: "only",
        publishedAt: "2026-01-01T00:00:00Z",
      },
    ]);
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByRole("textbox");
    await user.type(input, "only");
    await waitFor(() => {
      expect(screen.getByText("Only Result")).toBeInTheDocument();
    });

    await user.keyboard("{ArrowDown}{ArrowDown}");
    const selected = screen.getByText("Only Result").closest("button");
    expect(selected).toHaveClass("bg-muted");
  });

  it("keeps showing prior results after the query is cleared while focused", async () => {
    mockFetch.mockResolvedValue([
      {
        _id: "post-1",
        _type: "post",
        title: "Sticky Result",
        slug: "sticky",
        publishedAt: "2026-01-01T00:00:00Z",
      },
    ]);
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByRole("textbox");
    await user.type(input, "sticky");
    await waitFor(() => {
      expect(screen.getByText("Sticky Result")).toBeInTheDocument();
    });

    await user.clear(input);
    expect(screen.getByText("Sticky Result")).toBeInTheDocument();
  });

  it("shows a loading state while search results are pending", async () => {
    let resolveSearch: (value: unknown) => void = () => {};
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(screen.getByRole("textbox"), "pending");
    await waitFor(() => {
      expect(screen.getByText("Searching...")).toBeInTheDocument();
    });

    resolveSearch([
      {
        _id: "post-1",
        _type: "post",
        title: "Pending Result",
        slug: "pending",
        publishedAt: "2026-01-01T00:00:00Z",
      },
    ]);

    await waitFor(() => {
      expect(screen.getByText("Pending Result")).toBeInTheDocument();
    });
  });
});
