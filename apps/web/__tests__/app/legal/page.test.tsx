import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockSanityFetchPage,
  mockSanityFetchMetadata,
  mockSanityFetchStaticParams,
  mockGetPageMetadata,
  mockNotFound,
} = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
  mockSanityFetchMetadata: vi.fn(),
  mockSanityFetchStaticParams: vi.fn(),
  mockGetPageMetadata: vi.fn(() => ({ title: "Legal" })),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/draft-cache", () => ({
  draftAwareParamsPage: (
    params: Promise<{ slug: string }>,
    _fallback: unknown,
    render: (
      resolved: { slug: string },
      options: { perspective: string; stega: boolean },
    ) => Promise<unknown>,
  ) =>
    params.then((resolved) =>
      render(resolved, { perspective: "published", stega: false }),
    ),
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  PUBLISHED_FETCH_OPTIONS: { perspective: "published", stega: false },
  sanityFetchMetadata: mockSanityFetchMetadata,
  sanityFetchStaticParams: mockSanityFetchStaticParams,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  queryLegalDocumentBySlug: "queryLegalDocumentBySlug",
  queryLegalDocumentPaths: "queryLegalDocumentPaths",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("@/components/json-ld", () => ({
  JsonLdScript: () => <script data-testid="json-ld" />,
  organizationId: "organization-id",
  websiteId: "website-id",
}));

vi.mock("@/components/rich-text", () => ({
  richTextComponents: {},
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import LegalDocumentPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/legal/[slug]/page";

function block(key: string, style: string, text: string) {
  return {
    _type: "block",
    _key: key,
    style,
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-span`, text, marks: [] }],
  };
}

const termsOfService = {
  _id: "terms",
  _type: "legal",
  title: "Terms of Service",
  slug: "terms-of-service",
  summary: "The rules for using Redshirt Sports.",
  effectiveDate: "2026-09-01",
  lastUpdated: "2026-10-01",
  body: [
    block("h-1", "h2", "Acceptance of Terms"),
    block("p-1", "normal", "By using the site you agree."),
    block("h-2", "h2", "Governing Law"),
    block("h-3", "h3", "Venue"),
    block("h-4", "h4", "Exceptions"),
    block("p-2", "normal", "Arizona law applies."),
  ],
  otherDocuments: [
    { _id: "privacy", title: "Privacy Policy", slug: "privacy-policy" },
  ],
};

const legacyPrivacyPolicy = {
  _id: "privacy",
  _type: "legal",
  title: "Privacy Policy",
  slug: "privacy-policy",
  summary: null,
  effectiveDate: null,
  lastUpdated: null,
  body: [block("p-1", "normal", "We respect your privacy.")],
  otherDocuments: [],
};

async function renderPage(slug = "terms-of-service") {
  const page = await LegalDocumentPage({ params: Promise.resolve({ slug }) });
  return render(page as ReactNode);
}

describe("LegalDocumentPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockSanityFetchMetadata.mockReset();
    mockSanityFetchStaticParams.mockReset();
    mockNotFound.mockClear();
  });

  it("generateStaticParams returns one entry per legal document", async () => {
    mockSanityFetchStaticParams.mockResolvedValue({
      data: [{ slug: "privacy-policy" }, { slug: "terms-of-service" }],
    });

    await expect(generateStaticParams()).resolves.toEqual([
      { slug: "privacy-policy" },
      { slug: "terms-of-service" },
    ]);
  });

  it("generateStaticParams returns an empty list when there is no data", async () => {
    mockSanityFetchStaticParams.mockResolvedValue({ data: null });
    await expect(generateStaticParams()).resolves.toEqual([]);
  });

  it("generateMetadata calls notFound for an unknown document", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: null });
    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateMetadata omits the description when there is no summary", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: legacyPrivacyPolicy });

    await generateMetadata({
      params: Promise.resolve({ slug: "privacy-policy" }),
    });

    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      {
        title: "Privacy Policy",
        description: undefined,
        slug: "/legal/privacy-policy",
      },
      "published",
    );
  });

  it("generateMetadata uses the document title, summary, and legal path", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: termsOfService });

    await generateMetadata({
      params: Promise.resolve({ slug: "terms-of-service" }),
    });

    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      {
        title: "Terms of Service",
        description: "The rules for using Redshirt Sports.",
        slug: "/legal/terms-of-service",
      },
      "published",
    );
  });

  it("renders the document with dates, anchored sections, and a table of contents", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: termsOfService });

    await renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Terms of Service" }),
    ).toBeInTheDocument();
    expect(screen.getByText("September 1, 2026")).toBeInTheDocument();
    expect(screen.getByText("October 1, 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Governing Law" }),
    ).toHaveAttribute("id", "governing-law");

    const toc = screen.getByRole("navigation", { name: "On this page" });
    expect(
      within(toc).getByRole("link", { name: /Governing Law/ }),
    ).toHaveAttribute("href", "#governing-law");

    const otherDocs = screen.getByRole("navigation", {
      name: "Other legal documents",
    });
    expect(
      within(otherDocs).getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/legal/privacy-policy");
  });

  it("hides the last updated date when it matches the effective date", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: { ...termsOfService, lastUpdated: termsOfService.effectiveDate },
    });

    await renderPage();

    expect(screen.queryByText("Last updated")).not.toBeInTheDocument();
  });

  it("renders a document that has not been filled in with the new fields yet", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: legacyPrivacyPolicy });

    const { container } = await renderPage("privacy-policy");

    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeInTheDocument();
    expect(screen.getByText("We respect your privacy.")).toBeInTheDocument();
    expect(container.querySelector("dl")).not.toBeInTheDocument();
    expect(container.querySelector("details")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "On this page" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Other legal documents" }),
    ).not.toBeInTheDocument();
  });

  it("calls notFound when the document does not exist", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: null });

    await expect(renderPage("missing")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });
});
