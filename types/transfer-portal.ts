export type Player = {
  id: number
  firstName: string
  lastName: string
  height: number | null
  weight: number | null
  highSchool: string | null
  hometown: string | null
  state: string | null
  playerImage: string | null
  instagramHandle: string | null
  twitterHandle: string | null
  position: {
    name: string
    abbreviation: string
  }
}

export type TransferSchool = {
  _id: string
  name: string
  conference: {}
  division: {}
  image: {
    _key?: string | null
    _type?: 'image' | string
    asset: {
      _type: 'reference'
      _ref: string
      metadata: {
        lqip?: string
      }
    }
    crop: {
      top: number
      bottom: number
      left: number
      right: number
    } | null
    hotspot: {
      x: number
      y: number
      height: number
      width: number
    } | null
    caption?: string | undefined
  }
}

export type TransferPortalEntry = {
  id: number
  year: number
  entryDate: string
  eligibilityYears: number | null
  isGradTransfer: boolean
  transferStatus: string
  classYear: {
    name: string
    abbreviation: string
  }
  player: Player
  previousSchool: TransferSchool
  commitmentSchool: TransferSchool
}
