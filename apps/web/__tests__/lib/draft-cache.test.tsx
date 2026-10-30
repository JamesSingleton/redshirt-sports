import { isValidElement, Suspense } from "react";

const { mockDraftMode, mockGetDynamicFetchOptions } = vi.hoisted(() => ({
  mockDraftMode: vi.fn(),
  mockGetDynamicFetchOptions: vi.fn(),
}));

vi.mock("next/headers", () => ({
  draftMode: mockDraftMode,
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  PUBLISHED_FETCH_OPTIONS: {
    perspective: "published",
    stega: false,
  },
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
}));

import {
  draftAwarePage,
  draftAwareParamsPage,
  draftAwareSearchParamsPage,
  searchParamsPage,
} from "@/lib/draft-cache";

describe("draftAwarePage", () => {
  beforeEach(() => {
    mockDraftMode.mockReset();
    mockGetDynamicFetchOptions.mockReset();
  });

  it("renders published content without Suspense", async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: false });
    const result = await draftAwarePage(null, async () => <div>content</div>);
    if (!isValidElement(result)) {
      throw new Error("expected element");
    }
    expect(result.type).not.toBe(Suspense);
  });

  it("passes published options when draft mode is off", async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: false });
    const renderFn = vi.fn(async () => <div>ok</div>);

    await draftAwarePage(null, renderFn);

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

    const tree = await draftAwarePage(null, renderFn);
    if (!isValidElement(tree)) {
      throw new Error("expected element");
    }
    expect(tree.type).toBe(Suspense);
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

  it("renders published params content without Suspense when prerendering", async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: false });
    const renderFn = vi.fn(async () => <div>published</div>);
    const tree = await draftAwareParamsPage(
      Promise.resolve({ slug: "hello" }),
      null,
      renderFn,
      { prerenderPublished: true },
    );
    if (!isValidElement(tree)) {
      throw new Error("expected element");
    }
    expect(tree.type).not.toBe(Suspense);
    expect(renderFn).toHaveBeenCalledWith(
      { slug: "hello" },
      { perspective: "published", stega: false },
    );
  });

  it("keeps draft params behind Suspense when prerendering published content", async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: true });
    mockGetDynamicFetchOptions.mockResolvedValue({
      perspective: "previewDrafts",
      stega: true,
    });
    const renderFn = vi.fn(async () => <div>draft</div>);
    const tree = await draftAwareParamsPage(
      Promise.resolve({ slug: "hello" }),
      null,
      renderFn,
      { prerenderPublished: true },
    );
    if (!isValidElement(tree)) {
      throw new Error("expected element");
    }
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

    expect(mockGetDynamicFetchOptions).toHaveBeenCalled();
    expect(renderFn).toHaveBeenCalledWith(
      { slug: "hello" },
      { perspective: "previewDrafts", stega: true },
    );
  });
});

describe("draftAwareSearchParamsPage", () => {
  beforeEach(() => {
    mockDraftMode.mockReset();
    mockGetDynamicFetchOptions.mockReset();
  });

  it("passes published options when draft mode is off", async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: false });
    const renderFn = vi.fn(async () => <div>archive</div>);
    const tree = draftAwareSearchParamsPage(
      Promise.resolve({ page: "2" }),
      null,
      renderFn,
    );

    expect(isValidElement(tree)).toBe(true);
    expect(tree.type).toBe(Suspense);

    const child = (tree.props as { children: React.ReactElement }).children;
    await (
      child.type as (p: {
        searchParams: Promise<{ page: string }>;
        render: typeof renderFn;
      }) => Promise<unknown>
    )({
      searchParams: Promise.resolve({ page: "2" }),
      render: renderFn,
    });

    expect(renderFn).toHaveBeenCalledWith(
      { page: "2" },
      { perspective: "published", stega: false },
    );
  });

  it("loads dynamic fetch options when draft mode is on", async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: true });
    mockGetDynamicFetchOptions.mockResolvedValue({
      perspective: "previewDrafts",
      stega: true,
    });
    const renderFn = vi.fn(async () => <div>draft archive</div>);
    const tree = draftAwareSearchParamsPage(
      Promise.resolve({}),
      null,
      renderFn,
    );
    const child = (tree.props as { children: React.ReactElement }).children;
    await (
      child.type as (p: {
        searchParams: Promise<Record<string, never>>;
        render: typeof renderFn;
      }) => Promise<unknown>
    )({
      searchParams: Promise.resolve({}),
      render: renderFn,
    });

    expect(mockGetDynamicFetchOptions).toHaveBeenCalled();
    expect(renderFn).toHaveBeenCalledWith(
      {},
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
