import { render, screen } from "@testing-library/react";

import VoteHomePage from "@/app/page";

describe("vote home", () => {
  it("shares a button from the UI package and links to sign-in", () => {
    render(<VoteHomePage />);
    expect(
      screen.getByRole("heading", { name: "Redshirt Sports Vote" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });
});
