import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockGetDynamicFetchOptions,
  mockGetPageMetadata,
  mockSanityFetchPage,
  mockFetchGlobalSeoSettings,
} = vi.hoisted(() => ({
  mockGetDynamicFetchOptions: vi
    .fn()
    .mockResolvedValue({ perspective: "published", stega: false }),
  mockGetPageMetadata: vi.fn(() => ({ title: "Contact" })),
  mockSanityFetchPage: vi.fn().mockResolvedValue({
    data: { contactEmail: "editors@redshirtsports.com" },
  }),
  mockFetchGlobalSeoSettings: vi.fn().mockResolvedValue({ socialLinks: null }),
}));

vi.mock("@/lib/draft-cache", () => ({
  draftAwarePage: (
    _fallback: unknown,
    render: (options: {
      perspective: string;
      stega: boolean;
    }) => Promise<unknown>,
  ) => render({ perspective: "published", stega: false }),
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  PUBLISHED_FETCH_OPTIONS: {
    perspective: "published",
    stega: false,
  },
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  querySettingsData: "querySettingsData",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
  getSiteEmailDomain: () => "redshirtsports.com",
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
  fetchGlobalSeoSettings: mockFetchGlobalSeoSettings,
}));

vi.mock("@/components/json-ld", () => ({
  JsonLdScript: () => <script data-testid="json-ld" />,
  websiteId: "website-id",
}));

vi.mock("@/components/contact/contact-form", () => ({
  ContactForm: () => <div data-testid="contact-form" />,
}));

import ContactPage, { generateMetadata } from "@/app/contact/page";

describe("ContactPage", () => {
  it("generateMetadata calls getPageMetadata with contact fields", async () => {
    await generateMetadata();
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Contact", slug: "/contact" }),
      "published",
    );
  });

  it("falls back to contact@ domain email when settings email is blank", async () => {
    mockSanityFetchPage.mockResolvedValueOnce({
      data: { contactEmail: "   " },
    });
    const page = await ContactPage();
    render(page as ReactNode);

    const emailLinks = screen.getAllByRole("link", {
      name: /contact@redshirtsports\.com/i,
    });
    expect(emailLinks[0]).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:contact@redshirtsports.com"),
    );
  });

  it("renders social follow section when seo settings include links", async () => {
    mockFetchGlobalSeoSettings.mockResolvedValueOnce({
      socialLinks: { twitter: "https://twitter.com/redshirt" },
    });
    const page = await ContactPage();
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: /Follow Redshirt Sports/i }),
    ).toBeInTheDocument();
  });

  it("renders contact sections with email from settings", async () => {
    const page = await ContactPage();
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "Get in touch" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Who to contact")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
    const emailLinks = screen.getAllByRole("link", {
      name: /editors@redshirtsports\.com/i,
    });
    expect(emailLinks[0]).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:editors@redshirtsports.com"),
    );
    expect(screen.getByTestId("contact-form")).toBeInTheDocument();
  });
});
