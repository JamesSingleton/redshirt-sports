import { render, screen } from "@testing-library/react";

const { mockGetDynamicFetchOptions, mockGetPageMetadata } = vi.hoisted(() => ({
  mockGetDynamicFetchOptions: vi
    .fn()
    .mockResolvedValue({ perspective: "published", stega: false }),
  mockGetPageMetadata: vi.fn(() => ({ title: "Contact Us" })),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
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
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("@/components/contact-email-link", () => ({
  ContactEmailLink: ({ email }: { email: string }) => <a href={`mailto:${email}`}>{email}</a>,
}));

import ContactPage, { generateMetadata } from "@/app/contact/page";

describe("ContactPage", () => {
  it("generateMetadata calls getPageMetadata with contact fields", async () => {
    await generateMetadata();
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Contact Us", slug: "/contact" }),
      "published",
    );
  });

  it("renders contact cards with email links", () => {
    render(<ContactPage />);

    expect(screen.getByRole("heading", { name: "Contact Us" })).toBeInTheDocument();
    expect(screen.getByText("Collaborate")).toBeInTheDocument();
    expect(screen.getByText("Advertising")).toBeInTheDocument();
    expect(screen.getByText("General Inquiries")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "editors@redshirtsports.xyz" }),
    ).toHaveAttribute("href", "mailto:editors@redshirtsports.xyz");
  });
});
