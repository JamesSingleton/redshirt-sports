import type { SelectPollRanking, SelectSchool } from "../schema";

export type FinalRankingWithSchool = SelectPollRanking & {
  school: SelectSchool;
  /** @deprecated alias for rank — kept for older callers */
  ranking?: number | null;
};
