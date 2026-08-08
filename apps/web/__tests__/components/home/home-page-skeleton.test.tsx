import { render } from "@testing-library/react";

import HomePageSkeleton from "@/components/home/home-page-skeleton";

describe("HomePageSkeleton", () => {
  it("renders hero, latest news, and article section skeletons", () => {
    const { container } = render(<HomePageSkeleton />);

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(10);
  });
});
