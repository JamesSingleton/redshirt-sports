export type Player = {
  id: string
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
  image: {
    _type: 'image'
    caption?: string
    asset: {
      _ref: string
      _type: 'reference'
    }
  }
}
