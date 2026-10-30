import { render, screen } from "@testing-library/react";
import { isValidElement, type ReactNode } from "react";

const { mockConnection, mockDraftMode, mockResolveDynamicFetchOptions } =
  vi.hoisted(() => ({
    mockConnection: vi.fn().mockResolvedValue(undefined),
    mockDraftMode: vi.fn().mockResolvedValue({ isEnabled: false }),
    mockResolveDynamicFetchOptions: vi
      .fn()
      .mockResolvedValue({ perspective: "published", stega: false }),
  }));

vi.mock("@/lib/resolve-dynamic-fetch-options", () => ({
  resolveDynamicFetchOptions: mockResolveDynamicFetchOptions,
}));

vi.mock("next/font/google", () => ({
  Barlow_Condensed: () => ({ variable: "--font-barlow" }),
  Inter: () => ({ variable: "--font-inter" }),
  Source_Serif_4: () => ({ variable: "--font-source-serif" }),
}));

vi.mock("@/app/fonts", () => ({
  fontBarlow: { variable: "--font-barlow" },
  fontInter: { variable: "--font-inter" },
  fontSourceSerif: { variable: "--font-source-serif" },
}));

vi.mock("next/headers", () => ({
  draftMode: mockDraftMode,
}));

vi.mock("next/server", () => ({
  connection: mockConnection,
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
  PUBLISHED_FETCH_OPTIONS: { perspective: "published", stega: false },
  SanityLive: (props: { waitFor?: string; includeDrafts?: boolean }) => (
    <div
      data-testid="sanity-live"
      data-wait-for={props.waitFor ?? ""}
      data-include-drafts={String(props.includeDrafts ?? false)}
    />
  ),
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
  DynamicFooterServer: () => (
    <footer data-testid="dynamic-footer">Footer</footer>
  ),
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
import {
  DraftAwareFooter,
  DraftAwareJsonLd,
  DraftAwareLiveAndEditing,
  DraftAwareNavbar,
} from "@/components/root-layout-chrome";

function findComponent(
  node: ReactNode,
  name: string,
): (() => Promise<unknown>) | null {
  if (!isValidElement(node)) {
    return null;
  }
  if (typeof node.type === "function" && node.type.name === name) {
    return node.type as () => Promise<unknown>;
  }
  const children = (node.props as { children?: ReactNode }).children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findComponent(child, name);
      if (found) {
        return found;
      }
    }
    return null;
  }
  return children ? findComponent(children, name) : null;
}

describe("RootLayout", () => {
  beforeEach(() => {
    mockConnection.mockClear();
    mockDraftMode.mockReset().mockResolvedValue({ isEnabled: false });
  });

  it("exports root metadata and viewport", () => {
    expect(metadata).toEqual({ title: "Redshirt Sports" });
    expect(viewport).toEqual({ themeColor: "#E80022" });
  });

  it("renders published navbar and footer in the shell", async () => {
    const layout = await RootLayout({ children: <div>Page content</div> });
    render(layout);

    expect(mockDraftMode).toHaveBeenCalled();
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByTestId("json-ld")).toBeInTheDocument();
    expect(screen.getByTestId("sanity-live")).toBeInTheDocument();
    expect(screen.queryByTestId("navbar-skeleton")).not.toBeInTheDocument();
    expect(screen.queryByTestId("visual-editing")).not.toBeInTheDocument();
    expect(screen.getByTestId("sanity-live")).not.toHaveAttribute(
      "data-wait-for",
      "function",
    );

    const marker = findComponent(layout, "MetadataConnectionMarker");
    if (!marker) {
      throw new Error("expected metadata connection marker");
    }
    await expect(marker()).resolves.toBeNull();
    expect(mockConnection).toHaveBeenCalled();
  });

  it("waits for Sanity functions in production", async () => {
    const originalEnv = process.env.VERCEL_ENV;
    process.env.VERCEL_ENV = "production";
    try {
      const layout = await RootLayout({ children: <div>Page content</div> });
      render(layout);
      expect(screen.getByTestId("sanity-live")).toHaveAttribute(
        "data-wait-for",
        "function",
      );
    } finally {
      process.env.VERCEL_ENV = originalEnv;
    }
  });

  it("streams draft chrome behind Suspense", async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: true });
    const layout = await RootLayout({ children: <div>Page content</div> });
    render(layout);

    expect(screen.getByTestId("navbar-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("footer-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("visual-editing")).toBeInTheDocument();
    expect(screen.getByTestId("disable-draft")).toBeInTheDocument();
  });
});

describe("DraftAware layout chrome", () => {
  beforeEach(() => {
    mockDraftMode.mockReset().mockResolvedValue({ isEnabled: false });
  });

  it("renders cached navbar, footer, and json-ld in published mode", async () => {
    render(await DraftAwareNavbar());
    expect(screen.getByTestId("navbar")).toBeInTheDocument();

    render(await DraftAwareFooter());
    expect(screen.getByTestId("footer")).toBeInTheDocument();

    render(await DraftAwareJsonLd());
    expect(screen.getByTestId("json-ld")).toBeInTheDocument();

    render(await DraftAwareLiveAndEditing());
    expect(screen.getByTestId("sanity-live")).toBeInTheDocument();
    expect(screen.queryByTestId("visual-editing")).not.toBeInTheDocument();
  });

  it("renders draft-mode UI when draft mode is enabled", async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: true });
    mockResolveDynamicFetchOptions.mockResolvedValue({
      perspective: "previewDrafts",
      stega: true,
    });

    render(await DraftAwareNavbar());
    expect(screen.getByTestId("navbar")).toBeInTheDocument();

    render(await DraftAwareFooter());
    expect(screen.getByTestId("footer")).toBeInTheDocument();

    render(await DraftAwareJsonLd());
    expect(screen.getByTestId("json-ld")).toBeInTheDocument();

    render(await DraftAwareLiveAndEditing());
    expect(screen.getByTestId("visual-editing")).toBeInTheDocument();
    expect(screen.getByTestId("disable-draft")).toBeInTheDocument();
  });

  it("uses production waitFor mode for SanityLive when VERCEL_ENV is production", async () => {
    const originalEnv = process.env.VERCEL_ENV;
    process.env.VERCEL_ENV = "production";

    render(await DraftAwareLiveAndEditing());

    expect(screen.getByTestId("sanity-live")).toHaveAttribute(
      "data-wait-for",
      "function",
    );
    process.env.VERCEL_ENV = originalEnv;
  });
});
