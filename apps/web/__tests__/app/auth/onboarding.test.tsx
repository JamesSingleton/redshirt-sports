import { render, screen } from "@testing-library/react";

vi.mock("@/components/forms/onboarding", () => ({
  __esModule: true,
  default: () => <div data-testid="onboarding-form">Onboarding Form</div>,
}));

import OnboardingPage, { metadata } from "@/app/(auth)/onboarding/page";

describe("OnboardingPage", () => {
  it("exports noindex metadata", () => {
    expect(metadata.robots).toEqual(
      expect.objectContaining({ index: false, follow: false }),
    );
  });

  it("renders onboarding form inside suspense", async () => {
    const page = await OnboardingPage();
    render(page);
    expect(screen.getByTestId("onboarding-form")).toBeInTheDocument();
  });
});
