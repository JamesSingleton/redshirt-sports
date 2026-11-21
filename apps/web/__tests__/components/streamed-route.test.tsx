import { render, screen } from "@testing-library/react";

import StreamedRouteLayout from "@/components/streamed-route";

describe("StreamedRouteLayout", () => {
  it("holds a screen's height around the route", () => {
    render(
      <StreamedRouteLayout>
        <p>content</p>
      </StreamedRouteLayout>,
    );
    expect(screen.getByText("content").parentElement).toHaveClass("min-h-dvh");
  });
});
