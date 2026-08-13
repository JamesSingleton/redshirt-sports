import { render } from "@testing-library/react";

import {
  ApplePodcastIcon,
  BlueSkyIcon,
  Facebook,
  Instagram,
  OvercastIcon,
  RSSIcon,
  SpotifyIcon,
  ThreadsIcon,
  Twitter,
  Website,
  YouTubeIcon,
} from "@/components/icons";

describe("icons", () => {
  it.each([
    ["Instagram", Instagram],
    ["Twitter", Twitter],
    ["Facebook", Facebook],
    ["Website", Website],
    ["SpotifyIcon", SpotifyIcon],
    ["ApplePodcastIcon", ApplePodcastIcon],
    ["OvercastIcon", OvercastIcon],
    ["RSSIcon", RSSIcon],
    ["YouTubeIcon", YouTubeIcon],
    ["BlueSkyIcon", BlueSkyIcon],
    ["ThreadsIcon", ThreadsIcon],
  ] as const)("renders %s with custom props", (_name, Icon) => {
    const { container } = render(
      <Icon className="test-icon" data-testid="icon" />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("test-icon");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
