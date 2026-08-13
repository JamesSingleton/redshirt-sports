import { render, screen } from "@testing-library/react";

vi.mock("@redshirt-sports/auth/provider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

import AuthLayout from "@/app/(auth)/layout";

describe("AuthLayout", () => {
  it("wraps children in AuthProvider", () => {
    render(
      <AuthLayout>
        <span>child content</span>
      </AuthLayout>,
    );

    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
    expect(screen.getByText("child content")).toBeInTheDocument();
  });
});
