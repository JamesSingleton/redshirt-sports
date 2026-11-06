import { fireEvent, render, screen } from "@testing-library/react";

const { mockCapture } = vi.hoisted(() => ({ mockCapture: vi.fn() }));

vi.mock("@redshirt-sports/analytics", () => ({
  analytics: { capture: mockCapture },
}));

import { YouTubeEmbedComponent } from "@/components/youtube-embed";

describe("YouTubeEmbedComponent analytics", () => {
  beforeEach(() => mockCapture.mockClear());

  it("fires video_played when the reader clicks play", () => {
    render(
      <YouTubeEmbedComponent
        url="https://youtu.be/dQw4w9WgXcQ"
        title="Game highlights"
      />,
    );
    expect(mockCapture).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /play video/i }));

    expect(mockCapture).toHaveBeenCalledWith("video_played", {
      video_id: "dQw4w9WgXcQ",
      video_title: "Game highlights",
      page_path: window.location.pathname,
    });
  });
});
