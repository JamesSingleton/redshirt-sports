const { mockNotFound } = vi.hoisted(() => ({
  mockNotFound: vi.fn(() => {
    throw new Error("not found");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

import { render, screen } from "@testing-library/react";

import DesignPage from "@/app/design/page";

describe("DesignPage", () => {
  beforeEach(() => {
    mockNotFound.mockClear();
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders the light and dark galleries", () => {
    render(<DesignPage />);
    expect(screen.getByRole("heading", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dark" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "1" })[0]).toHaveAttribute(
      "href",
      "/college/football/news",
    );
  });

  it("404s in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => render(<DesignPage />)).toThrow("not found");
    expect(mockNotFound).toHaveBeenCalled();
  });
});
