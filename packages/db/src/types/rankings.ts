import type { SelectWeeklyRankings, SelectSchool } from '../schema'

export type FinalRankingWithSchool = SelectWeeklyRankings & {
  school: SelectSchool
}
