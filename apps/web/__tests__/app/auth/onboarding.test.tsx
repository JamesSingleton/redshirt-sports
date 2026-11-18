vi.mock("@/components/forms/onboarding", () => ({
  __esModule: true,
  default: () => <div data-testid="onboarding-form">Onboarding Form</div>,
}));

import { metadata } from "@/app/(auth)/onboarding/page";

describe("OnboardingPage", () => {
  it("exports noindex metadata", () => {
    expect(metadata.robots).toEqual(
      expect.objectContaining({ index: false, follow: false }),
    );
  });
});
