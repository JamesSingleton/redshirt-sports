import { render, screen } from "@testing-library/react";

import {
  CachedFooterServer,
  DynamicFooterServer,
  FooterSkeleton,
} from "@/components/footer";

const {
  mockResolveDynamicFetchOptions,
  mockSanityFetch,
  mockFetchGlobalSeoSettings,
} = vi.hoisted(() => ({
  mockResolveDynamicFetchOptions: vi.fn(),
  mockSanityFetch: vi.fn(),
  mockFetchGlobalSeoSettings: vi.fn(),
}));

vi.mock("@/lib/resolve-dynamic-fetch-options", () => ({
  resolveDynamicFetchOptions: mockResolveDynamicFetchOptions,
}));

vi.mock("@/lib/global-seo-settings", () => ({
  fetchGlobalSeoSettings: mockFetchGlobalSeoSettings,
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  PUBLISHED_FETCH_OPTIONS: {
    perspective: "published",
    stega: false,
  },
  cachedSanity: mockSanityFetch,
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    prefetch: _prefetch,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: ({ className }: { className?: string }) => (
    <img alt="footer-logo" data-testid="footer-logo" className={className} />
  ),
}));

vi.mock("@/components/copyright-year", () => ({
  CopyrightYear: () => new Date().getFullYear(),
}));

const footerData = {
  subtitle: "College sports coverage",
  columns: [
    {
      _key: "col-1",
      title: "Company",
      links: [
        {
          _key: "link-1",
          name: "About",
          href: "/about",
          openInNewTab: false,
        },
        {
          _key: "link-2",
          name: "Contact",
          href: "https://example.com/contact",
          openInNewTab: true,
        },
      ],
    },
  ],
};

const settingsData = {
  siteTitle: "Redshirt Sports",
  footerLogo: { alt: "Logo" },
  footerLogoDarkMode: { alt: "Logo dark" },
  socialLinks: {
    facebook: "https://facebook.com/redshirt",
    twitter: "https://twitter.com/redshirt",
    youtube: "https://youtube.com/redshirt",
    instagram: "https://instagram.com/redshirt",
    bluesky: "https://bsky.app/profile/redshirt",
    threads: "https://threads.net/redshirt",
  },
};

describe("FooterSkeleton", () => {
  it("renders the footer loading skeleton", () => {
    const { container } = render(<FooterSkeleton />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      5,
    );
  });
});

describe("CachedFooterServer", () => {
  beforeEach(() => {
    mockSanityFetch.mockReset();
    mockFetchGlobalSeoSettings.mockReset();
  });

  it("renders the skeleton when Sanity data is missing", async () => {
    mockSanityFetch.mockResolvedValue({ data: null });
    mockFetchGlobalSeoSettings.mockResolvedValue(null);
    const component = await CachedFooterServer({
      perspective: "published",
      stega: false,
    });
    const { container } = render(component);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("renders footer content with social links and columns", async () => {
    mockSanityFetch.mockResolvedValueOnce({ data: footerData });
    mockFetchGlobalSeoSettings.mockResolvedValueOnce(settingsData);

    const component = await CachedFooterServer({
      perspective: "published",
      stega: false,
    });
    render(component);

    expect(screen.getByText("College sports coverage")).toBeInTheDocument();
    expect(screen.getByText("About")).toHaveAttribute("href", "/about");
    expect(screen.getByText("Contact")).toHaveAttribute(
      "href",
      "https://example.com/contact",
    );
    expect(screen.getByLabelText("Follow us on Facebook")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Subscribe to our YouTube channel"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Redshirt Sports LLC\. All rights reserved\./),
    ).toHaveTextContent(
      `© ${new Date().getFullYear()} Redshirt Sports LLC. All rights reserved.`,
    );
  });

  it("omits social links when none are configured", async () => {
    mockSanityFetch.mockResolvedValueOnce({
      data: { subtitle: null, columns: [] },
    });
    mockFetchGlobalSeoSettings.mockResolvedValueOnce({
      ...settingsData,
      socialLinks: {
        facebook: null,
        twitter: null,
        youtube: null,
        instagram: null,
        bluesky: null,
        threads: null,
      },
    });

    const component = await CachedFooterServer({
      perspective: "published",
      stega: false,
    });
    render(component);

    expect(screen.queryByLabelText(/Follow us/i)).not.toBeInTheDocument();
  });

  it("renders footer links without href values using a fallback", async () => {
    mockSanityFetch.mockResolvedValueOnce({
      data: {
        subtitle: "Coverage",
        columns: [
          {
            _key: "col-1",
            title: "Links",
            links: [{ _key: "link-1", name: "Missing href", href: null }],
          },
        ],
      },
    });
    mockFetchGlobalSeoSettings.mockResolvedValueOnce(settingsData);

    const component = await CachedFooterServer({
      perspective: "published",
      stega: false,
    });
    render(component);

    expect(screen.getByText("Missing href")).toHaveAttribute("href", "#");
  });

  it("omits social links when socialLinks is null", async () => {
    mockSanityFetch.mockResolvedValueOnce({ data: footerData });
    mockFetchGlobalSeoSettings.mockResolvedValueOnce({
      ...settingsData,
      socialLinks: null,
    });

    const component = await CachedFooterServer({
      perspective: "published",
      stega: false,
    });
    render(component);

    expect(screen.queryByLabelText(/Follow us/i)).not.toBeInTheDocument();
  });

  it("omits link lists when a column has no links", async () => {
    mockSanityFetch.mockResolvedValueOnce({
      data: {
        ...footerData,
        columns: [{ _key: "empty-col", title: "Empty", links: [] }],
      },
    });
    mockFetchGlobalSeoSettings.mockResolvedValueOnce(settingsData);

    const component = await CachedFooterServer({
      perspective: "published",
      stega: false,
    });
    render(component);

    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "About" }),
    ).not.toBeInTheDocument();
  });

  it("uses a hash fallback for social links without URLs", async () => {
    mockSanityFetch.mockResolvedValueOnce({ data: footerData });
    mockFetchGlobalSeoSettings.mockResolvedValueOnce({
      ...settingsData,
      socialLinks: {
        facebook: "",
        twitter: "https://twitter.com/redshirt",
        youtube: null,
        instagram: null,
        bluesky: null,
        threads: null,
      },
    });

    const component = await CachedFooterServer({
      perspective: "published",
      stega: false,
    });
    render(component);

    expect(screen.getByLabelText("Follow us on Twitter")).toHaveAttribute(
      "href",
      "https://twitter.com/redshirt",
    );
  });
});

describe("DynamicFooterServer", () => {
  it("resolves fetch options before rendering the cached footer", async () => {
    mockResolveDynamicFetchOptions.mockResolvedValue({
      perspective: "published",
      stega: false,
    });

    const component = await DynamicFooterServer();

    expect(mockResolveDynamicFetchOptions).toHaveBeenCalled();
    expect(component).toBeTruthy();
  });
});
