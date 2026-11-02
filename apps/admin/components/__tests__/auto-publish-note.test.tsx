import { render, screen } from "@testing-library/react";

import { AutoPublishNote } from "@/components/auto-publish-note";

describe("AutoPublishNote", () => {
  it("flags a week that would be skipped", () => {
    render(
      <AutoPublishNote
        label={{ text: "No ballots in for Week 10 yet", tone: "warning" }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "No ballots in for Week 10 yet",
    );
  });

  it.each([
    ["scheduled", "font-medium"],
    ["muted", "text-muted-foreground"],
  ] as const)("renders a %s note quietly", (tone, className) => {
    render(<AutoPublishNote label={{ text: "Next run", tone }} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Next run")).toHaveClass(className);
  });
});
