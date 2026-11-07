import { describe, expect, it } from "vitest";

import { postInvalidationTags } from "../../../packages/sanity/src/cache-tags";
import { postCacheTags } from "./tags";

describe("postCacheTags", () => {
  it("tags the post, each school, and each author once", () => {
    expect(
      postCacheTags({
        _id: "post-1",
        teams: ["school-a", "school-b", "school-a", null],
        authors: ["author-1", "author-1"],
      }),
    ).toEqual([
      "post:post-1",
      "posts:school:school-a",
      "posts:school:school-b",
      "posts:author:author-1",
    ]);
  });

  it("tags only the post when it has no references", () => {
    expect(postCacheTags({ _id: "post-1" })).toEqual(["post:post-1"]);
  });

  it("matches the tags the web app caches post lists under", () => {
    const input = {
      _id: "post-1",
      teams: ["school-a", "school-b"],
      authors: ["author-1"],
    };
    expect(postCacheTags(input)).toEqual(
      postInvalidationTags({
        postId: input._id,
        schoolIds: input.teams,
        authorIds: input.authors,
      }),
    );
  });
});
