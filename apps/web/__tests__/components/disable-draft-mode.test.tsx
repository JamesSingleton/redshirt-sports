import { render, screen } from "@testing-library/react";

import { DisableDraftMode } from "@/components/disable-draft-mode";

const mockUseIsPresentationTool = vi.fn();

vi.mock("next-sanity/hooks", () => ({
  useIsPresentationTool: () => mockUseIsPresentationTool(),
}));

describe("DisableDraftMode", () => {
  it("renders the disable link outside the presentation tool", () => {
    mockUseIsPresentationTool.mockReturnValue(false);

    render(<DisableDraftMode />);

    expect(screen.getByRole("link", { name: "Disable Draft Mode" })).toHaveAttribute(
      "href",
      "/api/draft-mode/disable",
    );
  });

  it("returns null inside the presentation tool", () => {
    mockUseIsPresentationTool.mockReturnValue(true);

    const { container } = render(<DisableDraftMode />);

    expect(container).toBeEmptyDOMElement();
  });
});
