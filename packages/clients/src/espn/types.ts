export interface ESPNApiRef {
  $ref: string
}

export interface ESPNWeeksResponse {
  count: number
  pageIndex: number
  pageSize: number
  pageCount: number
  items: ESPNApiRef[]
}

export interface ESPNWeekResponse extends Week {
  $ref: string
  rankings: ESPNApiRef
}

export type Week = {
  number: number
  startDate: string
  endDate: string
  text: string
}

export type WeekDetail = {
  number: number
  startDate: string
  endDate: string
  text: string
}

export type SeasonType = {
  id: string
  type: number
  name: string
  startDate: string
  endDate: string
  weeks?: WeekDetail[]
  week: Week | {}
}

export type Season = {
  year: number
  displayName: string
  startDate: string
  endDate: string
  types: SeasonType[]
}

export type ESPNBody = {
  seasons: Season[]
}
