import HomePageSkeleton from "@/components/home/home-page-skeleton";

/** Home Suspense fallback only — do not use as `app/loading.tsx` (that flashes on every route). */
export default function HomeRouteLoading() {
  return <HomePageSkeleton />;
}
