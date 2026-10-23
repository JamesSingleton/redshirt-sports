import { render, screen } from "@testing-library/react";

import ArticlePageSkeleton from "@/components/article-loading-skeleton";

describe("ArticlePageSkeleton", () => {
  it("renders loading placeholders and status text", () => {
    render(<ArticlePageSkeleton />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});
