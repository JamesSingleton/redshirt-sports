export type Player = {
  id: string
  name: string
  position: string
  year: string
  height: string
  weight: string
  location: string
  previousTeam: {
    name: string
    logo: string
  }
  newTeam: {
    name?: string
    logo?: string
  }
  date: string
  imageUrl: string
  division: string
  status: 'Entered' | 'Withdrawn' | 'Committed'
}
