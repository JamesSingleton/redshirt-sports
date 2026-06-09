import { render, screen } from "@testing-library/react";

import ArticlePageSkeleton from "@/components/article-loading-skeleton";

describe("ArticlePageSkeleton", () => {
  it("renders loading placeholders and status text", () => {
    render(<ArticlePageSkeleton />);

    expect(screen.getAllByText("Written By").length).toBeGreaterThan(0);
    expect(screen.getByText("Loading article...")).toBeInTheDocument();
  });
});
