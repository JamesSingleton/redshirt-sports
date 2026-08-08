import { render, screen } from "@testing-library/react";

vi.mock("@redshirt-sports/auth/components/sign-up", () => ({
  SignUp: () => <div data-testid="sign-up">Sign Up</div>,
}));

import SignUpPage, { metadata } from "@/app/(auth)/sign-up/[[...sign-up]]/page";

describe("SignUpPage", () => {
  it("exports noindex metadata", () => {
    expect(metadata.robots).toEqual(
      expect.objectContaining({ index: false, follow: false }),
    );
  });

  it("renders the sign-up component", () => {
    render(<SignUpPage />);
    expect(screen.getByTestId("sign-up")).toBeInTheDocument();
  });
});
