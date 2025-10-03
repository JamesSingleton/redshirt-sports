export type FinalRankingWithSchool = {
  id: string
  createdAt: Date
  updatedAt: Date
  schoolId: string
  divisionSportId: string
  weekId: string
  ranking: number
  points: number
  firstPlaceVotes: number
  isTie: boolean
  school: {
    id: string
    createdAt: Date
    updatedAt: Date
    name: string
    sanityId: string
    shortName: string
    abbreviation: string
    nickname: string
    image: any
    top25Eligible: boolean
  }
}
