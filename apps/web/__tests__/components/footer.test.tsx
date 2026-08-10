import { render, screen } from "@testing-library/react";

import {
  CachedFooterServer,
  DynamicFooterServer,
  FooterSkeleton,
} from "@/components/footer";

const { mockGetDynamicFetchOptions, mockSanityFetch } = vi.hoisted(() => ({
  mockGetDynamicFetchOptions: vi.fn(),
  mockSanityFetch: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
  sanityFetch: mockSanityFetch,
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
  });

  it("renders the skeleton when Sanity data is missing", async () => {
    mockSanityFetch.mockResolvedValue({ data: null });
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
    mockSanityFetch
      .mockResolvedValueOnce({ data: footerData })
      .mockResolvedValueOnce({ data: settingsData });

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
    expect(screen.getByText(/Redshirt Sports/)).toBeInTheDocument();
  });

  it("omits social links when none are configured", async () => {
    mockSanityFetch
      .mockResolvedValueOnce({ data: { subtitle: null, columns: [] } })
      .mockResolvedValueOnce({
        data: {
          ...settingsData,
          socialLinks: {
            facebook: null,
            twitter: null,
            youtube: null,
            instagram: null,
            bluesky: null,
            threads: null,
          },
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
    mockSanityFetch
      .mockResolvedValueOnce({
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
      })
      .mockResolvedValueOnce({ data: settingsData });

    const component = await CachedFooterServer({
      perspective: "published",
      stega: false,
    });
    render(component);

    expect(screen.getByText("Missing href")).toHaveAttribute("href", "#");
  });

  it("omits social links when socialLinks is null", async () => {
    mockSanityFetch
      .mockResolvedValueOnce({ data: footerData })
      .mockResolvedValueOnce({
        data: {
          ...settingsData,
          socialLinks: null,
        },
      });

    const component = await CachedFooterServer({
      perspective: "published",
      stega: false,
    });
    render(component);

    expect(screen.queryByLabelText(/Follow us/i)).not.toBeInTheDocument();
  });

  it("uses a hash fallback for social links without URLs", async () => {
    mockSanityFetch
      .mockResolvedValueOnce({ data: footerData })
      .mockResolvedValueOnce({
        data: {
          ...settingsData,
          socialLinks: {
            facebook: "",
            twitter: "https://twitter.com/redshirt",
            youtube: null,
            instagram: null,
            bluesky: null,
            threads: null,
          },
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
  it("loads dynamic fetch options before rendering the cached footer", async () => {
    mockGetDynamicFetchOptions.mockResolvedValue({
      perspective: "published",
      stega: false,
    });

    const component = await DynamicFooterServer();

    expect(mockGetDynamicFetchOptions).toHaveBeenCalled();
    expect(component).toBeTruthy();
  });
});
