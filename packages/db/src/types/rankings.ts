import type { SelectSchool, SelectWeeklyRankings } from "../schema";

export type FinalRankingWithSchool = SelectWeeklyRankings & {
  school: SelectSchool;
};
