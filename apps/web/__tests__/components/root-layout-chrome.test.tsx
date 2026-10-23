import { render, screen } from "@testing-library/react";

const { mockResolveDynamicFetchOptions } = vi.hoisted(() => ({
  mockResolveDynamicFetchOptions: vi
    .fn()
    .mockResolvedValue({ perspective: "published", stega: false }),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  SanityLive: () => null,
}));

vi.mock("next-sanity/visual-editing", () => ({
  VisualEditing: () => null,
}));

vi.mock("next/headers", () => ({
  draftMode: vi.fn().mockResolvedValue({ isEnabled: false }),
}));

vi.mock("@/components/disable-draft-mode", () => ({
  DisableDraftMode: () => null,
}));

vi.mock("@/lib/resolve-dynamic-fetch-options", () => ({
  resolveDynamicFetchOptions: mockResolveDynamicFetchOptions,
}));

vi.mock("@/components/navbar", () => ({
  CachedNavbarServer: () => <nav data-testid="navbar" />,
}));

vi.mock("@/components/footer", () => ({
  CachedFooterServer: () => <footer data-testid="footer" />,
}));

vi.mock("@/components/json-ld", () => ({
  CachedCombinedJsonLd: () => <script data-testid="json-ld" />,
}));

import {
  DraftAwareFooter,
  DraftAwareJsonLd,
  DraftAwareNavbar,
} from "@/components/root-layout-chrome";

describe("root layout chrome", () => {
  it("resolves fetch options once per chrome segment", async () => {
    render(await DraftAwareNavbar());
    render(await DraftAwareFooter());
    render(await DraftAwareJsonLd());

    expect(mockResolveDynamicFetchOptions).toHaveBeenCalledTimes(3);
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByTestId("json-ld")).toBeInTheDocument();
  });
});
