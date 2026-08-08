import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const { mockSanityFetchPage, mockGetDynamicFetchOptions, mockGetPageMetadata } =
  vi.hoisted(() => ({
    mockSanityFetchPage: vi.fn(),
    mockGetDynamicFetchOptions: vi
      .fn()
      .mockResolvedValue({ perspective: "published", stega: false }),
    mockGetPageMetadata: vi.fn(() => ({ title: "Privacy Policy" })),
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
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  privacyPolicyQuery: "privacyPolicyQuery",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.xyz",
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("@/components/json-ld", () => ({
  JsonLdScript: () => <script data-testid="json-ld" />,
  websiteId: "website-id",
}));

vi.mock("@/components/page-header", () => ({
  __esModule: true,
  default: ({ title, subtitle }: { title: string; subtitle?: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {subtitle}
    </div>
  ),
}));

vi.mock("@/components/format-date", () => ({
  __esModule: true,
  default: ({ dateString }: { dateString: string }) => (
    <time>{dateString}</time>
  ),
}));

vi.mock("@/components/rich-text", () => ({
  RichText: ({ richText }: { richText: unknown }) => (
    <div data-testid="rich-text">{JSON.stringify(richText)}</div>
  ),
}));

import PrivacyPolicyPage, { generateMetadata } from "@/app/privacy-policy/page";

describe("PrivacyPolicyPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
  });

  it("generateMetadata calls getPageMetadata with privacy fields", async () => {
    await generateMetadata();
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Privacy Policy",
        slug: "/privacy-policy",
      }),
      "published",
    );
  });

  it("renders privacy policy content when data exists", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        _updatedAt: "2026-01-15T00:00:00Z",
        body: [{ _type: "block", children: [{ text: "Privacy content" }] }],
      },
    });

    const page = await PrivacyPolicyPage();
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "Privacy Policy" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2026-01-15T00:00:00Z")).toBeInTheDocument();
    expect(screen.getByTestId("rich-text")).toBeInTheDocument();
  });

  it("renders nothing when privacy policy data is missing", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: null });
    const page = await PrivacyPolicyPage();
    const { container } = render(page as ReactNode);
    expect(container.querySelector("h1")).not.toBeInTheDocument();
  });
});
