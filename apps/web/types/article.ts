import type {
  PostsByStoryTypeQueryResult,
  QueryArticlesBySportDivisionAndConferenceResult,
  QueryCollegeNewsResult,
  QuerySportsAndDivisionNewsResult,
  QuerySportsNewsResult,
} from "@redshirt-sports/sanity/types";

/** Post items rendered in paginated article feeds across news/recruiting/transfer routes. */
export type ArticleFeedItem =
  | QuerySportsNewsResult["posts"][number]
  | QuerySportsAndDivisionNewsResult["posts"][number]
  | QueryArticlesBySportDivisionAndConferenceResult["posts"][number]
  | QueryCollegeNewsResult["posts"][number]
  | PostsByStoryTypeQueryResult["posts"][number];
