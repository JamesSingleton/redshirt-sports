import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";

import {
  type NewsArchiveSearchParams,
  parseNewsArchiveFilters,
} from "@/lib/news-archive";
import { cachedRenderNewsArchivePage } from "@/lib/news-archive/cached-render";
import type { NewsArchiveScope } from "@/lib/news-archive/scope";

export function renderNewsArchiveFromFilters(
  scope: NewsArchiveScope,
  filterParams: NewsArchiveSearchParams,
  options: DynamicFetchOptions,
) {
  const { pageIndex, search, storyType, sort } =
    parseNewsArchiveFilters(filterParams);
  return cachedRenderNewsArchivePage({
    scope,
    pageIndex,
    search,
    storyType,
    sort,
    filterParams,
    perspective: options.perspective,
    stega: options.stega,
  });
}
