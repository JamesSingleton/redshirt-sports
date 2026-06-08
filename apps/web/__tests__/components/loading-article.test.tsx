import { render } from "@testing-library/react";

import { LoadingArticle } from "@/components/loading-article";

describe("LoadingArticle", () => {
  it("renders skeleton placeholders", () => {
    const { container } = render(<LoadingArticle />);

    expect(
      container.querySelector(".animate-pulse, [class*='Skeleton']"),
    ).toBeTruthy();
    expect(container.firstChild).toBeInTheDocument();
  });
});
