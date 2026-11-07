import { cacheLife, cacheTag } from "next/cache";

const { mockFetchWithoutSyncTags } = vi.hoisted(() => ({
  mockFetchWithoutSyncTags: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  fetchWithoutSyncTags: mockFetchWithoutSyncTags,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  postsByAuthor: "postsByAuthor",
  postsBySchoolQuery: "postsBySchoolQuery",
  queryArticleLists: "queryArticleLists",
}));

import {
  articleListParams,
  getCachedArticleLists,
  getCachedAuthorPosts,
  getCachedSchoolPosts,
} from "@/lib/post-lists";

const published = { perspective: "published", stega: false } as const;
const draft = { perspective: "drafts", stega: true } as const;
/** Presentation's published view: published perspective, but stega on. */
const publishedStega = { perspective: "published", stega: true } as const;

describe("post-lists", () => {
  beforeEach(() => {
    vi.mocked(cacheTag).mockClear();
    vi.mocked(cacheLife).mockClear();
    mockFetchWithoutSyncTags.mockReset();
  });

  it("articleListParams collects the article's reference ids", () => {
    expect(
      articleListParams({
        _id: "post-1",
        publishedAt: "2026-11-01T00:00:00Z",
        sport: { _id: "sport-1" },
        conferences: [{ _id: "conf-1" }],
        tags: [{ _id: "tag-1" }, null],
        teams: [{ _id: "school-1" }],
        authors: [{ _id: "author-1" }],
      } as unknown as Parameters<typeof articleListParams>[0]),
    ).toEqual({
      postId: "post-1",
      publishedAt: "2026-11-01T00:00:00Z",
      sportId: "sport-1",
      conferenceIds: ["conf-1"],
      tagIds: ["tag-1"],
      teamIds: ["school-1"],
      authorIds: ["author-1"],
    });
  });

  it("tags article lists by each listed post, never the any-post tag", async () => {
    mockFetchWithoutSyncTags.mockResolvedValue({
      data: {
        relatedPosts: [{ _id: "a" }, { _id: "b" }],
        upNextInFeed: { _id: "c" },
        moreFromAuthor: [{ _id: "a" }],
      },
    });
    await getCachedArticleLists({
      params: articleListParams({
        _id: "post-1",
      } as Parameters<typeof articleListParams>[0]),
      ...published,
    });
    expect(cacheTag).toHaveBeenCalledWith("post:a", "post:b", "post:c");
    expect(cacheLife).toHaveBeenCalled();
  });

  it("skips tags for empty lists and returns empty lists for a null result", async () => {
    mockFetchWithoutSyncTags.mockResolvedValue({ data: null });
    await expect(
      getCachedArticleLists({
        params: articleListParams({
          _id: "post-1",
        } as Parameters<typeof articleListParams>[0]),
        ...published,
      }),
    ).resolves.toEqual({
      relatedPosts: [],
      upNextInFeed: null,
      moreFromAuthor: [],
    });
    expect(cacheTag).not.toHaveBeenCalled();
  });

  it("tags a school's posts by school", async () => {
    mockFetchWithoutSyncTags.mockResolvedValue({
      data: { posts: [], totalPosts: 3 },
    });
    await expect(
      getCachedSchoolPosts({
        schoolId: "school-1",
        from: 0,
        to: 8,
        ...published,
      }),
    ).resolves.toEqual({ posts: [], totalPosts: 3 });
    expect(mockFetchWithoutSyncTags).toHaveBeenCalledWith({
      query: "postsBySchoolQuery",
      params: { schoolId: "school-1", from: 0, to: 8 },
      ...published,
    });
    expect(cacheTag).toHaveBeenCalledWith("posts:school:school-1");
  });

  it("tags an author's posts by the author id from the result", async () => {
    mockFetchWithoutSyncTags.mockResolvedValue({
      data: { authorId: "author-1", posts: [], totalPosts: 0 },
    });
    await getCachedAuthorPosts({ slug: "jane", from: 0, to: 10, ...published });
    expect(cacheTag).toHaveBeenCalledWith("posts:author:author-1");
  });

  it("sets a cache life but no tag when the author isn't found", async () => {
    mockFetchWithoutSyncTags.mockResolvedValue({ data: null });
    await expect(
      getCachedAuthorPosts({ slug: "gone", from: 0, to: 10, ...published }),
    ).resolves.toBeNull();
    expect(cacheLife).toHaveBeenCalled();
    expect(cacheTag).not.toHaveBeenCalled();
  });

  const loaders = {
    articleLists: (options: typeof draft | typeof publishedStega) =>
      getCachedArticleLists({
        params: articleListParams({
          _id: "post-1",
        } as Parameters<typeof articleListParams>[0]),
        ...options,
      }),
    schoolPosts: (options: typeof draft | typeof publishedStega) =>
      getCachedSchoolPosts({
        schoolId: "school-1",
        from: 0,
        to: 8,
        ...options,
      }),
    authorPosts: (options: typeof draft | typeof publishedStega) =>
      getCachedAuthorPosts({ slug: "jane", from: 0, to: 10, ...options }),
  };

  describe.each(Object.entries(loaders))("%s", (_name, load) => {
    it.each([
      ["drafts", draft],
      ["stega", publishedStega],
    ] as const)(
      "leaves %s entries to sanityFetch's own tags and cache life",
      async (_mode, options) => {
        mockFetchWithoutSyncTags.mockResolvedValue({
          data: {
            authorId: "author-1",
            posts: [],
            totalPosts: 0,
            relatedPosts: [{ _id: "a" }],
            upNextInFeed: null,
            moreFromAuthor: [],
          },
        });
        await load(options);
        expect(cacheTag).not.toHaveBeenCalled();
        expect(cacheLife).not.toHaveBeenCalled();
      },
    );
  });
});
