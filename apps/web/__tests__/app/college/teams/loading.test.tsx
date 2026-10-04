import { render, screen } from "@testing-library/react";

import TeamLoading from "@/app/college/teams/[slug]/loading";
import TeamsLoading from "@/app/college/teams/loading";

describe("Teams loading UIs", () => {
  it("renders the teams directory skeleton", () => {
    render(<TeamsLoading />);
    expect(screen.getByLabelText("Loading teams")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("renders the team page skeleton", () => {
    render(<TeamLoading />);
    expect(screen.getByLabelText("Loading team")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });
});
