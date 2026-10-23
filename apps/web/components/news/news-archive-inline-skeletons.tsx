import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

export function ConferencePickerSkeleton() {
  return <Skeleton className="mt-4 h-9 w-48 rounded-md" />;
}

export function NewsArchiveFilterBarSkeleton({
  filterBarSize = "sport",
}: {
  filterBarSize?: "sport" | "college";
}) {
  return (
    <div className="pt-5">
      <Skeleton
        className={
          filterBarSize === "college"
            ? "h-[7.5rem] w-full rounded-xl"
            : "h-[4.25rem] w-full rounded-xl"
        }
      />
    </div>
  );
}
