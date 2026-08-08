import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const { mockDraftMode } = vi.hoisted(() => ({
  mockDraftMode: vi.fn().mockResolvedValue({ isEnabled: false }),
}));

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-sans" }),
  Geist_Mono: () => ({ variable: "--font-mono" }),
}));

vi.mock("next/headers", () => ({
  draftMode: mockDraftMode,
}));

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    preconnect: vi.fn(),
    prefetchDNS: vi.fn(),
  };
});

vi.mock("@redshirt-sports/analytics/provider", () => ({
  AnalyticsProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  SanityLive: (props: { waitFor?: string }) => (
    <div data-testid="sanity-live" data-wait-for={props.waitFor ?? ""} />
  ),
}));

vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => null,
}));

vi.mock("@redshirt-sports/ui/components/sonner", () => ({
  Toaster: () => null,
}));

vi.mock("next-sanity/visual-editing", () => ({
  VisualEditing: () => <div data-testid="visual-editing" />,
}));

vi.mock("@/components/disable-draft-mode", () => ({
  DisableDraftMode: () => <div data-testid="disable-draft" />,
}));

vi.mock("@/components/footer", () => ({
  CachedFooterServer: () => <footer data-testid="footer">Footer</footer>,
  DynamicFooterServer: () => <footer data-testid="dynamic-footer">Footer</footer>,
  FooterSkeleton: () => <footer data-testid="footer-skeleton" />,
}));

vi.mock("@/components/json-ld", () => ({
  CachedCombinedJsonLd: () => <script data-testid="json-ld" />,
  DynamicCombinedJsonLd: () => <script data-testid="dynamic-json-ld" />,
}));

vi.mock("@/components/navbar", () => ({
  CachedNavbarServer: () => <nav data-testid="navbar">Navbar</nav>,
  DynamicNavbarServer: () => <nav data-testid="dynamic-navbar">Navbar</nav>,
  NavbarSkeleton: () => <nav data-testid="navbar-skeleton" />,
}));

vi.mock("@/components/providers", () => ({
  Providers: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/seo", () => ({
  getRootMetadata: () => ({ title: "Redshirt Sports" }),
}));

import RootLayout, { metadata, viewport } from "@/app/layout";

describe("RootLayout", () => {
  beforeEach(() => {
    mockDraftMode.mockReset().mockResolvedValue({ isEnabled: false });
  });

  it("exports root metadata and viewport", () => {
    expect(metadata).toEqual({ title: "Redshirt Sports" });
    expect(viewport).toEqual({ themeColor: "#E80022" });
  });

  it("renders cached navbar, main content, and footer in published mode", async () => {
    const layout = await RootLayout({ children: <div>Page content</div> });
    render(layout);

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByTestId("json-ld")).toBeInTheDocument();
    expect(screen.queryByTestId("visual-editing")).not.toBeInTheDocument();
  });

  it("renders draft-mode UI when draft mode is enabled", async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: true });
    const layout = await RootLayout({ children: <div>Draft page</div> });
    render(layout);

    expect(screen.getByTestId("dynamic-navbar")).toBeInTheDocument();
    expect(screen.getByTestId("dynamic-footer")).toBeInTheDocument();
    expect(screen.getByTestId("visual-editing")).toBeInTheDocument();
    expect(screen.getByTestId("disable-draft")).toBeInTheDocument();
    expect(screen.getByTestId("dynamic-json-ld")).toBeInTheDocument();
  });

  it("uses production waitFor mode for SanityLive when VERCEL_ENV is production", async () => {
    const originalEnv = process.env.VERCEL_ENV;
    process.env.VERCEL_ENV = "production";

    const layout = await RootLayout({ children: <div>Prod page</div> });
    render(layout);

    expect(screen.getByTestId("sanity-live")).toHaveAttribute(
      "data-wait-for",
      "function",
    );
    process.env.VERCEL_ENV = originalEnv;
  });
});
