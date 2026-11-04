import { fireEvent, render, screen } from "@testing-library/react";

import { YouTubeEmbedComponent } from "@/components/youtube-embed";

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

  it("does not load YouTube until the reader clicks play", () => {
    const { container } = render(
      <YouTubeEmbedComponent url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />,
    );

    expect(
      screen.getByRole("button", { name: /play video/i }),
    ).toBeInTheDocument();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("loads the privacy-enhanced player after the click", () => {
    const { container } = render(
      <YouTubeEmbedComponent
        url="https://youtu.be/dQw4w9WgXcQ"
        title="Game highlights"
        className="custom-player"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /play video/i }));

    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
    );
    expect(iframe).toHaveAttribute("title", "Game highlights");
    expect(container.firstChild).toHaveClass("custom-player");
  });

  it("loads immediately when autoplay is requested", () => {
    const { container } = render(
      <YouTubeEmbedComponent url="https://youtu.be/dQw4w9WgXcQ" autoplay />,
    );

    expect(container.querySelector("iframe")).not.toBeNull();
  });

  it("parses YouTube shorts URLs", () => {
    const { container } = render(
      <YouTubeEmbedComponent
        url="https://www.youtube.com/shorts/abc123xyz"
        autoplay
      />,
    );

    expect(container.querySelector("iframe")).toHaveAttribute(
      "src",
      expect.stringContaining("/embed/abc123xyz"),
    );
  });
});
