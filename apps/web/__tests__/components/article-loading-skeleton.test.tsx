import { render } from "@testing-library/react";

import ArticlePageSkeleton from "@/components/article-loading-skeleton";

describe("ArticlePageSkeleton", () => {
  it("renders a busy article layout with body and Top 25 placeholders", () => {
    const { container } = render(<ArticlePageSkeleton />);

    const root = container.firstElementChild;
    expect(root).toHaveAttribute("aria-busy", "true");

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(10);
    expect(
      container.querySelector('[data-slot="skeleton"].aspect-video'),
    ).toBeInTheDocument();
  });
});
