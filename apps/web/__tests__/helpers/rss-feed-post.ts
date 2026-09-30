import type { RssFeedQueryResult } from "@redshirt-sports/sanity/types";

type FeedPost = RssFeedQueryResult[number];

export function makeFeedPost(overrides: Record<string, unknown> = {}) {
  return {
    _id: "post-1",
    title: "Hello",
    slug: "hello",
    excerpt: "Excerpt",
    publishedAt: "2026-09-28T12:00:00Z",
    image: { asset: { _ref: "img" } },
    body: [
      {
        _type: "block",
        _key: "b1",
        style: "normal",
        markDefs: [],
        children: [{ _type: "span", _key: "s1", text: "Full body text" }],
      },
    ],
    authors: ["Jane Doe", "John Smith"],
    sport: "Football",
    division: "Division I",
    sportSubgrouping: "FCS",
    conferences: [
      { name: "Southland Conference", shortName: "Southland" },
      { name: "Big Sky Conference", shortName: "" },
    ],
    tags: ["Southland", "Playoffs"],
    ...overrides,
  } as unknown as FeedPost;
}
