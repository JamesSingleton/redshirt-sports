import { render, screen } from "@testing-library/react";

import ArticlePageSkeleton from "@/components/article-loading-skeleton";

describe("ArticlePageSkeleton", () => {
  it("renders loading placeholders and status text", () => {
    const { container } = render(<ArticlePageSkeleton />);

    expect(screen.getByText("Loading article...")).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});
