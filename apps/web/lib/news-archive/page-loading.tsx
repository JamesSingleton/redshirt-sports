import { NewsArchiveLoading } from "@/components/news/news-archive-loading";

/** Matches `app/college/news/loading.tsx` — shared with draft-aware Suspense fallbacks. */
export function collegeNewsArchivePageFallback() {
  return <NewsArchiveLoading filterBarSize="college" />;
}

/** Matches sport news segment loading UI. */
export function sportNewsArchivePageFallback() {
  return <NewsArchiveLoading />;
}

/** Matches division news segment loading UI. */
export function divisionNewsArchivePageFallback() {
  return <NewsArchiveLoading showConferencePicker />;
}

/** Matches conference news segment loading UI. */
export function conferenceNewsArchivePageFallback() {
  return <NewsArchiveLoading showConferencePicker />;
}
