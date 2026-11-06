import { render } from "@testing-library/react";

const { mockCapture, mockIdentify, mockUseUser } = vi.hoisted(() => ({
  mockCapture: vi.fn(),
  mockIdentify: vi.fn(),
  mockUseUser: vi.fn(),
}));

vi.mock("@redshirt-sports/analytics", () => ({
  analytics: { capture: mockCapture, identify: mockIdentify },
}));

vi.mock("@redshirt-sports/auth/client", () => ({
  useUser: () => mockUseUser(),
}));

import { AuthAnalytics } from "@/components/analytics/auth-analytics";

describe("AuthAnalytics", () => {
  beforeEach(() => {
    mockCapture.mockClear();
    mockIdentify.mockClear();
    window.sessionStorage.clear();
  });

  it("does nothing until Clerk has loaded", () => {
    mockUseUser.mockReturnValue({ isLoaded: false });
    render(<AuthAnalytics />);

    expect(mockIdentify).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("does nothing for signed-out visitors", () => {
    mockUseUser.mockReturnValue({ isLoaded: true, isSignedIn: false });
    render(<AuthAnalytics />);

    expect(mockIdentify).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("identifies the Clerk user and fires sign_in_completed once per session", () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: { id: "user_123" },
    });

    const { unmount } = render(<AuthAnalytics />);
    expect(mockIdentify).toHaveBeenCalledWith("user_123");
    expect(mockCapture).toHaveBeenCalledWith("sign_in_completed");

    unmount();
    mockCapture.mockClear();
    render(<AuthAnalytics />);

    expect(mockIdentify).toHaveBeenCalledTimes(2);
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("still fires sign_in_completed when sessionStorage is blocked", () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: { id: "user_123" },
    });
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });

    render(<AuthAnalytics />);

    expect(mockCapture).toHaveBeenCalledWith("sign_in_completed");
    getItem.mockRestore();
  });
});
