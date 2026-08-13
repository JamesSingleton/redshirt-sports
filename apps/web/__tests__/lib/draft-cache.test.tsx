import { isValidElement, Suspense } from "react";

const { mockDraftMode, mockGetDynamicFetchOptions } = vi.hoisted(() => ({
  mockDraftMode: vi.fn(),
  mockGetDynamicFetchOptions: vi.fn(),
}));

vi.mock("next/headers", () => ({
  draftMode: mockDraftMode,
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
}));

import {
  draftAwarePage,
  draftAwareParamsPage,
  searchParamsPage,
} from "@/lib/draft-cache";

describe("draftAwarePage", () => {
  beforeEach(() => {
    mockDraftMode.mockReset();
    mockGetDynamicFetchOptions.mockReset();
  });

  it("always wraps content in Suspense", () => {
    mockDraftMode.mockResolvedValue({ isEnabled: false });
    const result = draftAwarePage(null, async () => <div>content</div>);
    expect(isValidElement(result)).toBe(true);
    expect(result.type).toBe(Suspense);
  });

  it("passes published options when draft mode is off", async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: false });
    const renderFn = vi.fn(async () => <div>ok</div>);

    const tree = draftAwarePage(null, renderFn);
    // Invoke the Suspense child (DraftAwareRender) directly
    const child = (tree.props as { children: React.ReactElement }).children;
    await (child.type as (p: { render: typeof renderFn }) => Promise<unknown>)({
      render: renderFn,
    });

    expect(renderFn).toHaveBeenCalledWith({
      perspective: "published",
      stega: false,
    });
    expect(mockGetDynamicFetchOptions).not.toHaveBeenCalled();
  });

  it("calls getDynamicFetchOptions when draft mode is on", async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: true });
    mockGetDynamicFetchOptions.mockResolvedValue({
      perspective: "previewDrafts",
      stega: true,
    });
    const renderFn = vi.fn(async () => <div>draft</div>);

    const tree = draftAwarePage(null, renderFn);
    const child = (tree.props as { children: React.ReactElement }).children;
    await (child.type as (p: { render: typeof renderFn }) => Promise<unknown>)({
      render: renderFn,
    });

    expect(mockGetDynamicFetchOptions).toHaveBeenCalled();
    expect(renderFn).toHaveBeenCalledWith({
      perspective: "previewDrafts",
      stega: true,
    });
  });
});

describe("draftAwareParamsPage", () => {
  beforeEach(() => {
    mockDraftMode.mockReset();
    mockGetDynamicFetchOptions.mockReset();
  });

  it("wraps in Suspense and resolves published options for params", async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: false });
    const renderFn = vi.fn(async () => <div>ok</div>);

    const tree = draftAwareParamsPage(
      Promise.resolve({ slug: "hello" }),
      null,
      renderFn,
    );
    expect(isValidElement(tree)).toBe(true);
    expect(tree.type).toBe(Suspense);

    const child = (tree.props as { children: React.ReactElement }).children;
    await (
      child.type as (p: {
        params: Promise<{ slug: string }>;
        render: typeof renderFn;
      }) => Promise<unknown>
    )({
      params: Promise.resolve({ slug: "hello" }),
      render: renderFn,
    });

    expect(renderFn).toHaveBeenCalledWith(
      { slug: "hello" },
      { perspective: "published", stega: false },
    );
  });

  it("uses getDynamicFetchOptions when draft mode is on for params", async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: true });
    mockGetDynamicFetchOptions.mockResolvedValue({
      perspective: "previewDrafts",
      stega: true,
    });
    const renderFn = vi.fn(async () => <div>draft</div>);

    const tree = draftAwareParamsPage(
      Promise.resolve({ slug: "hello" }),
      null,
      renderFn,
    );
    const child = (tree.props as { children: React.ReactElement }).children;
    await (
      child.type as (p: {
        params: Promise<{ slug: string }>;
        render: typeof renderFn;
      }) => Promise<unknown>
    )({
      params: Promise.resolve({ slug: "hello" }),
      render: renderFn,
    });

    expect(mockGetDynamicFetchOptions).toHaveBeenCalled();
    expect(renderFn).toHaveBeenCalledWith(
      { slug: "hello" },
      { perspective: "previewDrafts", stega: true },
    );
  });
});

describe("searchParamsPage", () => {
  it("wraps render in Suspense and invokes it", async () => {
    const renderFn = vi.fn(async () => <div>search</div>);
    const tree = searchParamsPage(null, renderFn);

    expect(isValidElement(tree)).toBe(true);
    expect(tree.type).toBe(Suspense);

    const child = (tree.props as { children: React.ReactElement }).children;
    await (child.type as (p: { render: typeof renderFn }) => Promise<unknown>)({
      render: renderFn,
    });

    expect(renderFn).toHaveBeenCalled();
  });
});
