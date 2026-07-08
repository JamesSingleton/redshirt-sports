import Link from "next/link";

import {
  buildFeedQueryString,
  feedPath,
  type TransferPortalFeedSearchParams,
} from "@/lib/transfer-portal-feed-params";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "ENTERED", label: "Entered" },
  { value: "COMMITTED", label: "Committed" },
  { value: "SIGNED", label: "Signed" },
  { value: "ENROLLED", label: "Enrolled" },
  { value: "WITHDRAWN", label: "Withdrawn" },
] as const;

interface TransferPortalFeedFiltersProps {
  sport: string;
  portalYear: number;
  useLatestYearPath: boolean;
  filters: TransferPortalFeedSearchParams;
  availableYears: number[];
}

export function TransferPortalFeedFilters({
  sport,
  portalYear,
  useLatestYearPath,
  filters,
  availableYears,
}: TransferPortalFeedFiltersProps) {
  const activeStatus = filters.status?.toUpperCase() ?? "all";
  const formAction = useLatestYearPath
    ? `/college/${sport}/transfer-portal/feed`
    : `/college/${sport}/transfer-portal/feed/${portalYear}`;

  return (
    <div className="mb-6 space-y-4">
      {availableYears.length > 1 ? (
        <nav className="flex flex-wrap gap-2">
          {availableYears.map((year) => {
            const isLatest = year === availableYears[0];
            const href = isLatest
              ? `/college/${sport}/transfer-portal/feed${buildFeedQueryString(filters)}`
              : feedPath(sport, year, filters);

            return (
              <Link
                key={year}
                href={href}
                className={
                  year === portalYear
                    ? "rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
                    : "rounded-full border border-border px-3 py-1 text-sm font-medium hover:bg-muted"
                }
              >
                {year}
              </Link>
            );
          })}
        </nav>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => {
          const nextFilters: TransferPortalFeedSearchParams = {
            ...filters,
            status: option.value === "all" ? undefined : option.value,
          };

          const href = useLatestYearPath
            ? `/college/${sport}/transfer-portal/feed${buildFeedQueryString(nextFilters)}`
            : feedPath(sport, portalYear, nextFilters);

          const isActive =
            option.value === "all"
              ? !filters.status || filters.status === "all"
              : activeStatus === option.value;

          return (
            <Link
              key={option.value}
              href={href}
              className={
                isActive
                  ? "rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
                  : "rounded-full border border-border px-3 py-1 text-sm font-medium hover:bg-muted"
              }
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      <form action={formAction} className="flex flex-wrap gap-2">
        <input
          name="position"
          defaultValue={filters.position}
          placeholder="Position (e.g. QB)"
          className="min-w-[120px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          name="school"
          defaultValue={filters.school}
          placeholder="School slug"
          className="min-w-[160px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          name="q"
          defaultValue={filters.q}
          placeholder="Player name"
          className="min-w-[160px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {filters.status ? (
          <input type="hidden" name="status" value={filters.status} />
        ) : null}
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Filter
        </button>
      </form>
    </div>
  );
}
