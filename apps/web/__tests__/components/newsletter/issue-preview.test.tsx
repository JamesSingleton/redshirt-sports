import { render, screen } from "@testing-library/react";

import { IssuePreview } from "@/components/newsletter/issue-preview";

describe("IssuePreview", () => {
  it("shows placeholder rows while the headlines stream in", () => {
    const { container } = render(<IssuePreview posts={null} />);
    expect(container.querySelectorAll("li[aria-hidden]")).toHaveLength(5);
  });

  it("leaves out a missing sport", () => {
    render(
      <IssuePreview
        posts={[
          {
            _id: "p1",
            title: "A story",
            slug: "a-story",
            publishedAt: "2026-11-21T20:00:00.000Z",
            sport: null,
          },
        ]}
      />,
    );
    expect(screen.getByRole("listitem")).not.toHaveTextContent("·");
  });
});
