"use client";
import { analytics } from "@redshirt-sports/analytics";
import {
  formatWeekSegment,
  parseWeekSegment,
  weekTitle,
} from "@redshirt-sports/clients/espn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { useParams, useRouter } from "next/navigation";

type Week = {
  week: number;
};

type Year = {
  year: number;
};

function paramValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export const RankingsFilters = ({
  years,
  weeks,
}: {
  years: Year[];
  weeks: Week[];
}) => {
  const router = useRouter();
  const { division, year, week, sport } = useParams();

  const sportSlug = paramValue(sport);
  const divisionSlug = paramValue(division);
  const yearSlug = paramValue(year);
  const weekSlug = paramValue(week);

  const handleYearChange = (nextYear: string) => {
    if (!nextYear || !sportSlug || !divisionSlug || nextYear === yearSlug) {
      return;
    }

    analytics?.capture("rankings_filter_changed", {
      filter_type: "year",
      new_value: nextYear,
      sport: sportSlug,
      division: divisionSlug,
    });
    router.push(
      `/college/${sportSlug}/rankings/${divisionSlug}/${nextYear}/${formatWeekSegment(0)}`,
    );
  };

  const handleWeekChange = (segment: string) => {
    if (!segment || !sportSlug || !divisionSlug || !yearSlug) {
      return;
    }
    if (segment === weekSlug) {
      return;
    }

    try {
      parseWeekSegment(segment);
    } catch {
      return;
    }

    analytics?.capture("rankings_filter_changed", {
      filter_type: "week",
      new_value: segment,
      sport: sportSlug,
      division: divisionSlug,
      year: yearSlug,
    });
    router.push(
      `/college/${sportSlug}/rankings/${divisionSlug}/${yearSlug}/${segment}`,
    );
  };

  return (
    <>
      <Select onValueChange={handleYearChange} value={yearSlug}>
        <SelectTrigger id="year" aria-label="Year">
          <SelectValue placeholder={yearSlug} />
        </SelectTrigger>
        <SelectContent>
          {years.map(({ year }: Year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        key={`${yearSlug}-${weekSlug}`}
        onValueChange={handleWeekChange}
        value={weekSlug}
      >
        <SelectTrigger id="ranking" aria-label="Ranking">
          <SelectValue placeholder="Preseason" />
        </SelectTrigger>
        <SelectContent>
          {weeks.map(({ week }: Week) => (
            <SelectItem key={week} value={formatWeekSegment(week)}>
              {weekTitle(week)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};
