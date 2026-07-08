import type {
  CollegeNewsQueryResult,
  PostsByStoryTypeQueryResult,
  QueryArticlesBySportDivisionAndConferenceResult,
  QuerySportsAndDivisionNewsResult,
  QuerySportsNewsResult,
  SearchQueryResult,
} from "@redshirt-sports/sanity/types";

/** Post items rendered in paginated article feeds across news/recruiting/transfer routes. */
export type ArticleFeedItem =
  | QuerySportsNewsResult["posts"][number]
  | QuerySportsAndDivisionNewsResult["posts"][number]
  | QueryArticlesBySportDivisionAndConferenceResult["posts"][number]
  | CollegeNewsQueryResult["posts"][number]
  | PostsByStoryTypeQueryResult["posts"][number]
  | SearchQueryResult["posts"][number];
