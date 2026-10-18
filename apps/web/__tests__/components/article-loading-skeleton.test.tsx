import { render, screen } from "@testing-library/react";

import ArticlePageSkeleton from "@/components/article-loading-skeleton";

describe("ArticlePageSkeleton", () => {
  it("renders loading placeholders and status text", () => {
    render(<ArticlePageSkeleton />);

    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(5);
    expect(screen.getByText("Loading article...")).toBeInTheDocument();
  });
});
