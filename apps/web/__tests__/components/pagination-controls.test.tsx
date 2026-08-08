import { render, screen } from "@testing-library/react";

import PaginationControls from "@/components/pagination-controls";

const nav = vi.hoisted(() => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  };

  return {
    usePathname: vi.fn(() => "/college/news"),
    useSearchParams: vi.fn(
      () => new URLSearchParams({ page: "2" }),
    ),
    router,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: nav.usePathname,
  useSearchParams: nav.useSearchParams,
}));

describe("PaginationControls", () => {
  beforeEach(() => {
    nav.useSearchParams.mockReturnValue(new URLSearchParams({ page: "2" }));
  });

  it("renders page links around the current page", () => {
    render(<PaginationControls totalPosts={36} />);

    expect(screen.getByRole("link", { name: "1" })).toHaveAttribute(
      "href",
      "/college/news",
    );
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute(
      "href",
      "/college/news?page=2",
    );
    expect(screen.getByRole("link", { name: "3" })).toHaveAttribute(
      "href",
      "/college/news?page=3",
    );
  });

  it("disables previous on the first page", () => {
    nav.useSearchParams.mockReturnValue(new URLSearchParams());
    render(<PaginationControls totalPosts={36} />);

    const previous = screen.getByLabelText("Go to previous page");
    expect(previous).toHaveAttribute("aria-disabled", "true");
  });

  it("disables next on the last page", () => {
    nav.useSearchParams.mockReturnValue(new URLSearchParams({ page: "3" }));
    render(<PaginationControls totalPosts={36} />);

    const next = screen.getByLabelText("Go to next page");
    expect(next).toHaveAttribute("aria-disabled", "true");
  });

  it("does not show ellipsis when there are three or fewer pages", () => {
    nav.useSearchParams.mockReturnValue(new URLSearchParams({ page: "2" }));
    render(<PaginationControls totalPosts={36} />);

    expect(screen.queryByText("More pages")).not.toBeInTheDocument();
  });

  it("shows ellipsis when there are more than three pages", () => {
    nav.useSearchParams.mockReturnValue(new URLSearchParams({ page: "2" }));
    render(<PaginationControls totalPosts={60} />);

    expect(screen.getByText("More pages")).toBeInTheDocument();
  });

  it("shows ellipsis near the end of large page sets", () => {
    nav.useSearchParams.mockReturnValue(new URLSearchParams({ page: "4" }));
    render(<PaginationControls totalPosts={60} />);

    expect(screen.getByText("More pages")).toBeInTheDocument();
  });

  it("removes the page query param when navigating to page one", () => {
    nav.useSearchParams.mockReturnValue(
      new URLSearchParams({ page: "2", tag: "news" }),
    );
    render(<PaginationControls totalPosts={36} />);

    expect(screen.getByRole("link", { name: "1" })).toHaveAttribute(
      "href",
      "/college/news?tag=news",
    );
  });
});
