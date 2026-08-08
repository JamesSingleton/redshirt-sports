import { render, screen } from "@testing-library/react";

vi.mock("@redshirt-sports/auth/components/sign-in", () => ({
  SignIn: () => <div data-testid="sign-in">Sign In</div>,
}));

import SignInPage, { metadata } from "@/app/(auth)/sign-in/[[...sign-in]]/page";

describe("SignInPage", () => {
  it("exports noindex metadata", () => {
    expect(metadata.robots).toEqual(
      expect.objectContaining({ index: false, follow: false }),
    );
  });

  it("renders the sign-in component", () => {
    render(<SignInPage />);
    expect(screen.getByTestId("sign-in")).toBeInTheDocument();
  });
});
