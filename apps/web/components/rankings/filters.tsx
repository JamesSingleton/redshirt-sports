"use client";
import { analytics } from "@redshirt-sports/analytics";
import { formatWeekSegment, weekTitle } from "@redshirt-sports/clients/espn";
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

export const RankingsFilters = ({
  years,
  weeks,
}: {
  years: Year[];
  weeks: Week[];
}) => {
  const router = useRouter();
  const { division, year, week, sport } = useParams();

  const handleYearChange = (e: string) => {
    analytics?.capture("rankings_filter_changed", {
      filter_type: "year",
      new_value: e,
      sport,
      division,
    });
    router.push(`/college/${sport}/rankings/${division}/${e}/0`);
  };

  const handleWeekChange = (e: string) => {
    analytics?.capture("rankings_filter_changed", {
      filter_type: "week",
      new_value: e,
      sport,
      division,
      year,
    });
    router.push(`/college/${sport}/rankings/${division}/${year}/${e}`);
  };

  return (
    <>
      <Select onValueChange={handleYearChange} value={year as string}>
        <SelectTrigger id="year" aria-label="Year">
          <SelectValue placeholder={year} />
        </SelectTrigger>
        <SelectContent>
          {years.map(({ year }: Year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={handleWeekChange} value={week as string}>
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
