import { render, screen, waitFor } from "@testing-library/react";

import { YouTubeEmbedComponent } from "@/components/youtube-embed";

vi.mock("react-player", () => ({
  __esModule: true,
  default: ({ src, playing }: { src: string; playing?: boolean }) => (
    <div
      data-testid="react-player"
      data-src={src}
      data-playing={String(playing)}
    />
  ),
}));

describe("YouTubeEmbedComponent", () => {
  it("renders an error state for empty URLs", () => {
    render(<YouTubeEmbedComponent url="" />);

    expect(screen.getByText("Invalid YouTube URL")).toBeInTheDocument();
  });

  it("renders an error state for invalid URLs", () => {
    render(<YouTubeEmbedComponent url="not-a-video" />);

    expect(screen.getByText("Invalid YouTube URL")).toBeInTheDocument();
    expect(
      screen.getByText("Please provide a valid YouTube video URL"),
    ).toBeInTheDocument();
  });

  it("shows a loading state before mount", () => {
    render(
      <YouTubeEmbedComponent url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />,
    );

    expect(screen.getByText("Loading video player...")).toBeInTheDocument();
  });

  it("renders the player after mount for supported URLs", async () => {
    render(
      <YouTubeEmbedComponent
        url="https://youtu.be/dQw4w9WgXcQ"
        autoplay
        className="custom-player"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("react-player")).toBeInTheDocument();
    });

    expect(screen.getByTestId("react-player")).toHaveAttribute(
      "data-src",
      "https://youtu.be/dQw4w9WgXcQ",
    );
    expect(screen.getByTestId("react-player")).toHaveAttribute(
      "data-playing",
      "true",
    );
  });

  it("parses YouTube shorts URLs", async () => {
    render(
      <YouTubeEmbedComponent url="https://www.youtube.com/shorts/abc123xyz" />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("react-player")).toBeInTheDocument();
    });
  });

  it("returns null for whitespace-only URLs before parsing", () => {
    render(<YouTubeEmbedComponent url="" />);
    expect(screen.getByText("Invalid YouTube URL")).toBeInTheDocument();
  });
});
